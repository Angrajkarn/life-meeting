import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Processing Addendum (DPA) — Life Meeting",
  description:
    "Life Meeting's Data Processing Addendum for enterprise customers processing personal data under GDPR Article 28.",
};

export default function DPAPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <div className="mb-10">
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Legal</span>
        <h1 className="text-4xl font-black text-slate-900 mt-2">Data Processing Addendum</h1>
        <p className="text-slate-500 mt-2 text-sm">
          Effective: January 1, 2026 · GDPR Article 28 Compliant
        </p>
      </div>

      <div className="mb-8 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
        <p className="text-sm text-indigo-800 font-medium">
          This DPA is incorporated by reference into the Life Meeting Terms of Service and applies
          to all enterprise customers who process personal data on behalf of their end users using
          the Life Meeting platform.
        </p>
      </div>

      <div className="space-y-8">
        {[
          {
            title: "1. Definitions",
            body: `"Controller" means the enterprise customer. "Processor" means Life Meeting Inc. 
"Personal Data" means any information relating to an identified or identifiable natural person, 
as defined under GDPR Article 4(1). "Processing" has the meaning given in GDPR Article 4(2).`,
          },
          {
            title: "2. Scope and Nature of Processing",
            body: `Life Meeting processes Personal Data only on documented instructions from the Controller 
(i.e., enterprise subscription agreement and configuration settings). The subject-matter, duration, 
nature, and purpose of processing are determined by the Controller through platform configuration.`,
          },
          {
            title: "3. Controller Obligations",
            body: `The Controller warrants that it has a lawful basis for processing Personal Data and that it 
has provided appropriate notices to data subjects. The Controller is responsible for ensuring that 
Life Meeting may lawfully process Personal Data under this DPA.`,
          },
          {
            title: "4. Processor Obligations",
            body: `Life Meeting shall: (a) process Personal Data only on Controller's instructions; 
(b) ensure that authorised personnel are bound by confidentiality; (c) implement appropriate 
technical and organisational security measures per Article 32; (d) assist the Controller in 
fulfilling data subject rights requests; (e) delete or return data upon request.`,
          },
          {
            title: "5. Sub-processors",
            body: `Life Meeting maintains a list of approved sub-processors at /subprocessors. Prior written 
notice of at least 30 days will be given before adding new sub-processors. Controllers may object 
to new sub-processors in writing within the notice period.`,
          },
          {
            title: "6. International Data Transfers",
            body: `Life Meeting relies on the EU-US Data Privacy Framework and Standard Contractual Clauses 
(SCCs) for transfers of Personal Data outside the European Economic Area. Applicable SCCs are 
incorporated by reference into this DPA.`,
          },
          {
            title: "7. Data Subject Rights",
            body: `Life Meeting will assist Controllers in responding to data subject rights requests 
(access, rectification, erasure, portability) within the platform. Technical mechanisms for 
bulk data export and deletion are available in the Admin Dashboard.`,
          },
          {
            title: "8. Security Incidents",
            body: `Life Meeting will notify Controllers of Personal Data breaches within 72 hours of 
becoming aware, providing sufficient information to allow the Controller to meet its own 
notification obligations under GDPR Article 33.`,
          },
          {
            title: "9. Governing Law",
            body: `This DPA is governed by the laws of the State of Delaware, USA (or, for EU Controllers, 
the laws of Ireland as applicable), without regard to conflicts of law provisions.`,
          },
        ].map(({ title, body }) => (
          <section key={title}>
            <h2 className="text-xl font-bold text-slate-900 mb-3">{title}</h2>
            <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">{body}</p>
          </section>
        ))}

        <section className="p-6 bg-slate-50 rounded-xl border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Enterprise DPA Requests</h2>
          <p className="text-sm text-slate-600">
            Enterprise customers requiring a countersigned DPA for their legal records may request
            one by contacting{" "}
            <a href="mailto:legal@lifemeeting.com" className="text-indigo-600 hover:underline">
              legal@lifemeeting.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
