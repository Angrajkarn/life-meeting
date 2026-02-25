"use client";

import { useState } from "react";
import { Metadata } from "next";
import { format } from "date-fns";
import { Tag, Calendar, ArrowRight, Search, Rss } from "lucide-react";
import Link from "next/link";

const CHANGELOG = [
  {
    version: "v2.8.0",
    date: "2026-02-20",
    type: "major",
    title: "AI Meeting Assistant & Noise Cancellation 2.0",
    desc: "Introducing our fully revamped AI assistant with real-time transcription, auto-summaries, action-item extraction, and speaker diarisation. Noise Cancellation 2.0 now uses hardware acceleration.",
    items: [
      { type: "new", text: "Real-time AI transcription with speaker labels (40+ languages)" },
      { type: "new", text: "Auto-generated meeting summaries and action items" },
      { type: "new", text: "Noise Cancellation 2.0 with GPU acceleration" },
      { type: "improved", text: "Reduced latency from 80ms to 40ms globally" },
      { type: "fix", text: "Fixed screen share flickering on macOS Sequoia" },
    ],
  },
  {
    version: "v2.7.5",
    date: "2026-02-10",
    type: "minor",
    title: "Enterprise Dashboard & SCIM 2.0",
    desc: "New enterprise admin dashboard with org-wide analytics, SCIM 2.0 user provisioning, and bulk policy management.",
    items: [
      { type: "new", text: "SCIM 2.0 automatic user provisioning" },
      { type: "new", text: "Org-wide meeting analytics dashboard" },
      { type: "improved", text: "SSO login now 3x faster with token caching" },
      { type: "fix", text: "Resolved SAML assertion validation edge case" },
    ],
  },
  {
    version: "v2.7.0",
    date: "2026-01-28",
    type: "major",
    title: "Breakout Rooms 3.0 & Live Translation",
    desc: "Completely rebuilt breakout rooms with auto-assignment, host broadcast, and timer controls. Live translation now covers 30 languages.",
    items: [
      { type: "new", text: "Live real-time translation in 30 languages" },
      { type: "new", text: "Breakout room auto-assignment by role or team" },
      { type: "new", text: "Host broadcast to all breakout rooms simultaneously" },
      { type: "improved", text: "Video quality in breakout rooms increased to 1080p" },
    ],
  },
  {
    version: "v2.6.8",
    date: "2026-01-15",
    type: "patch",
    title: "Security Patch & Performance Improvements",
    desc: "Critical security fixes and stability improvements across the platform.",
    items: [
      { type: "security", text: "Patched XSS vector in chat link rendering (CVE-2026-0042)" },
      { type: "fix", text: "Fixed WebSocket reconnection on poor connections" },
      { type: "improved", text: "Mobile app startup time reduced by 40%" },
    ],
  },
  {
    version: "v2.6.0",
    date: "2025-12-18",
    type: "major",
    title: "Webinar Mode & 100K Attendee Support",
    desc: "Launch of Webinar Mode supporting up to 100,000 simultaneous attendees with live polls, Q&A, and backstage.",
    items: [
      { type: "new", text: "Webinar mode with 100K attendee support" },
      { type: "new", text: "Live polls and Q&A with moderation" },
      { type: "new", text: "Backstage for panelists before going live" },
      { type: "new", text: "Webinar recording with auto-chapters" },
    ],
  },
];

const TYPE_BADGE: Record<string, string> = {
  new: "bg-emerald-100 text-emerald-700",
  improved: "bg-blue-100 text-blue-700",
  fix: "bg-amber-100 text-amber-700",
  security: "bg-red-100 text-red-700",
};
const RELEASE_BADGE: Record<string, string> = {
  major: "bg-indigo-600 text-white",
  minor: "bg-indigo-100 text-indigo-700",
  patch: "bg-slate-100 text-slate-600",
};

export default function ChangelogPage() {
  const [search, setSearch] = useState("");

  const filtered = CHANGELOG.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Product Updates</span>
          <h1 className="text-4xl font-black text-slate-900 mt-2">Changelog</h1>
          <p className="text-slate-500 mt-1">Every improvement, fix, and new feature shipped.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="Search releases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 h-10 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-52"
            />
          </div>
          <a
            href="/api/changelog/rss"
            title="RSS Feed"
            className="p-2.5 border border-slate-200 rounded-xl text-slate-500 hover:text-orange-500 hover:border-orange-200 transition-colors"
          >
            <Rss className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Releases */}
      <div className="space-y-12">
        {filtered.map((release) => (
          <div key={release.version} className="flex gap-6">
            {/* Timeline */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="w-px flex-1 bg-slate-200 mt-3" />
            </div>

            {/* Content */}
            <div className="flex-1 pb-10">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${RELEASE_BADGE[release.type]}`}>
                  {release.version}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${
                  release.type === "major" ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-500"
                }`}>
                  {release.type} release
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(release.date), "MMMM d, yyyy")}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">{release.title}</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">{release.desc}</p>
              <ul className="space-y-2">
                {release.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5 shrink-0 ${TYPE_BADGE[item.type]}`}>
                      {item.type}
                    </span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No releases match your search.</p>
        </div>
      )}

      {/* Subscribe */}
      <div className="mt-10 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-bold text-slate-900">Never miss a release</p>
          <p className="text-sm text-slate-500">Subscribe to our changelog newsletter.</p>
        </div>
        <Link
          href="/#newsletter"
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shrink-0"
        >
          Subscribe <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
