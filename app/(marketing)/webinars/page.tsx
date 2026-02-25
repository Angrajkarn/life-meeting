import { Metadata } from "next";
import Link from "next/link";
import { Video, Calendar, Users, Clock, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Webinars — Life Meeting",
  description: "Join free live webinars, product demos, and virtual events hosted by the Life Meeting team and community experts.",
};

const UPCOMING = [
  { id: 1, title: "Life Meeting AI Features: Full Walkthrough", date: "Mar 5, 2026", time: "3:00 PM IST", host: "Priya Sharma, CEO", attendees: 2341, type: "Product Demo", tag: "bg-indigo-100 text-indigo-700" },
  { id: 2, title: "Enterprise Security Deep Dive: Zero-Trust & SCIM", date: "Mar 12, 2026", time: "4:00 PM GMT", host: "Yuki Tanaka, CSO", attendees: 1872, type: "Technical", tag: "bg-emerald-100 text-emerald-700" },
  { id: 3, title: "Building Productive Remote Teams in 2026", date: "Mar 19, 2026", time: "2:00 PM EST", host: "Anika Müller, CPO", attendees: 3102, type: "Best Practices", tag: "bg-amber-100 text-amber-700" },
  { id: 4, title: "API & Webhooks: Integrating Life Meeting into Your Stack", date: "Mar 26, 2026", time: "5:00 PM IST", host: "David Chen, CTO", attendees: 987, type: "Developer", tag: "bg-violet-100 text-violet-700" },
];

const PAST = [
  { title: "Year in Review: Life Meeting 2025", views: "48K", duration: "58 min" },
  { title: "Webinar Mode Launch Event", views: "32K", duration: "45 min" },
  { title: "GDPR Compliance for Enterprise Teams", views: "21K", duration: "62 min" },
];

export default function WebinarsPage() {
  return (
    <div>
      <section className="bg-gradient-to-b from-slate-50 to-white pt-16 pb-12 px-6 text-center">
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Live Events</span>
        <h1 className="text-4xl font-black text-slate-900 mt-2">Webinars & Events</h1>
        <p className="text-slate-500 mt-2 max-w-xl mx-auto">Free live sessions from the Life Meeting team. Learn, ask questions, and connect.</p>
      </section>

      <div className="max-w-4xl mx-auto px-6 pb-16">
        {/* Upcoming */}
        <h2 className="text-2xl font-black text-slate-900 mb-6">Upcoming Events</h2>
        <div className="space-y-4 mb-14">
          {UPCOMING.map((w) => (
            <div key={w.id} className="flex flex-col md:flex-row gap-5 p-6 bg-white border border-slate-200 rounded-2xl hover:shadow-md hover:border-indigo-100 transition-all">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex flex-col items-center justify-center text-white shrink-0">
                <Video className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${w.tag}`}>{w.type}</span>
                </div>
                <h3 className="font-black text-slate-900 text-lg leading-tight mb-1">{w.title}</h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{w.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{w.time}</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{w.attendees.toLocaleString()} registered</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Hosted by {w.host}</p>
              </div>
              <div className="flex items-center">
                <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-colors flex items-center gap-2 shrink-0">
                  Register Free <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* On-demand */}
        <h2 className="text-2xl font-black text-slate-900 mb-6">On-Demand Recordings</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PAST.map((v) => (
            <div key={v.title} className="p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-md transition-shadow cursor-pointer group">
              <div className="w-full h-32 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-xl mb-4 flex items-center justify-center">
                <Video className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-indigo-600 transition-colors">{v.title}</h3>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{v.views} views</span>
                <span>{v.duration}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Host */}
        <div className="mt-12 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
          <h3 className="font-black text-slate-900 mb-2">Host a webinar with Life Meeting</h3>
          <p className="text-sm text-slate-500 mb-6">Our webinar mode supports up to 100,000 attendees with polls, Q&A, and live recording.</p>
          <Link href="/enterprise" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl inline-flex items-center gap-2 transition-colors">
            Learn about Webinar Mode <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
