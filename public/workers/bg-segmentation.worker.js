/**
 * Background Segmentation Worker
 * Runs on a separate thread to avoid blocking the main thread.
 * Uses MediaPipe SelfieSegmentation via CDN (injected via importScripts).
 *
 * Message IN:  { type: 'init', config }
 *              { type: 'frame', bitmap: ImageBitmap, width, height }
 *              { type: 'stop' }
 *
 * Message OUT: { type: 'mask', bitmap: ImageBitmap }
 *              { type: 'ready' }
 *              { type: 'error', message }
 */

let segmenter: any = null;
let offscreen: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let ready = false;

// ── Initialize MediaPipe SelfieSegmentation ────────────────────────────────
async function initSegmenter() {
  try {
    // @ts-ignore — loaded via importScripts
    const { SelfieSegmentation } = globalThis;
    if (!SelfieSegmentation) {
      self.postMessage({ type: 'error', message: 'MediaPipe not available' });
      return;
    }

    segmenter = new SelfieSegmentation({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
    });

    segmenter.setOptions({
      modelSelection: 1, // 1 = general (higher quality), 0 = landscape
      selfieMode: true,
    });

    segmenter.onResults((results: any) => {
      if (!results.segmentationMask) return;
      // Post the mask back to main thread
      self.postMessage({ type: 'mask', bitmap: results.segmentationMask }, []);
    });

    await segmenter.initialize();
    ready = true;
    self.postMessage({ type: 'ready' });
  } catch (err: any) {
    self.postMessage({ type: 'error', message: err?.message || 'Init failed' });
  }
}

// ── Message handler ────────────────────────────────────────────────────────
self.onmessage = async (evt: MessageEvent) => {
  const { type } = evt.data;

  if (type === 'init') {
    try {
      // Load MediaPipe from CDN into worker scope
      importScripts(
        'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js'
      );
    } catch {
      // CDN load failed — signal fallback
      self.postMessage({ type: 'error', message: 'CDN_LOAD_FAILED' });
      return;
    }
    await initSegmenter();
    return;
  }

  if (type === 'frame') {
    if (!ready || !segmenter) return;
    const { bitmap } = evt.data as { bitmap: ImageBitmap };
    try {
      await segmenter.send({ image: bitmap });
      bitmap.close();
    } catch {
      // ignore individual frame errors
    }
    return;
  }

  if (type === 'stop') {
    if (segmenter) {
      try { await segmenter.close(); } catch {}
      segmenter = null;
    }
    ready = false;
  }
};

export {};
