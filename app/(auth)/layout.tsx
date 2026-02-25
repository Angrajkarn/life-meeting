import { Logo } from "@/components/logo";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Star, Users, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const TRUST_ITEMS = [
  { icon: Shield, text: "SOC2 Type II · ISO 27001 · GDPR" },
  { icon: Zap, text: "99.99% uptime SLA guaranteed" },
  { icon: Users, text: "50M+ users across 190 countries" },
];

const TESTIMONIAL = {
  quote:
    "Life Meeting transformed how our 8,000-person global team collaborates. The AI transcription and security controls are unmatched.",
  name: "Sarah Chen",
  role: "CTO, Meridian Global",
  initials: "SC",
};

const FEATURES = [
  "4K video with AI noise cancellation",
  "Real-time transcription in 40+ languages",
  "End-to-end encryption for every call",
  "Smart scheduling & calendar sync",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-full flex overflow-hidden">

      {/* ── Left Panel ─────────────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between relative overflow-hidden bg-slate-950">

        {/* Hero image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/login-hero.png"
            alt="Life Meeting Platform"
            className="w-full h-full object-cover opacity-30"
          />
          {/* Multi-layer gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/90 via-slate-950/75 to-violet-950/90" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/30" />
          {/* Accent glow orbs */}
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">

          {/* Logo */}
          <Link href="/" className="inline-block w-fit">
            <Logo showText={true} textClassName="text-white text-2xl font-black" />
          </Link>

          {/* Main marketing copy */}
          <div className="flex-1 flex flex-col justify-center py-12">

            {/* Eyebrow */}
            <div className="flex items-center gap-2 mb-6">
              <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                Enterprise Video Platform
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight mb-5">
              Meetings that feel like{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                being there.
              </span>
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-md">
              Crystal-clear 4K video, AI-powered transcription, and bank-grade
              security — built for teams that can't afford to slow down.
            </p>

            {/* Feature checklist */}
            <ul className="space-y-3.5 mb-10">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-3 h-3 text-indigo-400" />
                  </div>
                  <span className="text-slate-300 text-sm font-medium">{f}</span>
                </li>
              ))}
            </ul>

            {/* Trust badges */}
            <div className="flex flex-col gap-2.5">
              {TRUST_ITEMS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-xs text-slate-500 font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial card */}
          <div className="relative z-10 mb-6">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-4 italic">
                &ldquo;{TESTIMONIAL.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                  {TESTIMONIAL.initials}
                </div>
                <div>
                  <p className="text-white text-sm font-bold">{TESTIMONIAL.name}</p>
                  <p className="text-slate-500 text-xs">{TESTIMONIAL.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>© 2026 Life Meeting Inc.</span>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
              <Link href="/security" className="hover:text-slate-400 transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel — Form ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-slate-50 dark:bg-zinc-950 relative overflow-hidden">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center justify-between p-5 border-b border-slate-200 bg-white">
          <Logo showText={true} textClassName="text-slate-900 text-xl font-black" />
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-600">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
        </div>

        {/* Desktop back button */}
        <div className="hidden lg:block absolute top-8 right-8 z-10">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:bg-slate-200/60">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Button>
          </Link>
        </div>

        {/* Form card */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-8 overflow-y-auto">
          <div className="w-full max-w-[420px] bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-zinc-800 p-8 lg:p-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
