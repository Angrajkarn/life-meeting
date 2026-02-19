import { Scale, ShieldCheck, UserCheck, AlertTriangle, FileSignature, HelpCircle, Mail, Info } from "lucide-react";
import { Montserrat } from "next/font/google";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const montserrat = Montserrat({ weight: ["700", "800"], subsets: ["latin"] });

export default function TermsPage() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-6">
                    <Info className="w-3 h-3" /> Updated Feb 2026
                </div>
                <h1 className={cn(montserrat.className, "text-5xl font-black text-slate-900 tracking-tight mb-6")}>
                    Terms of Service
                </h1>
                <p className="text-xl text-slate-500 font-medium max-w-2xl leading-relaxed">
                    Welcome to Life Meeting. These terms govern your use of our enterprise communication platform. Please read them carefully.
                </p>
            </div>

            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
                <div className="p-8 rounded-3xl bg-indigo-900 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                    <Scale className="absolute -bottom-8 -right-8 w-32 h-32 text-white/5 group-hover:scale-110 transition-transform duration-500" />
                    <h3 className="text-lg font-black uppercase tracking-tight mb-2">The Agreement</h3>
                    <p className="text-sm text-indigo-100/80 leading-relaxed font-medium">
                        By using Life Meeting, you agree to these legal terms. This is a binding contract between you and Life Meeting Inc.
                    </p>
                </div>
                <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-100 relative overflow-hidden group">
                    <UserCheck className="absolute -bottom-8 -right-8 w-32 h-32 text-white/5 group-hover:scale-110 transition-transform duration-500" />
                    <h3 className="text-lg font-black uppercase tracking-tight mb-2">Your Responsibility</h3>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                        You are responsible for your account's security and all content you share while using our enterprise services.
                    </p>
                </div>
            </div>

            {/* Detailed Sections */}
            <div className="space-y-20">
                <section id="introduction">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <FileSignature className="w-5 h-5" />
                        </div>
                        <h2 className={cn(montserrat.className, "text-2xl font-black text-slate-900 uppercase tracking-tight")}>
                            1. Acceptance of Terms
                        </h2>
                    </div>
                    <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
                        By accessing or using Life Meeting, you confirm your agreement to be bound by these Terms and our Privacy Policy. If you are using the Services on behalf of an organization, you represent that you have the authority to bind that organization to these Terms.
                    </p>
                </section>

                <section id="usage-rights">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h2 className={cn(montserrat.className, "text-2xl font-black text-slate-900 uppercase tracking-tight")}>
                            2. Service Usage & Eligibility
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Eligibility</h4>
                            <p className="text-sm text-slate-500 font-medium italic leading-relaxed">
                                Users must be at least 13 years of age. Enterprise accounts must be managed by authorized administrators.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Compliance</h4>
                            <p className="text-sm text-slate-500 font-medium italic leading-relaxed">
                                You agree to use the service in compliance with all local, state, national, and international laws, including export control laws.
                            </p>
                        </div>
                    </div>
                </section>

                <section id="restrictions" className="bg-red-50/50 rounded-[2.5rem] p-10 sm:p-16 border border-red-100">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <h2 className={cn(montserrat.className, "text-2xl font-black text-slate-900 uppercase tracking-tight")}>
                            3. Prohibited Conduct
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                        {[
                            "Reverse engineering or tampering with the service.",
                            "Using the service for automated scraping or data mining.",
                            "Sharing harmful, illegal, or infringing content.",
                            "Bypassing security measures or authentication layers.",
                            "Conducting unauthorized performance tests."
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 items-start group">
                                <div className="mt-1 h-5 w-5 rounded bg-red-100 flex items-center justify-center text-red-600 font-black text-[10px] shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                    {i + 1}
                                </div>
                                <p className="text-sm text-slate-600 font-bold tracking-tight">{item}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="intellectual-property">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <h2 className={cn(montserrat.className, "text-2xl font-black text-slate-900 uppercase tracking-tight")}>
                            4. Intellectual Property
                        </h2>
                    </div>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        The "Life Meeting" name, logo, and all source code are the exclusive property of Life Meeting Inc. Your User Content remains yours, but you grant us a worldwide, royalty-free license to host and transmit it to fulfill the Services.
                    </p>
                </section>
            </div>

            {/* Final Notes */}
            <div className="mt-24 pt-12 border-t border-slate-100">
                <div className="bg-slate-50 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-8">
                    <div className="text-center sm:text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Legal Help Desk</p>
                        <h4 className="text-lg font-bold text-slate-900">Need specific clarifications?</h4>
                        <p className="text-sm text-slate-500 font-medium">Our legal department is here to help you understand your rights.</p>
                    </div>
                    <Link href="mailto:legal@lifemeeting.com">
                        <Button className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-black text-white font-bold transition-all hover:scale-[1.05] active:scale-95">
                            <Mail className="w-4 h-4 mr-2" /> legal@lifemeeting.com
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
