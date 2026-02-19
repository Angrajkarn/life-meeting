import { Shield, Lock, Eye, Users, Globe, Trash2, Mail, Info } from "lucide-react";
import { Montserrat } from "next/font/google";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const montserrat = Montserrat({ weight: ["700", "800"], subsets: ["latin"] });

export default function PrivacyPage() {
    const highlights = [
        { icon: Shield, title: "Data Protection", desc: "Enterprise-grade encryption for all your data at rest and in transit." },
        { icon: Eye, title: "No Surveillance", desc: "We never monitor or listen to your private meetings or chat content." },
        { icon: Trash2, title: "Data Erasure", desc: "Complete control over your data with one-click account deletion." },
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Page Header */}
            <div className="mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-6">
                    <Info className="w-3 h-3" /> Updated Feb 2026
                </div>
                <h1 className={cn(montserrat.className, "text-5xl font-black text-slate-900 tracking-tight mb-6")}>
                    Privacy Policy
                </h1>
                <p className="text-xl text-slate-500 font-medium max-w-2xl leading-relaxed">
                    At Life Meeting, your privacy is our foundation. This policy outlines how we handle your data with the highest enterprise security standards.
                </p>
            </div>

            {/* Quick Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                {highlights.map((item, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-all">
                        <item.icon className="w-8 h-8 text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                    </div>
                ))}
            </div>

            {/* Detailed Sections */}
            <div className="space-y-20">
                <section id="data-collection">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Lock className="w-5 h-5" />
                        </div>
                        <h2 className={cn(montserrat.className, "text-2xl font-black text-slate-900 uppercase tracking-tight")}>
                            1. Information Collection
                        </h2>
                    </div>
                    <div className="prose prose-slate max-w-none">
                        <p className="text-slate-600 leading-relaxed text-lg mb-6">
                            Life Meeting collects information to provide a seamless enterprise communication experience. Our collection is strictly limited to what is essential.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Account Data</h4>
                                <ul className="list-none p-0 space-y-2">
                                    {["Full name and email address", "Profile image and bio", "Organization details", "Authentication credentials"].map(t => (
                                        <li key={t} className="flex items-center gap-2 text-sm text-slate-500 font-medium italic">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Service Usage</h4>
                                <ul className="list-none p-0 space-y-2">
                                    {["Log data and IP addresses", "Device information", "Meeting metadata (duration, participants)", "Browser type and version"].map(t => (
                                        <li key={t} className="flex items-center gap-2 text-sm text-slate-500 font-medium italic">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" /> {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="usage">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Globe className="w-5 h-5" />
                        </div>
                        <h2 className={cn(montserrat.className, "text-2xl font-black text-slate-900 uppercase tracking-tight")}>
                            2. Use of Information
                        </h2>
                    </div>
                    <p className="text-lg text-slate-600 leading-relaxed mb-8">
                        We process your data purely to facilitate communication and ensure platform stability. We do not monetize your personal information.
                    </p>
                    <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-sm font-medium text-slate-600 italic">
                            <div className="space-y-4">
                                <p>To enable real-time audio and video conferencing.</p>
                                <p>To facilitate persistent chat and file sharing within channels.</p>
                            </div>
                            <div className="space-y-4">
                                <p>To provide AI-powered features like real-time transcription.</p>
                                <p>To detect and mitigate security threats across the platform.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="sharing">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                            <Users className="w-5 h-5" />
                        </div>
                        <h2 className={cn(montserrat.className, "text-2xl font-black text-slate-900 uppercase tracking-tight")}>
                            3. Disclosure & Sharing
                        </h2>
                    </div>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        Data is only shared when absolutely necessary for service delivery, such as with cloud infrastructure providers (AWS/Google Cloud) or when required by law through verified legal processes.
                    </p>
                </section>

                <section id="security">
                    <div className="bg-indigo-900 rounded-[2rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                        <Shield className="absolute bottom-0 right-0 w-64 h-64 text-white/5 -mb-20 -mr-20" />
                        <h2 className={cn(montserrat.className, "text-3xl font-black mb-6 uppercase tracking-tight")}>
                            Enterprise Security
                        </h2>
                        <p className="text-xl text-indigo-100/80 leading-relaxed mb-8 max-w-2xl font-medium">
                            We employ SOC 2 compliant practices, implementing TLS 1.3 for data in transit and AES-256 for data at rest. Your meetings are protected by unique access tokens and optional waiting rooms.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            {["End-to-End Encryption", "Multi-Factor Authentication", "DDoS Protection"].map(tag => (
                                <span key={tag} className="px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-widest shadow-sm">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Support CTA */}
            <div className="mt-24 pt-12 border-t border-slate-100 text-center">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Questions about your data?</p>
                <Link href="mailto:privacy@lifemeeting.com">
                    <Button className="h-14 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95 group">
                        <Mail className="w-5 h-5 mr-3 group-hover:animate-bounce" />
                        Contact Data Protection Officer
                    </Button>
                </Link>
            </div>
        </div>
    );
}
