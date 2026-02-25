import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceptable Use Policy — Life Meeting",
  description:
    "Life Meeting's Acceptable Use Policy defines permitted and prohibited uses of the platform.",
};

export default function AcceptableUsePage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10">
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Legal</span>
        <h1 className="text-4xl font-black text-slate-900 mt-2">Acceptable Use Policy</h1>
        <p className="text-slate-500 mt-2 text-sm">Last updated: February 2026</p>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-bold text-slate-900">Overview</h2>
          <p className="text-slate-600 leading-relaxed text-sm">
            This Acceptable Use Policy (&quot;AUP&quot;) governs your use of the Life Meeting platform and
            services. By using Life Meeting, you agree to comply with this policy. Violations may result
            in account suspension or termination.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">Permitted Use</h2>
          <ul className="mt-3 space-y-2">
            {[
              "Business video conferencing and collaboration",
              "Webinars, town halls, and online events",
              "Educational and training sessions",
              "Healthcare consultations (in compliance with applicable laws)",
              "Government and public sector communications",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">Prohibited Use</h2>
          <p className="text-sm text-slate-500 mb-3">You may not use Life Meeting to:</p>
          <ul className="space-y-2">
            {[
              "Transmit illegal, harmful, or offensive content",
              "Harass, threaten, or intimidate other users",
              "Distribute malware, spyware, or other malicious code",
              "Conduct unauthorized surveillance or recording",
              "Violate any applicable laws or regulations",
              "Infringe intellectual property rights",
              "Engage in spam or phishing",
              "Attempt to breach platform security or gain unauthorized access",
              "Mine cryptocurrency or conduct resource-intensive operations",
              "Re-sell or sub-license the service without written authorization",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-red-400 font-bold mt-0.5">✗</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">Enforcement</h2>
          <p className="text-slate-600 leading-relaxed text-sm">
            Life Meeting reserves the right to investigate violations and may suspend or terminate
            accounts without notice for serious violations. We cooperate with law enforcement
            agencies where legally required.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900">Reporting Violations</h2>
          <p className="text-slate-600 leading-relaxed text-sm">
            Report violations of this policy to{" "}
            <a href="mailto:trust@lifemeeting.com" className="text-indigo-600 hover:underline">
              trust@lifemeeting.com
            </a>
            . We review all reports within 24 hours.
          </p>
        </section>
      </div>
    </main>
  );
}
