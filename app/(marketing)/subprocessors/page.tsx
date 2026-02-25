import { Metadata } from "next";
import { format } from "date-fns";
import { Shield, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Subprocessors — Life Meeting",
  description: "Complete list of Life Meeting's third-party subprocessors for GDPR Article 28 compliance.",
};

const LAST_UPDATED = "2026-02-23";

const SUBPROCESSORS = [
  // Infrastructure
  { name: "Amazon Web Services (AWS)", purpose: "Primary cloud infrastructure, storage, compute", location: "US, EU, AP", category: "Infrastructure", link: "https://aws.amazon.com/compliance/gdpr-center/" },
  { name: "Google Cloud Platform", purpose: "ML services, BigQuery analytics", location: "US, EU", category: "Infrastructure", link: "https://cloud.google.com/privacy" },
  { name: "Cloudflare", purpose: "CDN, WAF, DDoS protection, DNS, Zero Trust", location: "Global", category: "Infrastructure", link: "https://www.cloudflare.com/gdpr/" },
  // Communication
  { name: "SendGrid", purpose: "Transactional email (notifications, confirmations)", location: "US", category: "Email", link: "https://sendgrid.com/policies/privacy/" },
  { name: "Twilio", purpose: "SMS MFA, voice verification", location: "US", category: "Communication", link: "https://www.twilio.com/legal/privacy" },
  // Analytics
  { name: "Segment", purpose: "Customer data platform, analytics pipeline", location: "US", category: "Analytics", link: "https://segment.com/legal/privacy/" },
  { name: "Mixpanel", purpose: "Product analytics, funnel analysis", location: "US, EU", category: "Analytics", link: "https://mixpanel.com/legal/privacy-policy/" },
  { name: "Plausible Analytics", purpose: "Privacy-first web analytics (no cookies)", location: "EU", category: "Analytics", link: "https://plausible.io/privacy" },
  // Payments
  { name: "Stripe", purpose: "Payment processing, subscription billing", location: "US, EU", category: "Payments", link: "https://stripe.com/privacy" },
  // Security
  { name: "HackerOne", purpose: "Bug bounty program management", location: "US", category: "Security", link: "https://www.hackerone.com/privacy" },
  { name: "PagerDuty", purpose: "Incident management and alerting", location: "US", category: "Security", link: "https://www.pagerduty.com/privacy-policy/" },
  // CRM
  { name: "HubSpot", purpose: "CRM, marketing automation (enterprise leads)", location: "US", category: "CRM", link: "https://legal.hubspot.com/privacy-policy" },
  // Support
  { name: "Intercom", purpose: "Customer support chat and ticketing", location: "US, EU", category: "Support", link: "https://www.intercom.com/legal/privacy" },
  { name: "Zendesk", purpose: "Enterprise support ticket management", location: "US, EU", category: "Support", link: "https://www.zendesk.com/company/privacy/" },
];

const CATEGORIES = [...new Set(SUBPROCESSORS.map((s) => s.category))];

const CAT_COLORS: Record<string, string> = {
  Infrastructure: "bg-indigo-100 text-indigo-700",
  Email: "bg-blue-100 text-blue-700",
  Communication: "bg-cyan-100 text-cyan-700",
  Analytics: "bg-violet-100 text-violet-700",
  Payments: "bg-emerald-100 text-emerald-700",
  Security: "bg-red-100 text-red-700",
  CRM: "bg-amber-100 text-amber-700",
  Support: "bg-orange-100 text-orange-700",
};

export default function SubprocessorsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-8">
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">GDPR Article 28</span>
        <h1 className="text-4xl font-black text-slate-900 mt-2">Subprocessors</h1>
        <p className="text-slate-500 mt-2 text-sm">
          Life Meeting uses the following third-party subprocessors to operate the platform.
          All subprocessors are bound by data processing agreements and assessed annually.
        </p>
        <div className="flex items-center gap-2 mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl w-fit">
          <Shield className="w-4 h-4 text-indigo-500" />
          <span className="text-xs text-slate-600 font-medium">
            Last updated: {format(new Date(LAST_UPDATED), "MMMM d, yyyy")} ·{" "}
            <span className="font-bold">{SUBPROCESSORS.length} subprocessors</span>
          </span>
        </div>
      </div>

      {/* Notice */}
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-xs text-blue-800 leading-relaxed">
          <strong>Notification policy:</strong> Life Meeting will provide 30 days advance notice via email before adding new
          subprocessors. Enterprise customers may object to new subprocessors within the notice period as outlined in their DPA.
          To receive notifications, ensure your admin email is up to date in <strong>Dashboard → Settings</strong>.
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Subprocessor</th>
              <th className="text-left px-5 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Purpose</th>
              <th className="text-left px-4 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Category</th>
              <th className="text-left px-4 py-4 font-bold text-slate-700 text-xs uppercase tracking-wider">Location</th>
              <th className="px-4 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {SUBPROCESSORS.map((sp) => (
              <tr key={sp.name} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">{sp.name}</td>
                <td className="px-5 py-4 text-slate-600 max-w-[250px]">{sp.purpose}</td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${CAT_COLORS[sp.category]}`}>{sp.category}</span>
                </td>
                <td className="px-4 py-4 text-slate-500 text-xs whitespace-nowrap">{sp.location}</td>
                <td className="px-4 py-4">
                  <a href={sp.link} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:text-indigo-700 transition-colors" title="Privacy Policy">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Contact */}
      <div className="mt-8 p-5 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-black">Questions about subprocessors?</p>
          <p className="text-slate-400 text-sm">Contact our Data Protection Officer.</p>
        </div>
        <a href="mailto:dpo@lifemeeting.com" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-colors shrink-0">
          dpo@lifemeeting.com
        </a>
      </div>
    </div>
  );
}
