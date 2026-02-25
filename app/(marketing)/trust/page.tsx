import { Metadata } from "next";
import Link from "next/link";
import { Shield, Award, Lock, Eye, FileText, Download, CheckCircle, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Trust Center — Life Meeting",
  description: "Life Meeting's Trust Center: SOC2, GDPR, ISO 27001, HIPAA, FedRAMP documentation, security reports, and compliance resources.",
};

const CERTS = [
  { name: "SOC 2 Type II", icon: Award, date: "Feb 2026", desc: "Independently audited controls for security, availability, and confidentiality.", color: "indigo" },
  { name: "ISO 27001", icon: Shield, date: "Jan 2026", desc: "International standard for information security management systems.", color: "blue" },
  { name: "GDPR", icon: Lock, date: "Ongoing", desc: "Full compliance with EU General Data Protection Regulation.", color: "emerald" },
  { name: "HIPAA Ready", icon: Eye, date: "Q4 2025", desc: "BAA available for covered entities processing health information.", color: "violet" },
  { name: "FedRAMP (In Progress)", icon: Shield, date: "Est. Q3 2026", desc: "US federal government cloud security authorization in progress.", color: "amber" },
  { name: "CCPA", icon: FileText, date: "Ongoing", desc: "California Consumer Privacy Act — full rights management.", color: "rose" },
];

const RESOURCES = [
  { title: "Security Whitepaper", desc: "Technical deep-dive into our security architecture, encryption, and controls.", icon: FileText },
  { title: "SOC2 Report (Customer)", desc: "Request the latest SOC2 Type II report for enterprise customers.", icon: Award },
  { title: "Penetration Test Summary", desc: "Annual third-party pen test summary (redacted).", icon: Shield },
  { title: "Data Processing Addendum", desc: "Standard DPA for GDPR compliance, ready to countersign.", icon: FileText },
  { title: "Privacy Impact Assessment", desc: "PIA template for organisations deploying Life Meeting.", icon: Eye },
  { title: "Vulnerability Disclosure", desc: "Our responsible disclosure policy and HackerOne program.", icon: Lock },
];

const COLOR_MAP: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  violet: "bg-violet-50 text-violet-600 border-violet-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  rose: "bg-rose-50 text-rose-600 border-rose-100",
};

export default function TrustPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-800 text-white py-20 px-6 text-center">
        <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield className="w-7 h-7 text-indigo-400" />
        </div>
        <h1 className="text-5xl font-black">Trust Center</h1>
        <p className="mt-4 text-slate-300 text-xl max-w-2xl mx-auto">
          Transparency is at the heart of everything we build. Here's everything you need to
          verify that Life Meeting is secure, compliant, and trustworthy.
        </p>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-16 space-y-16">
        {/* Certifications */}
        <section>
          <h2 className="text-3xl font-black text-slate-900 mb-8">Certifications & Compliance</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CERTS.map(({ name, icon: Icon, date, desc, color }) => (
              <div key={name} className={`p-6 rounded-2xl border ${COLOR_MAP[color]} bg-opacity-50`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${COLOR_MAP[color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold opacity-70">{date}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-1">{name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600 font-bold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {name.includes("In Progress") ? "In Progress" : "Certified"}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Resources */}
        <section>
          <h2 className="text-3xl font-black text-slate-900 mb-8">Security Resources</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {RESOURCES.map(({ title, desc, icon: Icon }) => (
              <div key={title} className="flex items-start gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:shadow-md hover:border-indigo-100 transition-all group cursor-pointer">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{desc}</p>
                </div>
                <Download className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0 mt-0.5" />
              </div>
            ))}
          </div>
        </section>

        {/* Security practices */}
        <section className="bg-slate-50 rounded-3xl p-8">
          <h2 className="text-2xl font-black text-slate-900 mb-6">Security Practices</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              "All data encrypted with AES-256 at rest and TLS 1.3 in transit",
              "End-to-end encryption available for private meetings",
              "Annual penetration tests by certified third parties",
              "Employee background checks and security training",
              "Bug bounty program via HackerOne ($100–$25K rewards)",
              "24/7 security monitoring and incident response",
              "Secrets management with AWS KMS and HashiCorp Vault",
              "Zero-trust network architecture — no perimeter trust",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-6 bg-indigo-600 text-white rounded-2xl">
          <div>
            <p className="font-black text-lg">Security questions?</p>
            <p className="text-indigo-200 text-sm">Our security team responds within 24 hours.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/security" className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2">
              Security page <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="mailto:security@lifemeeting.com" className="px-4 py-2.5 bg-white text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-50 transition-colors">
              Contact Security
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
