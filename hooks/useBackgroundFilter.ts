"use client";

/**
 * useBackgroundFilter — Seamless real-time background switching.
 *
 * KEY DESIGN: The <canvas> + captureStream() are created ONCE on first apply()
 * and kept alive for the component lifetime. Switching modes only changes what
 * the RAF loop draws — outputStream NEVER goes null during mode changes, so
 * VideoGrid never shows a blank frame.
 *
 * Pipeline (runs on main thread):
 *   MediaStream → hidden <video> → canvas draw loop → captureStream()
 *
 * Modes:
 *   blur  — canvas ctx.filter blur, instant, no AI needed
 *   image — MediaPipe mask → draw BG image + person cutout
 *   video — MediaPipe mask → draw BG video + person cutout
 *   none  — pass-through (disable())
 */

import { useEffect, useRef, useState, useCallback } from "react";

export type BgFilterMode = "none" | "blur" | "image" | "video";

export interface BgConfig {
  mode: BgFilterMode;
  blurAmount?: number;
  imageUrl?: string;
  videoUrl?: string;
}

interface BgFilterState {
  status: "idle" | "loading" | "active" | "fallback" | "error";
  error?: string;
  outputStream: MediaStream | null;
  previewCanvas: HTMLCanvasElement | null;
  usingFallback: boolean;
}

export interface UseBackgroundFilterReturn extends BgFilterState {
  apply: (config: BgConfig) => void;
  disable: () => void;
}

// ── Singleton segmenter (load once per page lifetime) ──────────────────────
let _segmenter: any = null;
let _segmenterLoading = false;
const _segWaiters: Array<(s: any) => void> = [];

