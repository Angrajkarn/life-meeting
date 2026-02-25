import { Metadata } from "next";
import { CheckCircle, Eye, Keyboard, Volume2, Monitor, Smartphone } from "lucide-react";

export const metadata: Metadata = {
  title: "Accessibility — Life Meeting",
  description: "Life Meeting's commitment to accessibility. WCAG 2.1 AA compliance, keyboard navigation, screen reader support, and more.",
};

const FEATURES = [
  { icon: Keyboard, title: "Full Keyboard Navigation", desc: "Every feature is accessible without a mouse. Tab, Enter, Space, and arrow keys work throughout." },
  { icon: Volume2, title: "Screen Reader Support", desc: "Full ARIA labeling, live regions, and tested compatibility with NVDA, JAWS, VoiceOver, and TalkBack." },
  { icon: Eye, title: "High Contrast Mode", desc: "Auto-detecting system high-contrast support, plus manual high-contrast theme in settings." },
  { icon: Monitor, title: "Captions & Transcription", desc: "Auto-generated live captions in 40+ languages with 95%+ accuracy. Exportable SRT/VTT files." },
  { icon: Smartphone, title: "Mobile Accessibility", desc: "iOS VoiceOver and Android TalkBack tested. Dynamic text sizing and touch target compliance." },
];

export default function AccessibilityPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10">
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Commitment</span>
        <h1 className="text-4xl font-black text-slate-900 mt-2">Accessibility</h1>
        <p className="text-slate-500 mt-2">
          Life Meeting is committed to being accessible to all users, regardless of ability.
          We target <strong>WCAG 2.1 Level AA</strong> conformance across all surfaces.
        </p>
      </div>

      {/* Conformance badge */}
      <div className="flex flex-wrap gap-3 mb-10">
        {["WCAG 2.1 AA", "Section 508", "EN 301 549", "ARIA 1.2"].map((s) => (
          <div key={s} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
            <CheckCircle className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-bold text-indigo-800">{s}</span>
          </div>
        ))}
      </div>

      {/* Features */}
      <div className="space-y-5 mb-12">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-2xl">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Known issues */}
      <section className="mb-10">
        <h2 className="text-xl font-black text-slate-900 mb-4">Known Limitations</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <ul className="space-y-2 text-sm text-amber-800">
            {[
              "Real-time 3D effects in the virtual background editor may not be fully keyboard navigable (fix expected Q2 2026)",
              "Some third-party integration configuration panels may not meet full WCAG AA (ongoing improvement)",
            ].map((item) => <li key={item} className="flex gap-2"><span>•</span><span>{item}</span></li>)}
          </ul>
        </div>
      </section>

      {/* Feedback */}
      <section className="p-6 bg-slate-900 text-white rounded-2xl">
        <h2 className="text-xl font-black mb-2">Report an accessibility issue</h2>
        <p className="text-slate-400 text-sm mb-4">We take accessibility feedback seriously and aim to respond within 2 business days.</p>
        <a href="mailto:accessibility@lifemeeting.com" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-colors">
          accessibility@lifemeeting.com
        </a>
        <p className="text-xs text-slate-500 mt-4">This page conforms to WCAG 2.1 AA. Last reviewed: February 2026.</p>
      </section>
    </div>
  );
}
