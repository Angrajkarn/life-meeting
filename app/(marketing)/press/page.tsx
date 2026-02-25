import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, FileText, Image as ImageIcon, Mail, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Press & Media — Life Meeting",
  description: "Press resources, logos, executive bios, media assets, and press contact for Life Meeting.",
};

const PRESS_RELEASES = [
  { date: "Feb 2026", title: "Life Meeting Surpasses 50 Million Users, Launches AI Meeting Assistant", outlet: "PRNewswire" },
  { date: "Jan 2026", title: "Life Meeting Achieves SOC2 Type II and ISO 27001 Certification", outlet: "Business Wire" },
  { date: "Dec 2025", title: "Life Meeting Raises $50M Series B Led by Sequoia Capital", outlet: "TechCrunch" },
  { date: "Nov 2025", title: "Life Meeting Webinar Mode: 100,000 Simultaneous Attendees", outlet: "VentureBeat" },
];

const MEDIA_COVERAGE = [
  { outlet: "TechCrunch", headline: "Life Meeting is quietly becoming the enterprise Zoom killer", url: "#" },
  { outlet: "Forbes", headline: "The 25 Most Innovative Companies in Enterprise SaaS 2026", url: "#" },
  { outlet: "Wired", headline: "How Life Meeting built the most secure video platform in the world", url: "#" },
  { outlet: "The Verge", headline: "Life Meeting's AI transcription is the best we've tested", url: "#" },
];

export default function PressPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-10">
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Press Room</span>
        <h1 className="text-4xl font-black text-slate-900 mt-2">Press & Media</h1>
        <p className="text-slate-500 mt-2">Resources for journalists and media professionals.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-12 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
        {[["50M+", "Active users"], ["$53M", "Funding raised"], ["190+", "Countries"]].map(([v, l]) => (
          <div key={l} className="text-center"><p className="text-2xl font-black text-indigo-600">{v}</p><p className="text-xs text-slate-500 mt-1">{l}</p></div>
        ))}
      </div>

      {/* Press Releases */}
      <section className="mb-12">
        <h2 className="text-xl font-black text-slate-900 mb-5">Press Releases</h2>
        <div className="space-y-3">
          {PRESS_RELEASES.map((pr) => (
            <div key={pr.title} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-shadow">
              <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-sm">{pr.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">{pr.outlet} · {pr.date}</p>
              </div>
              <Link href="#" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 shrink-0">Read <ExternalLink className="w-3 h-3" /></Link>
            </div>
          ))}
        </div>
      </section>

      {/* Media Coverage */}
      <section className="mb-12">
        <h2 className="text-xl font-black text-slate-900 mb-5">Media Coverage</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {MEDIA_COVERAGE.map((m) => (
            <a key={m.headline} href={m.url} target="_blank" rel="noopener noreferrer"
              className="p-5 bg-white border border-slate-200 rounded-xl hover:shadow-md hover:border-indigo-100 transition-all group">
              <p className="text-xs font-bold text-indigo-600 mb-2">{m.outlet}</p>
              <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors leading-snug">&ldquo;{m.headline}&rdquo;</p>
            </a>
          ))}
        </div>
      </section>

      {/* Brand Assets */}
      <section className="mb-12">
        <h2 className="text-xl font-black text-slate-900 mb-5">Brand Assets</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: "Logo Pack (SVG + PNG)", icon: ImageIcon, sub: "Light, dark, and monochrome" },
            { label: "Product Screenshots", icon: ImageIcon, sub: "Hi-res, 4K, all platforms" },
            { label: "Executive Headshots", icon: ImageIcon, sub: "Leadership team photos" },
          ].map(({ label, icon: Icon, sub }) => (
            <div key={label} className="p-5 bg-white border border-slate-200 rounded-xl text-center">
              <Icon className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="font-bold text-slate-900 text-sm">{label}</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">{sub}</p>
              <button className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline mx-auto">
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">All brand assets are subject to our Brand Usage Guidelines. Contact press@lifemeeting.com for custom requests.</p>
      </section>

      {/* Press Contact */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-black text-lg">Press inquiries</p>
          <p className="text-slate-400 text-sm mt-1">Response within 2 hours on business days.</p>
        </div>
        <a href="mailto:press@lifemeeting.com" className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold text-sm transition-colors">
          <Mail className="w-4 h-4" /> press@lifemeeting.com
        </a>
      </div>
    </div>
  );
}
