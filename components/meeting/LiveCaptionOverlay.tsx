"use client";

/**
 * LiveCaptionOverlay — CAPTIONS ONLY, no controls.
 *
 * Shows speaker name + transcribed text at the bottom of the video.
 * Partial lines animate with bouncing dots. Final lines fade out after 6s.
 * All settings (language, font, opacity, transcript) are in CaptionSettingsPanel.
 */

import { cn } from "@/lib/utils";
import type { CaptionLine } from "@/hooks/useLiveCaption";

type FontSize = "sm" | "md" | "lg" | "xl";

const FONT_SIZES: Record<FontSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-2xl",
};

interface LiveCaptionOverlayProps {
  captionLines: CaptionLine[];
  fontSize?: FontSize;
  bgOpacity?: number; // 0–100
}

export function LiveCaptionOverlay({
  captionLines,
  fontSize = "md",
  bgOpacity = 70,
}: LiveCaptionOverlayProps) {
  if (captionLines.length === 0) return null;

  return (
    <div className="absolute bottom-20 left-0 right-0 flex flex-col items-center gap-1 z-40 pointer-events-none px-6">
      {captionLines.map((line) => (
        <div
          key={line.id}
          className={cn(
            "px-5 py-2 rounded-xl text-center max-w-2xl w-fit transition-opacity duration-300",
            FONT_SIZES[fontSize],
            line.partial ? "opacity-75 italic" : "opacity-100 font-medium"
          )}
          style={{ backgroundColor: `rgba(0,0,0,${bgOpacity / 100})` }}
        >
          {/* Speaker name */}
          <span className="text-indigo-300 font-semibold not-italic mr-1.5">
            {line.userName}:
          </span>

          {/* Caption text */}
          <span className="text-white">{line.text}</span>

          {/* Typing animation dots for partial lines */}
          {line.partial && (
            <span className="ml-1.5 inline-flex gap-0.5 align-middle">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-white/60 inline-block animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
