"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Link2, Video, Captions, Smile, MonitorUp, Image as ImageIcon, Smartphone } from "lucide-react";

export function VisualFeatures() {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    return (
        <section className="py-8 relative z-10">
            <div className="container mx-auto px-4">


                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl mx-auto"
                >
                    {/* Row 1 */}
                    <FeatureCard
                        className="md:col-span-2 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20"
                        icon={Link2}
                        title="Share meeting links with anyone on any device"
                        description=""
                        renderVisual={() => (
                            <div className="mt-8 relative h-48 w-full overflow-hidden flex items-center justify-center">
                                {/* Main Video (Woman) */}
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    whileInView={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                    className="relative w-64 h-40 bg-slate-800 rounded-2xl border-2 border-yellow-400/80 shadow-2xl overflow-hidden z-10"
                                >
                                    <img
                                        src="/images/video-call-woman.png"
                                        alt="Girl on Video Call"
                                        className="w-full h-full object-cover object-top"
                                    />
                                </motion.div>

                                {/* Secondary Video (Man) - Overlapping */}
                                <motion.div
                                    initial={{ x: 20, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="absolute right-8 bottom-6 w-20 h-28 bg-slate-800 rounded-xl border-2 border-blue-500 shadow-2xl overflow-hidden z-20"
                                >
                                    <img
                                        src="/images/video-call-man.png"
                                        alt="Boy on Video Call"
                                        className="w-full h-full object-cover"
                                    />
                                </motion.div>

                                {/* Link Button */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    whileInView={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    whileHover={{ scale: 1.05 }}
                                    className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 bg-white text-slate-900 text-sm font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-xl cursor-pointer hover:shadow-violet-500/20 border border-slate-200"
                                >
                                    <Link2 className="w-4 h-4" /> Copy meeting link
                                </motion.div>
                            </div>
                        )}
                    />

                    <FeatureCard
                        className="md:col-span-1 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20"
                        icon={Video}
                        title="Meet for free"
                        description="Instant or schedule ahead."
                        renderVisual={() => (
                            <div className="mt-8 flex justify-center items-center h-32">
                                <motion.div
                                    animate={{
                                        boxShadow: ["0 0 0 0px rgba(59, 130, 246, 0.4)", "0 0 0 20px rgba(59, 130, 246, 0)"]
                                    }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="w-20 h-20 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg cursor-pointer"
                                >
                                    <Video className="w-10 h-10 text-white" fill="currentColor" />
                                </motion.div>
                            </div>
                        )}
                    />

                    <FeatureCard
                        className="md:col-span-1 bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/20"
                        icon={Captions}
                        title="Live captions"
                        description="In over 40 languages."
                        renderVisual={() => (
                            <div className="mt-8 flex flex-col items-center justify-center h-32 w-full">
                                <LiveTranslation />
                            </div>
                        )}
                    />

                    {/* Row 2 */}
                    <FeatureCard
                        className="md:col-span-1 bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20 overflow-hidden"
                        icon={Smile}
                        title="React Live"
                        description="Interactive emojis."
                        renderVisual={() => (
                            <div className="mt-8 relative h-32 w-full flex justify-center items-end pb-4 overflow-hidden">
                                {[...Array(5)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ y: 50, opacity: 0, scale: 0.5 }}
                                        animate={{
                                            y: -100,
                                            opacity: [0, 1, 0],
                                            scale: [0.5, 1.2, 0.8],
                                            x: Math.sin(i) * 20
                                        }}
                                        transition={{
                                            duration: 2 + (i * 0.2),
                                            repeat: Infinity,
                                            delay: i * 0.5,
                                            ease: "easeOut"
                                        }}
                                        className="absolute text-2xl"
                                        style={{ left: `${20 + (i * 15)}%` }}
                                    >
                                        {['❤️', '👏', '🔥', '🎉', '👍'][i]}
                                    </motion.div>
                                ))}
                                <div className="w-16 h-16 bg-gradient-to-tr from-orange-400 to-amber-300 rounded-full flex items-center justify-center shadow-lg z-10">
                                    <Smile className="w-8 h-8 text-white" />
                                </div>
                            </div>
                        )}
                    />

                    <FeatureCard
                        className="md:col-span-1 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 border-purple-500/20"
                        icon={MonitorUp}
                        title="Screen Share"
                        description="Collab in real-time."
                        renderVisual={() => (
                            <div className="mt-8 relative h-32 flex items-center justify-center perspective-[800px]">
                                <motion.div
                                    className="relative w-48 h-32 bg-slate-900 rounded-lg border border-white/10 shadow-2xl overflow-hidden z-10"
                                    initial={{ rotateX: 10, y: 10, opacity: 0 }}
                                    whileInView={{ rotateX: 0, y: 0, opacity: 1 }}
                                    transition={{ duration: 0.8 }}
                                >
                                    {/* Browser Header */}
                                    <div className="h-6 bg-slate-800 border-b border-white/5 w-full flex items-center px-3 gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-red-500/80" />
                                        <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
                                        <div className="w-2 h-2 rounded-full bg-green-500/80" />
                                    </div>
                                    {/* Dashboard Content */}
                                    <div className="h-full w-full relative">
                                        <img
                                            src="/images/dashboard-ui.png"
                                            alt="Dashboard"
                                            className="w-full h-full object-cover object-top"
                                        />

                                        {/* Animated Cursor */}
                                        <motion.div
                                            className="absolute w-3 h-3 text-white drop-shadow-md z-20"
                                            animate={{
                                                top: ["20%", "60%", "30%", "20%"],
                                                left: ["80%", "20%", "50%", "80%"]
                                            }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                            <svg className="w-full h-full fill-blue-500 stroke-white stroke-[2]" viewBox="0 0 24 24">
                                                <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                                            </svg>
                                        </motion.div>
                                    </div>
                                </motion.div>

                                {/* Background Glow */}
                                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full scale-75 -z-10 animate-pulse" />
                            </div>
                        )}
                    />

                    <FeatureCard
                        className="md:col-span-2 bg-gradient-to-br from-indigo-500/10 to-sky-500/10 border-indigo-500/20"
                        icon={ImageIcon}
                        title="Immersive Backgrounds"
                        description=""
                        renderVisual={() => (
                            <div className="mt-6 relative h-48 w-full overflow-hidden rounded-xl border border-white/5 bg-slate-900 group-hover:border-indigo-500/30 transition-colors">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <motion.div
                                        className="relative w-full h-full"
                                    >
                                        <ImmersiveBackgroundCarousel />
                                    </motion.div>
                                </div>

                                <div className="absolute -bottom-1 left-0 right-0 h-1/3 bg-gradient-to-t from-slate-900/80 to-transparent z-10" />

                                {/* Floating Overlay UI */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800/90 backdrop-blur-md border border-white/10 rounded-full py-1 px-3 flex gap-2 shadow-lg z-20">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-[10px] uppercase tracking-wider font-semibold text-white/70">Live Effect</span>
                                </div>
                            </div>
                        )}
                    />

                </motion.div>
            </div>
        </section>
    );
}

interface FeatureCardProps {
    className?: string;
    icon: React.ElementType;
    title: string;
    description: string;
    renderVisual?: () => React.ReactNode;
}

function FeatureCard({ className, icon: Icon, title, description, renderVisual }: FeatureCardProps) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, scale: 0.95 },
                show: { opacity: 1, scale: 1 }
            }}
            whileHover={{ y: -5 }}
            className={cn(
                "p-8 rounded-[2rem] border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl overflow-hidden relative group",
                className
            )}
        >
            <div className="mb-4 inline-flex p-3 rounded-2xl bg-white/10 text-white shadow-inner">
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2 leading-tight">{title}</h3>
            {description && <p className="text-muted-foreground">{description}</p>}

            {renderVisual && renderVisual()}
        </motion.div>
    )
}

import { AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

function ImmersiveBackgroundCarousel() {
    const backgrounds = [
        "/images/immersive-office.png",
        "/images/immersive-beach.png",
        "/images/immersive-neon.png"
    ];
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % backgrounds.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full h-full">
            <AnimatePresence mode="popLayout">
                <motion.img
                    key={index}
                    src={backgrounds[index]}
                    alt="Immersive Background"
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </AnimatePresence>
        </div>
    );
}

function LiveTranslation() {
    const translations = [
        { text: "Hello", lang: "English", flag: "🇺🇸" },
        { text: "Hola", lang: "Spanish", flag: "🇪🇸" },
        { text: "नमस्ते", lang: "Hindi", flag: "🇮🇳" },
        { text: "Bonjour", lang: "French", flag: "🇫🇷" },
        { text: "こんにちは", lang: "Japanese", flag: "🇯🇵" },
        { text: "Hallo", lang: "German", flag: "🇩🇪" }
    ];

    const [index, setIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % translations.length);
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    const current = translations[index];

    return (
        <div className="relative w-full px-4 flex flex-col items-center">
            {/* Language Indicator */}
            <motion.div
                key={current.lang}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-3 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-900/50 px-2 py-1 rounded-full border border-white/5"
            >
                <span>{current.flag}</span>
                <span>{current.lang}</span>
            </motion.div>

            {/* Chat Bubble */}
            <div className="relative bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-2xl rounded-tl-none px-6 py-4 shadow-xl min-w-[140px] text-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={current.text}
                        initial={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(4px)" }}
                        transition={{ duration: 0.4 }}
                        className="text-2xl font-medium text-white"
                    >
                        {current.text}
                    </motion.div>
                </AnimatePresence>

                {/* Typing Indicator Decor */}
                <div className="absolute -bottom-6 left-0 text-[10px] text-slate-500 flex gap-1 items-center">
                    <span className="w-1 h-1 bg-slate-500 rounded-full animate-pulse" />
                    Calculating translation...
                </div>
            </div>
        </div>
    );
}