async function getSegmenter(): Promise<any | null> {
  if (_segmenter) return _segmenter;
  if (_segmenterLoading) return new Promise((r) => _segWaiters.push(r));
  _segmenterLoading = true;

  return new Promise((resolve) => {
    const existing = document.querySelector('script[data-mediapipe="selfie"]');
    const onReady = async () => {
      try {
        const MP = (window as any).SelfieSegmentation;
        if (!MP) throw new Error("SelfieSegmentation not found");
        const seg = new MP({
          locateFile: (f: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}`,
        });
        seg.setOptions({ modelSelection: 1, selfieMode: false });
        await seg.initialize();
        _segmenter = seg;
        _segWaiters.forEach((cb) => cb(seg));
        resolve(seg);
      } catch (err) {
        console.warn("[BgFilter] MediaPipe init failed:", err);
        _segWaiters.forEach((cb) => cb(null));
        resolve(null);
      } finally {
        _segmenterLoading = false;
      }
    };

    if (existing && (window as any).SelfieSegmentation) { onReady(); return; }

    const script = document.createElement("script");
    script.setAttribute("data-mediapipe", "selfie");
    script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js";
    script.crossOrigin = "anonymous";
    script.onload = onReady;
    script.onerror = () => {
      console.warn("[BgFilter] MediaPipe CDN failed — will use blur fallback");
      _segmenterLoading = false;
      _segWaiters.forEach((cb) => cb(null));
      resolve(null);
    };
    document.head.appendChild(script);
  });
}

export function useBackgroundFilter(
  inputStream: MediaStream | null
): UseBackgroundFilterReturn {
  const [state, setState] = useState<BgFilterState>({
    status: "idle",
    outputStream: null,
    previewCanvas: null,
    usingFallback: false,
  });

  // ── Persistent refs (survive mode changes) ─────────────────────────────
  const rafRef         = useRef(0);
  const activeRef      = useRef(false);
  const configRef      = useRef<BgConfig>({ mode: "none" });

  // Created once, reused across switches
  const videoElRef     = useRef<HTMLVideoElement | null>(null);
  const outCanvasRef   = useRef<HTMLCanvasElement | null>(null);
  const outStreamRef   = useRef<MediaStream | null>(null);

  // Per-mode assets (swapped on mode change)
  const bgImageRef     = useRef<HTMLImageElement | null>(null);
  const bgVideoRef     = useRef<HTMLVideoElement | null>(null);
  const maskCanvasRef  = useRef<HTMLCanvasElement | null>(null);
  const segmenterRef   = useRef<any>(null);

  // ── Tear-down (only on disable() or unmount) ───────────────────────────
  const fullStop = useCallback(() => {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    if (outStreamRef.current) {
      outStreamRef.current.getTracks().forEach((t) => t.stop());
      outStreamRef.current = null;
    }
    videoElRef.current = null;
    outCanvasRef.current = null;
    bgVideoRef.current = null;
    bgImageRef.current = null;
    setState({ status: "idle", outputStream: null, previewCanvas: null, usingFallback: false });
  }, []);

  // ── Blur-only RAF loop ─────────────────────────────────────────────────
  const startBlurLoop = useCallback(
    (videoEl: HTMLVideoElement, canvas: HTMLCanvasElement, loopId: { id: number }) => {
      const ctx = canvas.getContext("2d")!;
      const draw = () => {
        if (!activeRef.current) return;
        if (videoEl.readyState >= 2) {
          const blur = configRef.current.blurAmount ?? 10;
          ctx.filter = `blur(${blur}px)`;
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          ctx.filter = "none";
        }
        loopId.id = requestAnimationFrame(draw);
      };
      loopId.id = requestAnimationFrame(draw);
    },
    []
  );

  // ── Segmentation RAF loop ──────────────────────────────────────────────
  const startSegmentLoop = useCallback(
    (
      videoEl: HTMLVideoElement,
      canvas: HTMLCanvasElement,
      segmenter: any,
      loopId: { id: number }
    ) => {
      const W = canvas.width, H = canvas.height;

      if (!maskCanvasRef.current) {
        const mc = document.createElement("canvas");
        mc.width = W; mc.height = H;
        maskCanvasRef.current = mc;
      }
      const maskCanvas = maskCanvasRef.current;

      // Wire up segmentation results callback — fires each time .send() resolves
      segmenter.onResults((results: any) => {
        if (!results.segmentationMask || !activeRef.current) return;
        const cfg = configRef.current;
        const outCtx = canvas.getContext("2d")!;
        const maskCtx = maskCanvas.getContext("2d")!;

        // Draw background
        if (cfg.mode === "blur") {
          outCtx.filter = `blur(${cfg.blurAmount ?? 10}px)`;
          outCtx.drawImage(videoEl, 0, 0, W, H);
          outCtx.filter = "none";
        } else if (cfg.mode === "image" && bgImageRef.current?.complete) {
          outCtx.drawImage(bgImageRef.current, 0, 0, W, H);
        } else if (cfg.mode === "video" && bgVideoRef.current) {
          outCtx.drawImage(bgVideoRef.current, 0, 0, W, H);
        } else {
          outCtx.fillStyle = "#111827";
          outCtx.fillRect(0, 0, W, H);
        }

        // Draw person (mask cutout)
        maskCtx.clearRect(0, 0, W, H);
        maskCtx.drawImage(videoEl, 0, 0, W, H);
        maskCtx.globalCompositeOperation = "destination-in";
        maskCtx.drawImage(results.segmentationMask, 0, 0, W, H);
        maskCtx.globalCompositeOperation = "source-over";
        outCtx.drawImage(maskCanvas, 0, 0);
      });

      let lastSeg = 0;
      const SEG_EVERY = 1000 / 15; // 15 fps segmentation

      const draw = (now: number) => {
        if (!activeRef.current) return;
        loopId.id = requestAnimationFrame(draw);
        if (videoEl.readyState < 2) return;
        if (now - lastSeg < SEG_EVERY) return;
        lastSeg = now;
        segmenter.send({ image: videoEl }).catch(() => {});
      };
      loopId.id = requestAnimationFrame(draw);
    },
    []
  );

  // ── apply() — main entry point, supports seamless mode switching ────────
  const apply = useCallback(
    async (cfg: BgConfig) => {
      if (!inputStream || cfg.mode === "none") { fullStop(); return; }

      // Cancel current RAF loop only (keep canvas + stream alive)
      activeRef.current = false;
      cancelAnimationFrame(rafRef.current);
      configRef.current = cfg;

      // loopId object is shared so nested rAF can cancel itself
      const loopId = { id: 0 };
      rafRef.current = loopId.id;

      // ── Ensure we have a source video element ─────────────────────────
      let videoEl = videoElRef.current;
      if (!videoEl) {
        videoEl = document.createElement("video");
        videoEl.srcObject = inputStream;
        videoEl.autoplay = true;
        videoEl.muted = true;
        videoEl.playsInline = true;
        videoEl.play().catch(() => {});
        videoElRef.current = videoEl;
      }

      // ── Ensure we have a canvas + output stream (created once) ────────
      let outCanvas = outCanvasRef.current;
      let outStream = outStreamRef.current;

      const W = videoEl.videoWidth  || inputStream.getVideoTracks()[0]?.getSettings().width  || 1280;
      const H = videoEl.videoHeight || inputStream.getVideoTracks()[0]?.getSettings().height || 720;

      if (!outCanvas) {
        outCanvas = document.createElement("canvas");
        outCanvas.width = W;
        outCanvas.height = H;
        outCanvasRef.current = outCanvas;
      }

      if (!outStream) {
        outStream = outCanvas.captureStream(30);
        // Carry audio tracks from original stream
        inputStream.getAudioTracks().forEach((t) => outStream!.addTrack(t));
        outStreamRef.current = outStream;
      }

      // ── For blur: start immediately, no AI ────────────────────────────
      if (cfg.mode === "blur") {
        activeRef.current = true;
        setState({
          status: "active",
          outputStream: outStream,
          previewCanvas: outCanvas,
          usingFallback: false,
        });
        startBlurLoop(videoEl, outCanvas, loopId);
        return;
      }

      // ── For image/video: show loading state (keep old output stream!) ─
      setState((prev) => ({
        ...prev,
        status: "loading",
        outputStream: outStream,   // ← keep showing old frame, not blank
        previewCanvas: outCanvas,
      }));

      // Pre-load background image
      if (cfg.mode === "image" && cfg.imageUrl) {
        const prev = bgImageRef.current;
        if (!prev || prev.src !== cfg.imageUrl) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = cfg.imageUrl;
          bgImageRef.current = img;
          await new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res(); });
        }
      }

      // Pre-load background video
      if (cfg.mode === "video" && cfg.videoUrl) {
        const prev = bgVideoRef.current;
        if (!prev || prev.src !== cfg.videoUrl) {
          const bgVid = document.createElement("video");
          bgVid.src = cfg.videoUrl;
          bgVid.loop = true; bgVid.muted = true; bgVid.autoplay = true; bgVid.playsInline = true;
          bgVid.crossOrigin = "anonymous";
          bgVid.play().catch(() => {});
          bgVideoRef.current = bgVid;
        }
      }

      // Ensure source video is playing
      if (videoEl.paused) videoEl.play().catch(() => {});

      // Load/reuse segmenter
      let segmenter = segmenterRef.current;
      if (!segmenter) {
        segmenter = await getSegmenter();
        segmenterRef.current = segmenter;
      }

      // Guard: user may have cancelled while awaiting
      // Bail out if a newer apply() call changed the config while we were awaiting
      if (configRef.current !== cfg) return;

      if (!segmenter) {
        // Fallback: blur when AI unavailable
        activeRef.current = true;
        setState({
          status: "fallback",
          outputStream: outStream,
          previewCanvas: outCanvas,
          usingFallback: true,
          error: "AI model unavailable — using blur fallback",
        });
        startBlurLoop(videoEl, outCanvas, loopId);
        return;
      }

      activeRef.current = true;
      setState({
        status: "active",
        outputStream: outStream,
        previewCanvas: outCanvas,
        usingFallback: false,
      });
      startSegmentLoop(videoEl, outCanvas, segmenter, loopId);
    },
    [inputStream, fullStop, startBlurLoop, startSegmentLoop]
  );

  // ── disable() ─────────────────────────────────────────────────────────
  const disable = useCallback(() => { fullStop(); }, [fullStop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { ...state, apply, disable };
}
