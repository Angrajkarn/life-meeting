"use client";

import { useState } from "react";
import { Search, ChevronRight, ChevronDown, Video, Shield, Settings, Users, CreditCard, Headphones } from "lucide-react";

const CATEGORIES = [
  {
    icon: Video, label: "Meetings", articles: [
      { title: "How to start your first meeting", views: "45K views" },
      { title: "Inviting participants to a meeting", views: "38K views" },
      { title: "Screen sharing guide", views: "29K views" },
      { title: "Using breakout rooms", views: "22K views" },
    ]
  },
  {
    icon: Shield, label: "Security & Privacy", articles: [
      { title: "Setting up two-factor authentication", views: "31K views" },
      { title: "Managing meeting passwords", views: "18K views" },
      { title: "GDPR data export request", views: "12K views" },
    ]
  },
  {
    icon: Settings, label: "Account Settings", articles: [
      { title: "Updating your profile and avatar", views: "27K views" },
      { title: "Connecting your calendar", views: "21K views" },
      { title: "Notification preferences", views: "14K views" },
    ]
  },
  {
    icon: Users, label: "Enterprise Admin", articles: [
      { title: "Setting up SSO with SAML 2.0", views: "19K views" },
      { title: "SCIM provisioning with Okta", views: "15K views" },
      { title: "Domain verification", views: "11K views" },
    ]
  },
  {
    icon: CreditCard, label: "Billing & Plans", articles: [
      { title: "Upgrading to Business or Enterprise", views: "24K views" },
      { title: "Downloading invoices", views: "17K views" },
      { title: "Cancelling your subscription", views: "9K views" },
    ]
  },
  {
    icon: Headphones, label: "Integrations", articles: [
      { title: "Connecting Google Calendar", views: "33K views" },
      { title: "Slack integration setup", views: "28K views" },
      { title: "Salesforce CRM integration", views: "16K views" },
    ]
  },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const filtered = CATEGORIES.map((c) => ({
    ...c,
    articles: c.articles.filter((a) =>
      a.title.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((c) => c.articles.length > 0);

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-900">Help Center</h1>
        <p className="text-slate-500 mt-2">Find answers, guides, and resources.</p>
        <div className="relative max-w-lg mx-auto mt-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            placeholder="Search articles, guides, FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 h-14 text-sm border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 bg-white"
          />
        </div>
      </div>

      {/* Quick links */}
      {!search && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-12">
          {CATEGORIES.map(({ icon: Icon, label }) => (
            <button
              key={label}
              onClick={() => setOpen(label)}
              className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-200 hover:shadow-sm transition-all text-center"
            >
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-700 leading-tight">{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Accordion */}
      <div className="space-y-3">
        {(search ? filtered : CATEGORIES).map((cat) => {
          const isOpen = open === cat.label || !!search;
          return (
            <div key={cat.label} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpen(isOpen && !search ? null : cat.label)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
              >
                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                  <cat.icon className="w-4 h-4" />
                </div>
                <span className="font-bold text-slate-900 flex-1">{cat.label}</span>
                <span className="text-xs text-slate-400 mr-2">{cat.articles.length} articles</span>
                {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
              </button>
              {isOpen && (
                <div className="border-t border-slate-100 divide-y divide-slate-100">
                  {cat.articles.map((a) => (
                    <div key={a.title} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 cursor-pointer group">
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                      <span className="text-sm text-slate-700 group-hover:text-indigo-600 transition-colors flex-1">{a.title}</span>
                      <span className="text-xs text-slate-400 hidden md:block">{a.views}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact support */}
      <div className="mt-12 p-6 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-black">Still need help?</p>
          <p className="text-slate-400 text-sm">Our support team is available 24/7.</p>
        </div>
        <a href="/contact" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition-colors">
          Contact Support
        </a>
      </div>
    </div>
  );
}
