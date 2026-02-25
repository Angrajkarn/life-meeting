import { Metadata } from "next";
import { TrendingUp, DollarSign, Users, Globe, Mail, FileText, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Investor Relations — Life Meeting",
  description: "Financial data, funding history, board composition, and investor contact for Life Meeting.",
};

const METRICS = [
  { icon: Users, label: "Active Users", value: "50M+", growth: "+85% YoY" },
  { icon: Globe, label: "Countries", value: "190+", growth: "Global coverage" },
  { icon: TrendingUp, label: "Growth Rate", value: "85%", growth: "Year-over-year" },
  { icon: DollarSign, label: "Total Raised", value: "$53M", growth: "Series B closed" },
];

const FUNDING = [
  { round: "Seed", date: "Q3 2022", amount: "$3M", investors: "Blume Ventures, Kalaari Capital" },
  { round: "Series A", date: "Q2 2023", amount: "$8M", investors: "Matrix Partners India" },
  { round: "Series B", date: "Q4 2025", amount: "$50M", investors: "Sequoia Capital, Accel" },
];

export default function InvestorsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-10">
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Investor Relations</span>
        <h1 className="text-4xl font-black text-slate-900 mt-2">Investor Relations</h1>
        <p className="text-slate-500 mt-2">Financial information, milestones, and board resources for Life Meeting investors.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {METRICS.map(({ icon: Icon, label, value, growth }) => (
          <div key={label} className="p-5 bg-white border border-slate-200 rounded-2xl text-center">
            <Icon className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            <p className="text-[10px] font-bold text-emerald-600 mt-1">{growth}</p>
          </div>
        ))}
      </div>

      {/* Funding History */}
      <section className="mb-12">
        <h2 className="text-xl font-black text-slate-900 mb-5">Funding History</h2>
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden">
          {FUNDING.map((f) => (
            <div key={f.round} className="grid grid-cols-4 gap-4 px-6 py-4 bg-white hover:bg-slate-50 transition-colors text-sm">
              <div>
                <p className="font-bold text-slate-900">{f.round}</p>
                <p className="text-xs text-slate-400">{f.date}</p>
              </div>
              <div className="text-2xl font-black text-indigo-600 flex items-center">{f.amount}</div>
              <div className="col-span-2 flex items-center text-slate-600 text-xs">{f.investors}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 bg-white border border-slate-200 rounded-2xl">
          <Mail className="w-6 h-6 text-indigo-500 mb-3" />
          <h3 className="font-bold text-slate-900 mb-1">Investor Contact</h3>
          <p className="text-sm text-slate-500 mb-4">For existing shareholders and investment inquiries.</p>
          <a href="mailto:ir@lifemeeting.com" className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1">
            ir@lifemeeting.com <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        <div className="p-6 bg-white border border-slate-200 rounded-2xl">
          <FileText className="w-6 h-6 text-indigo-500 mb-3" />
          <h3 className="font-bold text-slate-900 mb-1">Investor Deck</h3>
          <p className="text-sm text-slate-500 mb-4">Request the latest investor presentation and data room access.</p>
          <a href="mailto:ir@lifemeeting.com?subject=Data Room Request" className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-1">
            Request access <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
