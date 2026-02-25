import React from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Footer } from "@/components/footer";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Sticky top nav */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <Link href="/" className="flex items-center gap-2">
            <Logo showText={true} textClassName="text-slate-900 font-black" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/features" className="hover:text-indigo-600 transition-colors">Features</Link>
            <Link href="/enterprise" className="hover:text-indigo-600 transition-colors">Enterprise</Link>
            <Link href="/security" className="hover:text-indigo-600 transition-colors">Security</Link>
            <Link href="/blog" className="hover:text-indigo-600 transition-colors">Blog</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}
