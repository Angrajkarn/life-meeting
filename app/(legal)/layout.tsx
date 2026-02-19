"use client";

import { Logo } from "@/components/logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft, FileText, Shield, Scale, Search, Printer, Download, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ weight: ["600", "700", "800"], subsets: ["latin"] });

export default function LegalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const links = [
        { href: "/terms", label: "Terms of Service", icon: Scale },
        { href: "/privacy", label: "Privacy Policy", icon: Shield },
    ];

    return (
        <div className="min-h-screen bg-[#fafbfc] flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
            {/* Enterprise Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-8">
                    <div className="flex items-center gap-12">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="p-2 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                                <Logo className="w-6 h-6" showText={false} />
                            </div>
                            <div className="flex flex-col">
                                <span className={cn(montserrat.className, "text-lg font-extrabold text-slate-900 tracking-tight leading-none")}>LEGAL CENTER</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Enterprise Grade</span>
                            </div>
                        </Link>

                        {/* Search Bar - Desktop */}
                        <div className="hidden md:flex relative group w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <Input 
                                placeholder="Search our policies..." 
                                className="pl-10 h-10 bg-slate-50 border-slate-200/60 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/40 placeholder:text-slate-400 text-sm transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => window.print()}
                            className="hidden sm:flex h-10 px-4 rounded-xl gap-2 font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95"
                        >
                            <Printer className="w-4 h-4" /> 
                            <span>Print</span>
                        </Button>
                        <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block" />
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="h-10 px-4 rounded-xl gap-2 font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all active:scale-95">
                                <ArrowLeft className="w-4 h-4" /> 
                                <span>Back to Home</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
                <div className="lg:grid lg:grid-cols-12 lg:gap-16">
                    {/* Sidebar Navigation */}
                    <aside className="hidden lg:block lg:col-span-3">
                        <div className="sticky top-32 space-y-10">
                            <nav className="space-y-1.5">
                                <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Core Policies</p>
                                {links.map((link) => {
                                    const Icon = link.icon;
                                    const isActive = pathname === link.href;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className={cn(
                                                "group flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all duration-200",
                                                isActive
                                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-[1.02]"
                                                    : "text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-sm"
                                            )}
                                        >
                                            <Icon
                                                className={cn(
                                                    "flex-shrink-0 -ml-1 mr-3 h-4 w-4 transition-colors",
                                                    isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-500"
                                                )}
                                            />
                                            <span className="truncate tracking-tight">{link.label}</span>
                                            {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/40" />}
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="p-6 bg-white rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Mail className="w-16 h-16 text-indigo-900" />
                                </div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Legal Support</h3>
                                <p className="mt-3 text-[13px] text-slate-500 leading-relaxed font-medium">
                                    Our legal team is available for specific inquiries about these policies.
                                </p>
                                <Link href="mailto:legal@lifemeeting.com" className="mt-4 flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors group/link">
                                    Contact Legal 
                                    <ArrowLeft className="w-4 h-4 rotate-180 group-hover/link:translate-x-1 transition-transform" />
                                </Link>
                            </div>

                            <div className="px-3">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                                    Version 2026.1.4 <br/>
                                    Effective Feb 11, 2026
                                </p>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="lg:col-span-9">
                        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-200/60 p-10 sm:p-20 relative overflow-hidden">
                            {/* Decorative element */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                            
                            <div className="relative">
                                {children}
                            </div>
                        </div>
                        
                        {/* Mobile Support Card */}
                        <div className="lg:hidden mt-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-900">Need legal help?</h3>
                            <Link href="mailto:legal@lifemeeting.com" className="mt-2 text-sm font-medium text-indigo-600 hover:underline block">
                                legal@lifemeeting.com
                            </Link>
                        </div>
                    </main>
                </div>
            </div>

            <footer className="bg-white border-t border-slate-200/60 py-12">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2 opacity-50">
                        <Logo className="w-5 h-5 grayscale" showText={false} />
                        <span className={cn(montserrat.className, "text-sm font-bold text-slate-900 tracking-tight")}>LIFE MEETING</span>
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        &copy; 2026 Life Meeting Inc. &bull; Enterprise Communications
                    </div>
                </div>
            </footer>
        </div>
    );
}
