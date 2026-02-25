import { Metadata } from "next";
import Link from "next/link";
import {
  Building2, Shield, Users, Headphones, Globe, Zap,
  CheckCircle, ArrowRight, Star, BarChart3, Lock, Workflow
} from "lucide-react";

export const metadata: Metadata = {
  title: "Enterprise — Life Meeting | Secure Video Conferencing at Scale",
  description:
    "Life Meeting Enterprise delivers SSO, advanced analytics, compliance, dedicated support, and custom SLAs for large organisations.",
};

const PLANS = [
  {
    name: "Business",
    price: "$15",
    per: "user / month",
    desc: "For growing teams needing pro features.",
    features: [
      "Up to 500 participants", "Cloud recording (100GB)", "SSO (SAML 2.0)",
      "24/7 email support", "Advanced analytics", "Custom branding",
    ],
    cta: "Start Business",
    href: "/register?plan=business",
    highlight: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    per: "tailored pricing",
    desc: "For organisations that need everything.",
    features: [
      "Unlimited participants", "Unlimited cloud storage", "Dedicated SFU cluster",
      "99.99% SLA guarantee", "24/7 priority phone support", "SOC2 / HIPAA docs",
      "On-prem / private cloud option", "White-label & tenant override",
      "Dedicated CSM", "Custom integrations", "GDPR DPA signing",
    ],
    cta: "Talk to Sales",
    href: "/contact?type=enterprise",
    highlight: true,
  },
];

const ENTERPRISE_FEATURES = [
  { icon: Lock, title: "Zero-Trust Security", desc: "SSO, MFA, device trust, conditional access, and SCIM provisioning out of the box." },
  { icon: Globe, title: "Global Private Network", desc: "Dedicated pops, private peering, and guaranteed low-latency routing to your offices." },
  { icon: BarChart3, title: "Executive Analytics", desc: "Real-time dashboards, SCIM sync, and data export to Tableau, Looker, or your BI stack." },
  { icon: Headphones, title: "White-Glove Support", desc: "Named CSM, 15-min SLA for P1 issues, 24/7 phone bridge, and onboarding assistance." },
  { icon: Workflow, title: "Custom Integrations", desc: "Deep integrations with Salesforce, ServiceNow, Workday, SAP, and your SSO provider." },
  { icon: Shield, title: "Compliance Pack", desc: "SOC2 Type II, HIPAA, GDPR, FedRAMP, ISO 27001 documentation and BAA signing." },
];

const LOGOS = ["Acme Corp", "FinServ Global", "HealthNet", "GovTech", "EduLearn", "RetailX"];

export default function EnterprisePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold rounded-full mb-6">
            <Building2 className="w-3.5 h-3.5" /> Enterprise Grade
          </span>
          <h1 className="text-5xl font-black leading-tight">
            Video conferencing built for{" "}
            <span className="text-indigo-400">enterprise scale</span>
          </h1>
          <p className="mt-6 text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Deploy across your entire organisation with dedicated infrastructure, compliance guarantees,
            and the security controls your teams demand.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <Link
              href="/contact?type=enterprise"
              className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
            >
              Request a Demo <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/security"
              className="px-8 py-3.5 border border-slate-600 hover:border-slate-400 text-white font-bold rounded-xl transition-colors"
            >
              View Security Docs
            </Link>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <div className="bg-slate-50 border-b border-slate-200 py-8">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Trusted by industry leaders</p>
          <div className="flex flex-wrap justify-center gap-8">
            {LOGOS.map((l) => (
              <div key={l} className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600">
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enterprise features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-black text-slate-900">Enterprise-exclusive capabilities</h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto">Everything you need to deploy Life Meeting across a global organisation safely and confidently.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ENTERPRISE_FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 border border-slate-200 rounded-2xl hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-slate-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-12">Choose your plan</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`p-8 rounded-2xl border ${plan.highlight ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white border-slate-200"}`}
              >
                {plan.highlight && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold mb-4">
                    <Star className="w-3 h-3" /> Most Popular
                  </span>
                )}
                <h3 className={`text-xl font-black ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.name}</h3>
                <div className="mt-3 flex items-end gap-1">
                  <span className={`text-4xl font-black ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.price}</span>
                  <span className={`text-sm mb-1.5 ${plan.highlight ? "text-indigo-200" : "text-slate-500"}`}>{plan.per}</span>
                </div>
                <p className={`text-sm mt-2 mb-6 ${plan.highlight ? "text-indigo-200" : "text-slate-500"}`}>{plan.desc}</p>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${plan.highlight ? "text-indigo-100" : "text-slate-600"}`}>
                      <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? "text-indigo-300" : "text-emerald-500"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block w-full py-3 text-center font-bold rounded-xl transition-colors ${plan.highlight ? "bg-white text-indigo-700 hover:bg-indigo-50" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact form CTA */}
      <section className="py-16 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <Users className="w-10 h-10 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-900">Talk to our enterprise team</h2>
          <p className="text-slate-500 mt-2 mb-8">Get a personalised demo, pricing, and security review within 24 hours.</p>
          <Link href="/contact?type=enterprise" className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors inline-flex items-center gap-2">
            Schedule Enterprise Demo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
