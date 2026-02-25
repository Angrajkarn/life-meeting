import { Metadata } from "next";
import { Shield, Lock, Eye, Bug, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "Security — Life Meeting",
  description:
    "Life Meeting's security architecture, SOC 2 Type II certification, GDPR compliance, encryption standards, and responsible disclosure program.",
};

export default function SecurityPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10">
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Security</span>
        <h1 className="text-4xl font-black text-slate-900 mt-2">Security & Compliance</h1>
        <p className="text-slate-500 mt-2">
          Enterprise-grade security protecting 50M+ users across 190 countries.
        </p>
      </div>

      {/* Certifications */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
        {[
          { icon: Award, label: "SOC 2 Type II", sub: "Annually audited", color: "indigo" },
          { icon: Shield, label: "GDPR Compliant", sub: "EU Data Regulations", color: "emerald" },
          { icon: Lock, label: "ISO 27001", sub: "Information Security", color: "blue" },
          { icon: Shield, label: "HIPAA Ready", sub: "Healthcare compliance", color: "violet" },
          { icon: Award, label: "FedRAMP", sub: "US Government ready", color: "amber" },
          { icon: Eye, label: "CCPA Compliant", sub: "California Privacy", color: "rose" },
        ].map(({ icon: Icon, label, sub, color }) => (
          <div key={label} className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-full bg-${color}-50 flex items-center justify-center`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <p className="text-sm font-bold text-slate-900">{label}</p>
            <p className="text-xs text-slate-500">{sub}</p>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-500" /> Encryption
          </h2>
          <div className="space-y-3 text-sm text-slate-600">
            <p><strong className="text-slate-800">In Transit:</strong> All data is encrypted using TLS 1.3. Video streams use end-to-end encryption (E2EE) with AES-256-GCM.</p>
            <p><strong className="text-slate-800">At Rest:</strong> Data stored in our infrastructure is encrypted using AES-256 with AWS KMS managed keys.</p>
            <p><strong className="text-slate-800">End-to-End:</strong> For private meetings, E2EE can be enabled. Keys are never held by Life Meeting servers.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500" /> Infrastructure Security
          </h2>
          <ul className="space-y-2 text-sm text-slate-600">
            {[
              "Multi-region deployment across AWS, GCP, and Azure data centers",
              "Automated vulnerability scanning via Snyk and Dependabot",
              "Intrusion Detection Systems (IDS) on all production hosts",
              "WAF (Web Application Firewall) protecting all public endpoints",
              "Regular penetration testing by third-party security firms",
              "99.99% SLA with multi-region failover",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-indigo-400 mt-0.5">→</span> {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Bug className="w-5 h-5 text-indigo-500" /> Responsible Disclosure
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            We operate a bug bounty program through HackerOne. Security researchers who responsibly
            disclose vulnerabilities are eligible for rewards from $100 to $25,000 depending on
            severity. We commit to acknowledging reports within 24 hours and resolving critical
            vulnerabilities within 72 hours.
          </p>
          <a
            href="https://hackerone.com/lifemeeting"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
          >
            <Bug className="w-4 h-4" />
            Submit a Vulnerability Report
          </a>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Contact Security Team</h2>
          <p className="text-sm text-slate-600">
            For urgent security matters, contact{" "}
            <a href="mailto:security@lifemeeting.com" className="text-indigo-600 hover:underline font-medium">
              security@lifemeeting.com
            </a>
            . PGP key available at{" "}
            <a href="/security.asc" className="text-indigo-600 hover:underline">
              /security.asc
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
