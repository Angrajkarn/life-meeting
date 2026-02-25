"use client";

import { useState } from "react";
import { Calendar, Tag, ArrowRight, Search, Clock, User } from "lucide-react";
import Link from "next/link";

const POSTS = [
  {
    id: 1, slug: "ai-transcription-launch", category: "Product",
    title: "Introducing AI Meeting Transcription — The Future of Meeting Notes",
    excerpt: "Learn how our new AI transcription engine delivers real-time notes, speaker labels, and auto-generated action items in 40+ languages.",
    author: "Priya Sharma", date: "2026-02-18", readTime: "5 min", featured: true,
    tags: ["AI", "Transcription", "Product Update"],
  },
  {
    id: 2, slug: "enterprise-security-zero-trust", category: "Engineering",
    title: "How We Built Zero-Trust Security into Every Layer of Life Meeting",
    excerpt: "A deep dive into our security architecture: MFA, device trust, conditional access, SCIM, and our journey to SOC2 Type II.",
    author: "Yuki Tanaka", date: "2026-02-10", readTime: "8 min", featured: false,
    tags: ["Security", "Engineering", "SOC2"],
  },
  {
    id: 3, slug: "sfu-architecture-100k-users", category: "Engineering",
    title: "Scaling Our SFU to 100K Concurrent Users — Architecture Deep Dive",
    excerpt: "How we redesigned our Selective Forwarding Unit to handle 100K simultaneous participants without a single dropped frame.",
    author: "David Chen", date: "2026-01-30", readTime: "12 min", featured: false,
    tags: ["WebRTC", "SFU", "Scale", "Engineering"],
  },
  {
    id: 4, slug: "remote-team-productivity", category: "Remote Work",
    title: "10 Ways Remote Teams Are 40% More Productive with Life Meeting",
    excerpt: "Data from 5,000 teams using Life Meeting for 6+ months shows dramatic improvements in collaboration, decision speed, and engagement.",
    author: "Anika Müller", date: "2026-01-20", readTime: "6 min", featured: false,
    tags: ["Remote Work", "Productivity", "Research"],
  },
  {
    id: 5, slug: "gdpr-compliance-2026", category: "Legal",
    title: "Life Meeting's GDPR Compliance Guide for Enterprise Teams in 2026",
    excerpt: "Everything your legal and IT teams need to know about deploying Life Meeting compliantly in the European Union.",
    author: "Yuki Tanaka", date: "2026-01-05", readTime: "9 min", featured: false,
    tags: ["GDPR", "Compliance", "Enterprise"],
  },
  {
    id: 6, slug: "webinar-mode-launch", category: "Product",
    title: "Webinar Mode Is Here: Host 100K Attendees with Full Interactivity",
    excerpt: "Announcing Life Meeting Webinar Mode — polls, Q&A, backstage, and cloud recording for events at any scale.",
    author: "Priya Sharma", date: "2025-12-15", readTime: "4 min", featured: false,
    tags: ["Webinars", "Product Update", "Events"],
  },
];

const CATEGORIES = ["All", "Product", "Engineering", "Remote Work", "Legal"];
const CAT_COLORS: Record<string, string> = {
  Product: "bg-indigo-100 text-indigo-700", Engineering: "bg-emerald-100 text-emerald-700",
  "Remote Work": "bg-amber-100 text-amber-700", Legal: "bg-slate-100 text-slate-600",
};

export default function BlogPage() {
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");

  const featured = POSTS.find((p) => p.featured);
  const filtered = POSTS.filter(
    (p) =>
      !p.featured &&
      (cat === "All" || p.category === cat) &&
      (p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Life Meeting Blog</span>
        <h1 className="text-4xl font-black text-slate-900 mt-2">Product, Engineering & Insights</h1>
        <p className="text-slate-500 mt-2">Stories from the team building the future of work.</p>
      </div>

      {/* Featured */}
      {featured && (
        <Link href={`/blog/${featured.slug}`} className="group block mb-12 p-8 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl text-white hover:shadow-xl transition-shadow">
          <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full uppercase tracking-wider">Featured</span>
          <h2 className="text-2xl font-black mt-4 mb-2 group-hover:underline">{featured.title}</h2>
          <p className="text-indigo-200 leading-relaxed mb-4">{featured.excerpt}</p>
          <div className="flex items-center gap-4 text-xs text-indigo-200">
            <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" />{featured.author}</span>
            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{featured.date}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{featured.readTime} read</span>
          </div>
        </Link>
      )}

      {/* Filter + Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 h-11 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${cat === c ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-600 hover:border-indigo-300"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Posts grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filtered.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="group p-6 bg-white border border-slate-200 rounded-2xl hover:shadow-md hover:border-indigo-100 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${CAT_COLORS[post.category] ?? "bg-slate-100 text-slate-600"}`}>{post.category}</span>
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-2 leading-snug">{post.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">{post.excerpt}</p>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{post.author}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{post.date}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {post.tags.map((t) => (
                <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full text-[10px] font-bold text-slate-600">
                  <Tag className="w-2.5 h-2.5" />{t}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-40" /><p className="font-medium">No posts match your search.</p>
        </div>
      )}
    </div>
  );
}
