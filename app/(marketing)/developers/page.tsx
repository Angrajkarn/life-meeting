import { Metadata } from "next";
import Link from "next/link";
import { Code2, Terminal, Webhook, Key, BookOpen, ArrowRight, Copy, Globe, Zap, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Developer API — Life Meeting | REST API & SDK Docs",
  description: "Integrate Life Meeting into your product. REST API, Webhooks, WebSocket events, SDKs for JS, Python, Go, and more.",
};

const ENDPOINTS = [
  { method: "POST", path: "/v1/meetings", desc: "Create a meeting" },
  { method: "GET", path: "/v1/meetings/{id}", desc: "Get meeting details" },
  { method: "DELETE", path: "/v1/meetings/{id}", desc: "Cancel a meeting" },
  { method: "GET", path: "/v1/participants", desc: "List participants" },
  { method: "POST", path: "/v1/recordings/start", desc: "Start recording" },
  { method: "GET", path: "/v1/analytics/usage", desc: "Usage analytics" },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700",
  POST: "bg-emerald-100 text-emerald-700",
  DELETE: "bg-red-100 text-red-700",
  PUT: "bg-amber-100 text-amber-700",
  PATCH: "bg-violet-100 text-violet-700",
};

const SDKS = [
  { lang: "JavaScript / TypeScript", install: "npm install @lifemeeting/sdk", icon: "🟨" },
  { lang: "Python", install: "pip install lifemeeting-sdk", icon: "🐍" },
  { lang: "Go", install: "go get github.com/lifemeeting/sdk-go", icon: "🔵" },
  { lang: "Ruby", install: "gem install lifemeeting", icon: "💎" },
  { lang: "PHP", install: "composer require lifemeeting/sdk", icon: "🐘" },
  { lang: "Java / Kotlin", install: "implementation 'com.lifemeeting:sdk:2.0'", icon: "☕" },
];

export default function DevelopersPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-slate-900 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Code2 className="w-7 h-7 text-indigo-400" />
          </div>
          <h1 className="text-5xl font-black">Build with Life Meeting</h1>
          <p className="mt-4 text-slate-300 text-xl max-w-2xl mx-auto">
            REST API, WebSocket events, Webhooks, and native SDKs for every major language.
            Embed video conferencing into your product in minutes.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link href="#quickstart" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2">
              Quick Start <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="https://api.lifemeeting.com/docs" target="_blank" rel="noopener noreferrer" className="px-6 py-3 border border-slate-600 hover:border-slate-400 text-white font-bold rounded-xl transition-colors">
              Full API Reference ↗
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="bg-slate-800 border-y border-slate-700 py-6">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
          {[["REST + WebSocket", "API Types"], ["99.99%", "API Uptime"], ["<50ms", "P99 Latency"]].map(([v, l]) => (
            <div key={l}><p className="text-2xl font-black text-indigo-400">{v}</p><p className="text-xs text-slate-400 mt-1">{l}</p></div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-16">
        {/* Quick Start */}
        <section id="quickstart">
          <div className="flex items-center gap-3 mb-6">
            <Terminal className="w-5 h-5 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">Quick Start</h2>
          </div>
          <div className="bg-slate-900 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
              <div className="w-3 h-3 rounded-full bg-red-500" /><div className="w-3 h-3 rounded-full bg-yellow-500" /><div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-400 text-xs ml-2 font-mono">Create a meeting</span>
            </div>
            <pre className="p-6 text-sm font-mono text-slate-300 overflow-x-auto">{`curl -X POST https://api.lifemeeting.com/v1/meetings \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Q4 Product Review",
    "start_time": "2026-03-01T14:00:00Z",
    "duration_minutes": 60,
    "participants": ["alice@acme.com", "bob@acme.com"],
    "settings": {
      "recording": true,
      "e2e_encryption": true,
      "waiting_room": true
    }
  }'`}</pre>
          </div>
          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 bg-emerald-100 border-b border-emerald-200 text-xs font-bold text-emerald-700">Response 201 Created</div>
            <pre className="p-6 text-sm font-mono text-slate-700 overflow-x-auto">{`{
  "id": "mtg_01HX5K9ZYQB3N7A28C",
  "join_url": "https://meet.lifemeeting.com/j/xK9-ZYQ-B3N",
  "start_time": "2026-03-01T14:00:00Z",
  "status": "scheduled"
}`}</pre>
          </div>
        </section>

        {/* API Reference */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">Core Endpoints</h2>
          </div>
          <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
            {ENDPOINTS.map((ep) => (
              <div key={`${ep.method}-${ep.path}`} className="flex items-center gap-4 px-5 py-4 bg-white hover:bg-slate-50 transition-colors">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${METHOD_COLORS[ep.method]}`}>{ep.method}</span>
                <code className="text-sm font-mono text-slate-800 flex-1">{ep.path}</code>
                <span className="text-sm text-slate-500 hidden md:block">{ep.desc}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <a href="https://api.lifemeeting.com/docs" target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 font-bold hover:underline flex items-center justify-center gap-1">
              View all 80+ endpoints <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* Webhooks */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Webhook className="w-5 h-5 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">Webhook Events</h2>
          </div>
          <p className="text-slate-500 text-sm mb-6">Subscribe to real-time events via HTTPS POST to your endpoint.</p>
          <div className="grid md:grid-cols-2 gap-3">
            {["meeting.started", "meeting.ended", "participant.joined", "participant.left", "recording.completed", "transcription.ready"].map((event) => (
              <div key={event} className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <Zap className="w-4 h-4 text-indigo-500 shrink-0" />
                <code className="text-sm font-mono text-slate-800">{event}</code>
              </div>
            ))}
          </div>
        </section>

        {/* SDKs */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">Official SDKs</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {SDKS.map((sdk) => (
              <div key={sdk.lang} className="p-5 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{sdk.icon}</span>
                  <h3 className="font-bold text-slate-900 text-sm">{sdk.lang}</h3>
                </div>
                <code className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg block font-mono">{sdk.install}</code>
              </div>
            ))}
          </div>
        </section>

        {/* Auth */}
        <section className="p-8 bg-indigo-50 border border-indigo-100 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-black text-slate-900">Authentication</h2>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            All API requests must be authenticated using a Bearer token in the{" "}
            <code className="text-indigo-600 font-mono bg-indigo-100 px-1 py-0.5 rounded">Authorization</code> header.
            Generate API keys from your{" "}
            <Link href="/dashboard/settings" className="text-indigo-600 font-bold hover:underline">Dashboard → Settings → API</Link>.
          </p>
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <Shield className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700">Never expose your API key in client-side code. Use server-side environments only.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
