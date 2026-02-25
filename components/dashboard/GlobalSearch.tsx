"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Video, User2, ArrowRight, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  type: "meeting" | "person";
  title: string;
  subtitle: string;
  status?: string;
  code?: string;
  href: string;
  avatar?: string;
}

interface SearchResponse {
  query: string;
  meetings: SearchResult[];
  people: SearchResult[];
  total: number;
}

const STATUS_COLOR: Record<string, string> = {
  live: "bg-red-500",
  join_now: "bg-red-500",
  starting_soon: "bg-amber-500",
  scheduled: "bg-emerald-500",
};

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    api.get(`/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`)
      .then((data: SearchResponse) => {
        if (!cancelled) { setResults(data); setIsOpen(true); }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(query.length >= 2);
      }
      if (e.key === "Escape") { setIsOpen(false); inputRef.current?.blur(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [query]);

  const navigate = (href: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(href);
  };

  const allResults = results ? [...results.meetings, ...results.people] : [];

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results && debouncedQuery.length >= 2) setIsOpen(true); }}
          placeholder="Search meetings, people, or teams..."
          className="pl-9 pr-8 h-9 bg-slate-100 border-slate-200 focus:bg-white transition-all text-sm"
        />
        {isLoading && (
          <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400 animate-spin" />
        )}
        {query && !isLoading && (
          <button
            onClick={() => { setQuery(""); setResults(null); setIsOpen(false); }}
            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-1.5 left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
          {allResults.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-400">
              No results for <span className="font-semibold text-slate-600">"{query}"</span>
            </div>
          ) : (
            <>
              {/* Meetings section */}
              {results!.meetings.length > 0 && (
                <div>
                  <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Meetings
                  </p>
                  {results!.meetings.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => navigate(r.href)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{r.title}</p>
                        <p className="text-xs text-slate-400 truncate">{r.subtitle}</p>
                      </div>
                      {r.status && (
                        <span className={cn(
                          "shrink-0 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full capitalize",
                          STATUS_COLOR[r.status] ?? "bg-slate-400"
                        )}>
                          {r.status.replace("_", " ")}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* People section */}
              {results!.people.length > 0 && (
                <div className={results!.meetings.length > 0 ? "border-t border-slate-100" : ""}>
                  <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    People
                  </p>
                  {results!.people.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => navigate(r.href)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                        {r.avatar ? (
                          <img src={r.avatar} alt={r.title} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <span className="text-xs font-black text-white">
                            {r.title.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{r.title}</p>
                        <p className="text-xs text-slate-400 truncate">{r.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-slate-100 px-3 py-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {allResults.length} result{allResults.length !== 1 ? "s" : ""}
                </span>
                <span className="hidden md:flex items-center gap-1 text-[10px] text-slate-400">
                  <kbd className="bg-slate-100 rounded px-1 py-0.5 text-[9px] font-bold">Ctrl K</kbd>
                  to focus
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
