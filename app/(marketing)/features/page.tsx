import { Metadata } from "next";
import Link from "next/link";
import {
  Video, Shield, Zap, Globe, Users, Brain, BarChart3, Lock,
  MonitorPlay, Mic, Share2, MessageSquare, FileText, Headphones,
  CheckCircle, ArrowRight
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features — Life Meeting | Enterprise Video Conferencing",
  description:
    "Explore every feature Life Meeting offers: HD video, AI transcription, end-to-end encryption, global SFU infrastructure, and enterprise integrations for 50M+ users.",
};

const FEATURES = [
  {
    icon: Video,
    color: "indigo",
    title: "Crystal-Clear HD Video",
    desc: "Up to 4K video quality with adaptive bitrate streaming. Never drop a frame, no matter the connection.",
    bullets: ["4K / 1080p / 720p adaptive", "Ultra-low 40ms latency", "Simulcast for 500+ participants"],
  },
  {
    icon: Brain,
    color: "violet",
    title: "AI-Powered Transcription",
    desc: "Real-time transcription with speaker diarisation, auto-summary, and searchable meeting notes.",
    bullets: ["40+ language support", "Speaker identification", "Auto-generated action items"],
  },
  {
    icon: Lock,
    color: "emerald",
    title: "End-to-End Encryption",
    desc: "Zero-knowledge E2EE for private meetings. Keys never leave your device.",
    bullets: ["AES-256-GCM encryption", "Perfect forward secrecy", "NIST FIPS 140-2 certified"],
  },
  {
    icon: Globe,
    color: "blue",
    title: "Global SFU Infrastructure",
    desc: "200+ PoPs across 6 continents. <50ms average latency worldwide.",
    bullets: ["AWS + GCP + Azure multi-cloud", "Anycast routing", "99.99% SLA guarantee"],
  },
  {
    icon: Share2,
    color: "amber",
    title: "Screen & App Sharing",
    desc: "Share full screen, a single app, or a browser tab. Includes remote control and annotation.",
    bullets: ["4K screen share", "Remote control support", "Whiteboard & annotations"],
  },
  {
    icon: MessageSquare,
    color: "rose",
    title: "Persistent Chat & Channels",
    desc: "Slack-like threaded chat that persists between meetings. Search across all your history.",
    bullets: ["Threads & reactions", "File sharing up to 1GB", "End-to-end encrypted chat"],
  },
  {
    icon: BarChart3,
    color: "teal",
    title: "Advanced Analytics",
    desc: "Engagement scores, attendance trends, talk-time distribution, and custom dashboards.",
    bullets: ["Per-meeting analytics", "Export to CSV / BI tools", "SCIM & SSO user data"],
  },
  {
    icon: Users,
    color: "orange",
    title: "Breakout Rooms",
    desc: "Split large meetings into smaller groups automatically or manually, with host broadcast.",
    bullets: ["Up to 200 rooms", "Auto-assignment by role", "Broadcast to all rooms"],
  },
  {
    icon: MonitorPlay,
    color: "pink",
    title: "Webinar Mode",
    desc: "Host live webinars and virtual events for up to 100,000 attendees with Q&A and polls.",
    bullets: ["100K attendee capacity", "Live polls & Q&A", "Recording & replay"],
  },
  {
    icon: Headphones,
    color: "cyan",
    title: "Noise Cancellation",
    desc: "AI-powered background noise suppression for crystal-clear audio in any environment.",
    bullets: ["Real-time AI noise removal", "Echo cancellation", "Hardware acceleration"],
  },
  {
    icon: FileText,
    color: "slate",
    title: "Meeting Recordings",
    desc: "Cloud or local recordings with auto-chaptering, speaker labels, and full-text search.",
    bullets: ["Cloud storage 1TB+", "Auto-captions (SRT/VTT)", "GDPR-compliant retention"],
  },
  {
    icon: Zap,
    color: "yellow",
    title: "Integrations Hub",
    desc: "250+ native integrations: Slack, Teams, Salesforce, HubSpot, Jira, Google Workspace.",
    bullets: ["REST & Webhook API", "Zapier & Make connectors", "Custom SSO (SAML 2.0)"],
  },
];

const COLOR_MAP: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-600", violet: "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600", blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600", rose: "bg-rose-50 text-rose-600",
  teal: "bg-teal-50 text-teal-600", orange: "bg-orange-50 text-orange-600",
  pink: "bg-pink-50 text-pink-600", cyan: "bg-cyan-50 text-cyan-600",
  slate: "bg-slate-100 text-slate-600", yellow: "bg-yellow-50 text-yellow-600",
};

export default function FeaturesPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-50 to-white pt-20 pb-16 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider mb-6">
            Platform Features
          </span>
          <h1 className="text-5xl font-black text-slate-900 leading-tight">
            Everything you need to{" "}
            <span className="text-indigo-600">meet without limits</span>
          </h1>
          <p className="mt-6 text-xl text-slate-500 leading-relaxed">
            Life Meeting is the most complete enterprise video platform — built from the ground up
            for security, scale, and productivity.
          </p>
          <div className="flex justify-center gap-4 mt-8">
            <Link
              href="/register"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
            >
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/enterprise"
              className="px-6 py-3 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl transition-colors"
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="border-y border-slate-200 bg-white py-6">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            ["50M+", "Active users"], ["190+", "Countries"], ["99.99%", "Uptime SLA"], ["<40ms", "Avg latency"],
          ].map(([val, label]) => (
            <div key={label}>
              <p className="text-3xl font-black text-indigo-600">{val}</p>
              <p className="text-sm text-slate-500 font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map(({ icon: Icon, color, title, desc, bullets }) => (
            <div
              key={title}
              className="group p-6 bg-white border border-slate-200 rounded-2xl hover:shadow-lg hover:border-indigo-100 transition-all duration-300"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${COLOR_MAP[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">{desc}</p>
              <ul className="space-y-1.5">
                {bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-white">Ready to transform how your team meets?</h2>
          <p className="text-indigo-200 mt-3">Join 50 million users choosing Life Meeting every day.</p>
          <div className="flex justify-center gap-4 mt-8">
            <Link href="/register" className="px-6 py-3 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors">
              Start free — no credit card
            </Link>
            <Link href="/enterprise" className="px-6 py-3 border border-indigo-400 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
              Enterprise demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
