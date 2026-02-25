"use client";

import { useState, useRef, useEffect } from "react";
import { X, Loader2, Upload, Check, Zap, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { BgConfig, BgFilterMode } from "@/hooks/useBackgroundFilter";

// ── Built-in background presets ───────────────────────────────────────────
const BLUR_PRESETS = [
  { label: "Slight", value: 6 },
  { label: "Medium", value: 12 },
  { label: "Heavy",  value: 22 },
];

const IMAGE_PRESETS: { label: string; url: string; thumb: string }[] = [
  {
    label: "Office",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1280&q=80",
    thumb: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=120&q=60",
  },
  {
    label: "Library",
    url: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1280&q=80",
    thumb: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=120&q=60",
  },
  {
    label: "Lounge",
    url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1280&q=80",
    thumb: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=120&q=60",
  },
  {
    label: "Nature",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1280&q=80",
    thumb: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=120&q=60",
  },
  {
    label: "City",
    url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1280&q=80",
    thumb: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=120&q=60",
  },
  {
    label: "Abstract",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1280&q=80",
    thumb: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&q=60",
  },
];

const VIDEO_PRESETS: { label: string; url: string; thumb: string }[] = [
  {
    label: "Rain",
    url: "https://www.w3schools.com/html/mov_bbb.mp4",  // placeholder; replace with real looping bg video
    thumb: "https://images.unsplash.com/photo-1515694346937-94d85e41e93c?w=120&q=60",
  },
];

// ── Pill tab type ─────────────────────────────────────────────────────────
type Tab = "none" | "blur" | "image" | "video";

const TABS: { id: Tab; label: string }[] = [
  { id: "none",  label: "None"  },
  { id: "blur",  label: "Blur"  },
  { id: "image", label: "Image" },
  { id: "video", label: "Video" },
];

interface BackgroundFilterPanelProps {
  onClose: () => void;
  onApply: (cfg: BgConfig) => void;
  onDisable: () => void;
  status: string;
  error?: string;
  usingFallback?: boolean;
  currentConfig?: BgConfig;
}

export function BackgroundFilterPanel({
  onClose,
  onApply,
  onDisable,
  status,
  error,
  usingFallback,
  currentConfig,
}: BackgroundFilterPanelProps) {
  const [tab, setTab] = useState<Tab>(currentConfig?.mode ?? "none");
  const [blurAmount, setBlurAmount] = useState(currentConfig?.blurAmount ?? 10);
  const [selectedImage, setSelectedImage] = useState(currentConfig?.imageUrl ?? IMAGE_PRESETS[0].url);
  const [selectedVideo, setSelectedVideo] = useState(currentConfig?.videoUrl ?? VIDEO_PRESETS[0].url);
  const [uploadedBg, setUploadedBg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preload images so compositing has src available immediately
  useEffect(() => {
    IMAGE_PRESETS.forEach((p) => {
      const img = new Image();
      img.dataset.bg = p.url;
      img.src = p.url;
      img.style.display = "none";
      document.body.appendChild(img);
    });
    return () => {
      document.querySelectorAll("img[data-bg]").forEach((el) => el.remove());
    };
  }, []);

  // ── Custom image upload ───────────────────────────────────────────────
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Security: validate type + size
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      alert("Only JPEG, PNG, WebP or GIF images are allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be under 10 MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    // Inject preload img
    const img = new Image();
    img.dataset.bg = url;
    img.src = url;
    img.style.display = "none";
    document.body.appendChild(img);
    setUploadedBg(url);
    setSelectedImage(url);
    setTab("image");
  };

  // ── Build & emit config ───────────────────────────────────────────────
  const handleApply = () => {
    if (tab === "none") { onDisable(); return; }
    const cfg: BgConfig = {
      mode: tab,
      blurAmount: tab === "blur" ? blurAmount : undefined,
      imageUrl: tab === "image" ? selectedImage : undefined,
      videoUrl: tab === "video" ? selectedVideo : undefined,
    };
    onApply(cfg);
  };

  const isLoading = status === "loading";
  const isActive  = status === "active" || status === "fallback";

  return (
    <div className="absolute bottom-16 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-sm bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Background</h3>
            {isLoading && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
            {isActive && !usingFallback && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> AI Active
              </span>
            )}
            {usingFallback && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
                <Zap className="w-3 h-3" /> Fast Blur
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-300 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}
        {usingFallback && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-300 text-xs">
            <Zap className="w-3.5 h-3.5 shrink-0" />
            Using fast blur mode — AI segmentation unavailable on this device.
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all",
                tab === t.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Panel body */}
        <div className="px-4 pb-4 pt-3 min-h-[140px]">

          {/* None */}
          {tab === "none" && (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-white/40">
              <div className="w-10 h-10 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center">
                <X className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium">No background effect</p>
            </div>
          )}

          {/* Blur */}
          {tab === "blur" && (
            <div className="space-y-4">
              {/* Presets */}
              <div className="flex gap-2">
                {BLUR_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setBlurAmount(p.value)}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-xs font-bold border transition-all",
                      blurAmount === p.value
                        ? "bg-indigo-600 border-indigo-500 text-white"
                        : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {/* Custom slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-white/40 font-medium">
                  <span>Intensity</span>
                  <span>{blurAmount}px</span>
                </div>
                <Slider
                  min={2}
                  max={25}
                  step={1}
                  value={[blurAmount]}
                  onValueChange={([v]) => setBlurAmount(v)}
                  className="[&_.slider-thumb]:bg-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Image */}
          {tab === "image" && (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {/* Upload tile */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-1 hover:border-indigo-500/60 hover:bg-white/5 transition-all group"
                >
                  <Upload className="w-4 h-4 text-white/40 group-hover:text-indigo-400 transition-colors" />
                  <span className="text-[9px] text-white/30 group-hover:text-white/50">Upload</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleUpload}
                />

                {/* Presets */}
                {[...(uploadedBg ? [{ label: "Custom", url: uploadedBg, thumb: uploadedBg }] : []), ...IMAGE_PRESETS].map((p) => (
                  <button
                    key={p.url}
                    onClick={() => setSelectedImage(p.url)}
                    className={cn(
                      "aspect-video rounded-lg overflow-hidden relative border-2 transition-all",
                      selectedImage === p.url
                        ? "border-indigo-500 shadow-lg shadow-indigo-500/30"
                        : "border-transparent hover:border-white/20"
                    )}
                  >
                    <img src={p.thumb} alt={p.label} className="w-full h-full object-cover" />
                    {selectedImage === p.url && (
                      <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Video */}
          {tab === "video" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {VIDEO_PRESETS.map((p) => (
                  <button
                    key={p.url}
                    onClick={() => setSelectedVideo(p.url)}
                    className={cn(
                      "aspect-video rounded-lg overflow-hidden relative border-2 transition-all",
                      selectedVideo === p.url
                        ? "border-indigo-500 shadow-lg shadow-indigo-500/30"
                        : "border-transparent hover:border-white/20"
                    )}
                  >
                    <img src={p.thumb} alt={p.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      {selectedVideo === p.url && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className="absolute bottom-1 left-0 right-0 text-center text-[9px] text-white/70 font-medium">{p.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-white/30 text-center">Animated video backgrounds loop seamlessly</p>
            </div>
          )}
        </div>

        {/* Footer: Apply */}
        <div className="px-4 pb-4">
          <Button
            onClick={handleApply}
            disabled={isLoading}
            className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading AI…</>
            ) : isActive ? (
              tab === "none" ? "Remove Filter" : "Update Filter"
            ) : (
              "Apply"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
