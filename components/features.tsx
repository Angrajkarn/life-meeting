"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    ShieldCheck,
    Zap,
    Globe,
    Users,
    Cpu,
    Smartphone
} from "lucide-react";

export function Features() {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const features = [
        {
            title: "Enterprise Security",
            description: "End-to-end encryption with SSO mastery.",
            icon: ShieldCheck,
            className: "md:col-span-2",
            gradient: "from-blue-500/10 via-cyan-500/10 to-teal-500/10 border-blue-500/20",
            iconColor: "text-blue-600",
            textColor: "text-blue-900",
            delay: 0
        },
        {
            title: "Lightning Fast",
            description: "Low latency streaming worldwide.",
            icon: Zap,
            className: "md:col-span-1",
            gradient: "from-amber-500/10 via-orange-500/10 to-red-500/10 border-amber-500/20",
            iconColor: "text-amber-600",
            textColor: "text-amber-900",
            delay: 0.1
        },
        {
            title: "Global Infrastructure",
            description: "Servers in 150+ regions ensuring 99.99% uptime.",
            icon: Globe,
            className: "md:col-span-1",
            gradient: "from-emerald-500/10 via-green-500/10 to-lime-500/10 border-emerald-500/20",
            iconColor: "text-emerald-600",
            textColor: "text-emerald-900",
            delay: 0.2
        },
        {
            title: "Team Collaboration",
            description: "Built-in whiteboard and file sharing.",
            icon: Users,
            className: "md:col-span-2",
            gradient: "from-purple-500/10 via-violet-500/10 to-indigo-500/10 border-purple-500/20",
            iconColor: "text-purple-600",
            textColor: "text-purple-900",
            delay: 0.3
        },
        {
            title: "AI Powered",
            description: "Real-time translation and summaries.",
            icon: Cpu,
            className: "md:col-span-1",
            gradient: "from-pink-500/10 via-rose-500/10 to-red-500/10 border-pink-500/20",
            iconColor: "text-pink-600",
            textColor: "text-pink-900",
            delay: 0.4
        },
        {
            title: "Multi-Platform",
            description: "Works seamlessly on Web, iOS, and Android.",
            icon: Smartphone,
            className: "md:col-span-2",
            gradient: "from-sky-500/10 via-blue-500/10 to-indigo-500/10 border-sky-500/20",
            iconColor: "text-sky-600",
            textColor: "text-sky-900",
            delay: 0.5
        }
    ];

    return (
        <section className="py-24 relative z-10">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                        Everything you need
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Features designed to scale with your ambition.
                    </p>
                </motion.div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[220px]"
                >
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            variants={item}
                            whileHover={{ scale: 1.02, y: -5 }}
                            className={cn(
                                "group relative overflow-hidden rounded-3xl border border-white/20 p-8 flex flex-col justify-between shadow-lg transition-all duration-300 hover:shadow-2xl hover:shadow-black/5",
                                feature.className
                            )}
                        >
                            {/* Animated Gradient Background */}
                            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-100 transition-transform duration-1000 group-hover:scale-110", feature.gradient)} />

                            {/* Hover Highlight */}
                            <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10">
                                <motion.div
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                    className="w-12 h-12 rounded-xl bg-white/80 backdrop-blur-md flex items-center justify-center mb-4 shadow-sm"
                                >
                                    <feature.icon className={cn("w-6 h-6", feature.iconColor)} />
                                </motion.div>
                            </div>

                            <div className="relative z-10">
                                <h3 className={cn("text-2xl font-bold mb-2", feature.textColor)}>{feature.title}</h3>
                                <p className="text-slate-600 text-sm font-medium leading-relaxed">{feature.description}</p>
                            </div>

                            {/* Background Shapes */}
                            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 ease-out" />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
