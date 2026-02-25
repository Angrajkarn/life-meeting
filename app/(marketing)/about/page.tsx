import { Metadata } from "next";
import Link from "next/link";
import { Heart, Globe, Zap, Shield, Users, ArrowRight, Linkedin, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — Life Meeting",
  description: "Our story, mission, leadership team, and the values that drive us to build the world's most trusted video conferencing platform.",
};

const LEADERSHIP = [
  { name: "Priya Sharma", role: "CEO & Co-founder", bio: "Previously VP Engineering at Zoom. 15 years building real-time communications at scale.", initials: "PS", color: "bg-indigo-500" },
  { name: "David Chen", role: "CTO & Co-founder", bio: "WebRTC pioneer. Former Principal Engineer at Google Meet. Author of the QUIC-Video RFC.", initials: "DC", color: "bg-violet-500" },
  { name: "Anika Müller", role: "Chief Product Officer", bio: "Ex Figma + Notion. Obsessed with collaboration design and delightful user experiences.", initials: "AM", color: "bg-emerald-500" },
  { name: "James Okonkwo", role: "Chief Revenue Officer", bio: "Built enterprise sales teams at Salesforce and Twilio. Closed $500M+ in ARR.", initials: "JO", color: "bg-amber-500" },
  { name: "Sofia Reyes", role: "VP Engineering", bio: "Infrastructure expert. Led reliability engineering at Stripe. Champion of 99.99% uptime.", initials: "SR", color: "bg-rose-500" },
  { name: "Yuki Tanaka", role: "Chief Security Officer", bio: "Former NSA researcher. CISSP, CISM. Architected zero-trust security for Fortune 50 clients.", initials: "YT", color: "bg-blue-500" },
];

const VALUES = [
  { icon: Heart, title: "People First", desc: "We build technology that makes human connection easier, not more complicated." },
  { icon: Shield, title: "Security by Default", desc: "Every feature ships with the strongest security posture. No exceptions." },
  { icon: Globe, title: "Global by Design", desc: "Infrastructure, language support, and compliance built for every corner of the world." },
  { icon: Zap, title: "Relentless Speed", desc: "We ship fast, learn faster, and never stop improving the platform." },
];

const MILESTONES = [
  { year: "2022", event: "Founded in Bangalore with $3M seed round" },
  { year: "2023", event: "Launched public beta — 100K users in 30 days" },
  { year: "2024", event: "$50M Series B · Expanded to 190 countries · 5M users" },
  { year: "2025", event: "Enterprise launch · SOC2 Type II certified · 25M users" },
  { year: "2026", event: "50M users · 4K video · AI assistant · Global #1 SaaS rating" },
];

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="pt-20 pb-16 px-6 bg-gradient-to-b from-[#e0e0ff] to-white">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-black text-slate-900 leading-tight">
            Built to bring the world <span className="text-indigo-600">closer together</span>
          </h1>
          <p className="mt-6 text-xl text-slate-500 leading-relaxed">
            Life Meeting was born from a simple belief: technology should make it easier to look each other in the eye, 
            no matter where you are on Earth.
          </p>
        </div>
      </section>

      {/* Stats */}
      <div className="bg-white border-y border-slate-200 py-8">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[["50M+","Users worldwide"],["190+","Countries"],["2022","Founded"],["$53M","Total raised"]].map(([v,l])=>(
            <div key={l}><p className="text-3xl font-black text-indigo-600">{v}</p><p className="text-sm text-slate-500 mt-1">{l}</p></div>
          ))}
        </div>
      </div>

      {/* Mission */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-black text-slate-900 mb-4">Our mission</h2>
        <p className="text-xl text-slate-500 leading-relaxed">
          To make every conversation feel like you're in the same room — crystal clear, secure, and available to everyone, everywhere, on any device.
        </p>
      </section>

      {/* Values */}
      <section className="bg-slate-50 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-12">What we stand for</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white p-6 rounded-2xl border border-slate-200">
                <Icon className="w-8 h-8 text-indigo-600 mb-4" />
                <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-black text-slate-900 mb-10 text-center">Our story</h2>
        <div className="space-y-8">
          {MILESTONES.map((m, i) => (
            <div key={m.year} className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">{m.year.slice(2)}</div>
                {i < MILESTONES.length - 1 && <div className="w-px flex-1 bg-slate-200 my-2" />}
              </div>
              <div className="pt-2 pb-4">
                <p className="text-xs font-bold text-indigo-600 mb-1">{m.year}</p>
                <p className="text-slate-700 font-medium">{m.event}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Leadership */}
      <section className="bg-slate-50 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-12">Leadership team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LEADERSHIP.map((p) => (
              <div key={p.name} className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
                <div className={`w-14 h-14 rounded-2xl ${p.color} flex items-center justify-center text-white font-black text-lg mb-4`}>
                  {p.initials}
                </div>
                <h3 className="font-bold text-slate-900">{p.name}</h3>
                <p className="text-xs text-indigo-600 font-bold mb-2">{p.role}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{p.bio}</p>
                <div className="mt-4 flex gap-2">
                  <a href="#" className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"><Linkedin className="w-4 h-4" /></a>
                  <a href="#" className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"><Mail className="w-4 h-4" /></a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <Users className="w-10 h-10 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-2">Join our team</h2>
          <p className="text-slate-500 mb-8">We're hiring across engineering, design, sales, and more.</p>
          <Link href="/careers" className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl inline-flex items-center gap-2 transition-colors">
            View open roles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
