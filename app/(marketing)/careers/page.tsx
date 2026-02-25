"use client";

import { useState } from "react";
import { MapPin, Clock, ArrowRight, Search, Building2, Code2, BarChart3, Headphones, Palette, Globe } from "lucide-react";
import Link from "next/link";

const JOBS = [
  { id: 1, dept: "Engineering", title: "Senior Backend Engineer — Real-Time Systems", location: "Remote / Bangalore", type: "Full-time", posted: "2 days ago" },
  { id: 2, dept: "Engineering", title: "Staff Frontend Engineer — React / Next.js", location: "Remote / San Francisco", type: "Full-time", posted: "1 week ago" },
  { id: 3, dept: "Engineering", title: "Infrastructure Engineer — Kubernetes & SFU", location: "Remote", type: "Full-time", posted: "3 days ago" },
  { id: 4, dept: "Product", title: "Senior Product Manager — Enterprise", location: "Remote / New York", type: "Full-time", posted: "5 days ago" },
  { id: 5, dept: "Design", title: "Senior Product Designer — Platform", location: "Remote", type: "Full-time", posted: "1 week ago" },
  { id: 6, dept: "Sales", title: "Enterprise Account Executive — EMEA", location: "London / Remote", type: "Full-time", posted: "2 days ago" },
  { id: 7, dept: "Support", title: "Enterprise Technical Support Engineer", location: "Remote / Singapore", type: "Full-time", posted: "4 days ago" },
  { id: 8, dept: "Marketing", title: "Growth Marketing Manager", location: "Remote", type: "Full-time", posted: "1 week ago" },
  { id: 9, dept: "Engineering", title: "Security Engineer — AppSec & Penetration", location: "Remote", type: "Full-time", posted: "3 days ago" },
];

const DEPTS = ["All", "Engineering", "Product", "Design", "Sales", "Support", "Marketing"];
const DEPT_ICONS: Record<string, React.ElementType> = {
  Engineering: Code2, Product: BarChart3, Design: Palette,
  Sales: Building2, Support: Headphones, Marketing: Globe,
};
const PERKS = [
  "🌍 Fully remote, flexible hours", "💚 Full healthcare (medical, dental, vision)",
  "📈 Equity for every employee", "🎓 $3,000/yr learning budget",
  "🏖️ Unlimited PTO + 20 company holidays", "🖥️ $2,000 home office setup",
  "👶 16 weeks paid parental leave", "🍕 Team retreats 2x / year",
];

export default function CareersPage() {
  const [dept, setDept] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = JOBS.filter(
    (j) =>
      (dept === "All" || j.dept === dept) &&
      j.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20 px-6 text-center">
        <h1 className="text-5xl font-black">Join the team building the future of meetings</h1>
        <p className="mt-4 text-slate-300 text-xl max-w-2xl mx-auto">
          Remote-first, globally distributed, mission-driven. Work on real-time infra at 50M user scale.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          {[["20+", "Open roles"], ["35", "Countries"], ["4.8/5", "Glassdoor rating"]].map(([v, l]) => (
            <div key={l} className="px-6 py-3 bg-white/10 rounded-xl text-center">
              <p className="text-2xl font-black text-indigo-400">{v}</p>
              <p className="text-xs text-slate-300 mt-1">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Perks */}
      <div className="bg-indigo-600 py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-white font-bold text-center mb-6 uppercase tracking-widest text-xs">What we offer</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PERKS.map((p) => (
              <div key={p} className="text-sm text-indigo-100 text-center">{p}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Job Listings */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 h-11 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {DEPTS.map((d) => (
              <button
                key={d}
                onClick={() => setDept(d)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${dept === d ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-600 hover:border-indigo-300"}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No roles match your search.</p>
            </div>
          ) : (
            filtered.map((job) => {
              const Icon = DEPT_ICONS[job.dept] ?? Code2;
              return (
                <div key={job.id} className="group flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.posted}</span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded-full font-bold">{job.dept}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
