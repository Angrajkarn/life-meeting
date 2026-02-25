"use client";

/**
 * CaptionSettingsPanel — slide-in panel for live caption settings.
 *
 * Contains:
 *   - Live / Paused status indicator
 *   - Language picker (20 languages)
 *   - Font size selector
 *   - Background opacity slider
 *   - Full scrollable transcript history
 *   - Download .txt / .vtt
 *   - Clear transcript
 */

import { useRef, useEffect, useState } from "react";
import { X, Captions, Languages, Download, Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CAPTION_LANGUAGES } from "@/hooks/useLiveCaption";
import type { TranscriptEntry } from "@/hooks/useLiveCaption";

export type FontSize = "sm" | "md" | "lg" | "xl";

interface CaptionSettingsPanelProps {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  transcript: TranscriptEntry[];
  language: string;
  fontSize: FontSize;
  bgOpacity: number;
  onSetLanguage: (lang: string) => void;
  onSetFontSize: (size: FontSize) => void;
  onSetBgOpacity: (opacity: number) => void;
  onDownloadTxt: () => void;
  onDownloadVtt: () => void;
  onClearTranscript: () => void;
  onClose: () => void;
}

export function CaptionSettingsPanel({
  isListening,
  isSupported,
  error,
  transcript,
  language,
  fontSize,
  bgOpacity,
  onSetLanguage,
  onSetFontSize,
  onSetBgOpacity,
  onDownloadTxt,
  onDownloadVtt,
  onClearTranscript,
  onClose,
}: CaptionSettingsPanelProps) {
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [langOpen, setLangOpen] = useState(false);

  // Auto-scroll transcript to bottom on new entries
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript.length]);

  const currentLang = CAPTION_LANGUAGES.find((l) => l.code === language);

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[360px] bg-[#0d0d0f]/96 border-l border-white/10 backdrop-blur-xl z-[200] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <Captions className="w-4 h-4 text-indigo-400" />
          <span className="text-white font-semibold text-sm">Live Captions</span>
          {/* Status dot */}
          <span className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
            isListening
              ? "bg-green-500/15 text-green-400"
              : "bg-white/10 text-white/40"
          )}>
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              isListening ? "bg-green-400 animate-pulse" : "bg-white/30"
            )} />
            {isListening ? "Live" : "Paused"}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Error banner ───────────────────────────────────────────────── */}
      {!isSupported && (
        <div className="mx-4 mt-3 px-4 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs">
          Live captions require <strong>Chrome</strong> or <strong>Edge</strong>.
        </div>
      )}
      {error && (
        <div className="mx-4 mt-3 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* ── Settings section ───────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-white/8 space-y-4">

        {/* Language */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
            <Languages className="w-3 h-3" /> Language
          </label>
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-white/6 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white transition-colors"
            >
              <span>{currentLang?.label ?? language}</span>
              <ChevronDown className={cn("w-4 h-4 text-white/40 transition-transform", langOpen && "rotate-180")} />
            </button>
            {langOpen && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-[#1c1c1e] border border-white/10 rounded-xl shadow-2xl z-50 max-h-52 overflow-y-auto scrollbar-hide">
                {CAPTION_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { onSetLanguage(l.code); setLangOpen(false); }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors",
                      l.code === language ? "text-indigo-400 font-semibold" : "text-white/75"
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Font size */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
            Caption Size
          </label>
          <div className="flex gap-2">
            {(["sm", "md", "lg", "xl"] as FontSize[]).map((s) => (
              <button
                key={s}
                onClick={() => onSetFontSize(s)}
                className={cn(
                  "flex-1 py-2 rounded-xl border text-xs font-semibold transition-all",
                  fontSize === s
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
                )}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* BG Opacity */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">
              Background Opacity
            </label>
            <span className="text-xs text-white/50">{bgOpacity}%</span>
          </div>
          <input
            type="range"
            min={20}
            max={95}
            value={bgOpacity}
            onChange={(e) => onSetBgOpacity(Number(e.target.value))}
            className="w-full h-1.5 accent-indigo-500 rounded-full"
          />
        </div>
      </div>

      {/* ── Transcript section ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
        <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">
          Transcript
        </span>
        <span className="text-xs text-white/30">{transcript.length} lines</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4 scrollbar-hide">
        {transcript.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/25 gap-3 py-12">
            <Captions className="w-10 h-10 opacity-30" />
            <p className="text-sm">No transcript yet</p>
            <p className="text-xs text-center leading-relaxed">
              Speak — words will appear here in real time
            </p>
          </div>
        ) : (
          transcript.map((entry) => (
            <div key={entry.id}>
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-indigo-400 text-xs font-bold">{entry.userName}</span>
                <span className="text-white/25 text-[10px]">
                  {new Date(entry.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">{entry.text}</p>
            </div>
          ))
        )}
        <div ref={transcriptEndRef} />
      </div>

      {/* ── Footer actions ──────────────────────────────────────────────── */}
      <div className="border-t border-white/10 p-4 space-y-2">
        <div className="flex gap-2">
          <button
            onClick={onDownloadTxt}
            disabled={transcript.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            .txt
          </button>
          <button
            onClick={onDownloadVtt}
            disabled={transcript.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600/60 hover:bg-indigo-700/60 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            .vtt
          </button>
        </div>
        <button
          onClick={onClearTranscript}
          disabled={transcript.length === 0}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/15 border border-white/8 hover:border-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed text-white/50 hover:text-red-400 text-sm transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear transcript
        </button>
      </div>
    </div>
  );
}
