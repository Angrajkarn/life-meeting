"use client";

import { useState } from "react";
import { Mail, Phone, MessageSquare, Loader2, CheckCircle, AlertCircle, Building2, ArrowRight } from "lucide-react";

const INQUIRY_TYPES = [
  { value: "general", label: "General Inquiry" },
  { value: "enterprise", label: "Enterprise Sales" },
  { value: "support", label: "Technical Support" },
  { value: "press", label: "Press / Media" },
  { value: "partnership", label: "Partnership" },
  { value: "legal", label: "Legal" },
];

type FormState = "idle" | "loading" | "success" | "error";

export default function ContactPage() {
  const [state, setState] = useState<FormState>("idle");
  const [formData, setFormData] = useState({
    name: "", email: "", company: "", type: "general", message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setState("success");
  };

  const set = (k: string, v: string) => setFormData((p) => ({ ...p, [k]: v }));

  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="text-center mb-14">
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Get in Touch</span>
        <h1 className="text-4xl font-black text-slate-900 mt-2">Contact Life Meeting</h1>
        <p className="text-slate-500 mt-2">Our team responds within 2 business hours for enterprise inquiries.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-12">
        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-6">
          {[
            { icon: Mail, title: "Email", lines: ["hello@lifemeeting.com", "enterprise@lifemeeting.com"] },
            { icon: Phone, title: "Phone (Enterprise)", lines: ["+1 (888) 555-0100", "Mon–Fri 9am–6pm EST"] },
            { icon: MessageSquare, title: "Live Chat", lines: ["Available in the dashboard", "< 2 min response time"] },
            { icon: Building2, title: "Headquarters", lines: ["Bengaluru, India", "New York · London · Singapore"] },
          ].map(({ icon: Icon, title, lines }) => (
            <div key={title} className="flex gap-4 p-5 bg-white border border-slate-200 rounded-2xl">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm">{title}</p>
                {lines.map((l) => <p key={l} className="text-sm text-slate-500">{l}</p>)}
              </div>
            </div>
          ))}
          <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <p className="text-sm font-bold text-slate-900 mb-1">Enterprise demo</p>
            <p className="text-xs text-slate-500 mb-3">Get a personalised walkthrough with a solutions engineer.</p>
            <a href="?type=enterprise" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline">
              Book a demo <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-3">
          {state === "success" ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Message received!</h3>
              <p className="text-slate-500 max-w-sm">Our team will respond to <strong>{formData.email}</strong> within 2 business hours.</p>
              <button onClick={() => { setState("idle"); setFormData({ name: "", email: "", company: "", type: "general", message: "" }); }}
                className="mt-2 text-sm text-indigo-600 font-bold hover:underline">Send another message</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-slate-200 rounded-2xl p-8">
              <h2 className="text-lg font-black text-slate-900 mb-6">Send us a message</h2>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { key: "name", label: "Full Name", placeholder: "Jane Smith", type: "text" },
                  { key: "email", label: "Work Email", placeholder: "jane@company.com", type: "email" },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
                    <input
                      type={type}
                      placeholder={placeholder}
                      value={formData[key as keyof typeof formData]}
                      onChange={(e) => set(key, e.target.value)}
                      required
                      className="w-full h-11 px-4 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Company</label>
                  <input
                    type="text" placeholder="Acme Corp"
                    value={formData.company}
                    onChange={(e) => set("company", e.target.value)}
                    className="w-full h-11 px-4 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Inquiry Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => set("type", e.target.value)}
                    className="w-full h-11 px-4 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white"
                  >
                    {INQUIRY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Message</label>
                <textarea
                  placeholder="Tell us how we can help..."
                  value={formData.message}
                  onChange={(e) => set("message", e.target.value)}
                  required
                  rows={5}
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
                />
              </div>

              {state === "error" && (
                <div className="flex items-center gap-2 text-xs text-red-600">
                  <AlertCircle className="w-4 h-4" /> Something went wrong. Please try again.
                </div>
              )}

              <button
                type="submit"
                disabled={state === "loading"}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {state === "loading" ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : "Send Message"}
              </button>
              <p className="text-[10px] text-slate-400 text-center">Protected by reCAPTCHA. Privacy Policy and Terms apply.</p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
