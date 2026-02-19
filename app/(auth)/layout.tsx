import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen w-full lg:grid lg:grid-cols-2 relative h-full">

            {/* Mobile Home Button (absolute) */}
            <div className="lg:hidden absolute top-4 left-4 z-50">
                <Link href="/">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                </Link>
            </div>

            {/* Left Side - Visuals & Branding */}
            <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-12 text-white relative overflow-hidden h-full">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/immersive-office.png"
                        alt="Background"
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <Link href="/" className="inline-block">
                        <Logo showText={true} textClassName="text-white text-2xl" />
                    </Link>
                </div>

                <div className="relative z-10 max-w-xl">
                    <h1 className="text-5xl font-bold mb-6 tracking-tight leading-tight">
                        Redefining how the world connects.
                    </h1>
                    <p className="text-zinc-400 text-lg leading-relaxed">
                        Experience crystal clear video, immersive backgrounds, and AI-powered translations for your most important conversations.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-zinc-600 flex justify-between items-center w-full">
                    <span>&copy; 2026 Life Meeting Inc.</span>
                    <div className="flex gap-4">
                        <Link href="#" className="hover:text-zinc-400 transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-zinc-400 transition-colors">Terms</Link>
                    </div>
                </div>
            </div>

            {/* Right Side - Form Container */}
            <div className="flex flex-col h-full bg-[#e0e0ff]/30 dark:bg-zinc-950 relative overflow-y-auto">
                <div className="hidden lg:block absolute top-8 right-8">
                    <Link href="/">
                        <Button variant="ghost" className="gap-2 hover:bg-zinc-200/50">
                            <ArrowLeft className="w-4 h-4" /> Back to Home
                        </Button>
                    </Link>
                </div>

                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="w-full max-w-[420px] space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-white/50 backdrop-blur-sm">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
