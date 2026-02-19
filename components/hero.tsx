"use client";

import { Button } from "@/components/ui/button";
import {
    Video, Keyboard, Star, MessageCircle, Mic, Monitor,
    MessageSquare, Users, Hand, Smile, LayoutGrid, MoreHorizontal,
    Share, PhoneOff, ChevronDown, Camera
} from "lucide-react";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { useRef } from "react";

export function Hero() {
    const targetRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    // 3D Tilt Logic
    const x = useMotionValue(0);
    const yRotate = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 50, damping: 10 });
    const mouseY = useSpring(yRotate, { stiffness: 50, damping: 10 });

    const rotateX = useTransform(mouseY, [-0.5, 0.5], ["7deg", "-7deg"]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-7deg", "7deg"]);

    function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
        const rect = event.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseXPos = event.clientX - rect.left;
        const mouseYPos = event.clientY - rect.top
        const xPct = mouseXPos / width - 0.5;
        const yPct = mouseYPos / height - 0.5;

        x.set(xPct);
        yRotate.set(yPct);
    }

    function handleMouseLeave() {
        x.set(0);
        yRotate.set(0);
    }

    return (
        <section ref={targetRef} className="relative pt-24 pb-20 lg:pt-32 lg:pb-32 overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
                <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
                <div className="absolute -bottom-20 left-1/3 w-[500px] h-[500px] bg-pink-400/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-12 items-center">

                    {/* Left Column: Text + CTA */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-left space-y-8"
                    >
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                            Video calls with <br />
                            <span className="text-primary relative inline-block">
                                anyone, anytime
                            </span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed">
                            Connect, collaborate, and celebrate from anywhere with high-quality video meetings designed for everyone.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all hover:scale-105">
                                <Video className="mr-2 w-5 h-5" /> Start a meeting for free
                            </Button>
                            <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-2 border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary bg-white/50 backdrop-blur-sm transition-all hover:scale-105">
                                <Keyboard className="mr-2 w-5 h-5" /> Join a meeting
                            </Button>
                        </div>
                    </motion.div>

                    {/* Right Column: High Fidelity Mockup */}
                    <motion.div
                        style={{ y, opacity }}
                        className="relative lg:h-[600px] flex items-center justify-center p-4 lg:p-0"
                    >
                        {/* Main App Container */}
                        {/* Main App Container with 3D Float */}
                        <motion.div
                            style={{
                                y,
                                opacity,
                                rotateX,  // Dynamic 3D rotation
                                rotateY,
                                perspective: 1000
                            }}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            className="relative z-20 w-full max-w-full perspective-1000"
                        >
                            <motion.div
                                animate={{
                                    y: [0, -20, 0] // Continuous floating
                                }}
                                transition={{
                                    duration: 6,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col aspect-[16/10] transform-style-3d"
                            >
                                {/* Teams-style Top Toolbar */}
                                <div className="h-14 bg-[#f5f5fa] dark:bg-[#1f1f2e] border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 select-none">
                                    {/* Left: Title & Info */}
                                    <div className="flex flex-col">
                                        <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">Fundraising Brainstorm</div>
                                        <div className="text-[10px] text-slate-500">22:06</div>
                                    </div>

                                    {/* Right: Controls */}
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        {/* Utility Icons */}
                                        <div className="flex items-center gap-1 mr-2 sm:mr-4">
                                            <TopBarIcon icon={MessageSquare} label="Chat" active />
                                            <TopBarIcon icon={Users} label="People" />
                                            <TopBarIcon icon={Hand} label="Raise" />
                                            <TopBarIcon icon={Smile} label="React" />
                                            <TopBarIcon icon={LayoutGrid} label="View" />
                                            <TopBarIcon icon={MoreHorizontal} label="More" />
                                        </div>

                                        {/* SV Icons */}
                                        <div className="flex items-center gap-2 border-l border-slate-300 dark:border-slate-600 pl-2 sm:pl-4 mr-2 sm:mr-4">
                                            <div className="flex items-center gap-1">
                                                <TopBarIcon icon={Camera} label="Camera" />
                                                <ChevronDown className="w-3 h-3 text-slate-500" />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <TopBarIcon icon={Mic} label="Mic" />
                                                <ChevronDown className="w-3 h-3 text-slate-500" />
                                            </div>
                                            <TopBarIcon icon={Share} label="Share" filled />
                                        </div>

                                        {/* Leave Button */}
                                        <div className="flex items-center">
                                            <button className="bg-[#c4314b] hover:bg-[#a3243b] text-white px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-colors">
                                                <PhoneOff className="w-4 h-4" />
                                                <span className="hidden sm:inline">Leave</span>
                                            </button>
                                            <div className="h-full bg-[#a3243b] px-1.5 py-1.5 rounded-r-md ml-[1px] cursor-pointer">
                                                <ChevronDown className="w-3 h-3 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* App Content */}
                                <div className="flex flex-1 overflow-hidden bg-[#202020] relative">
                                    {/* Video Grid */}
                                    <div className="flex-1 p-2 grid grid-cols-2 grid-rows-2 gap-2">
                                        <MockParticipant
                                            name="Tim Debo"
                                            img="https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=400&auto=format&fit=crop"
                                            color="bg-purple-100"
                                        />
                                        <MockParticipant
                                            name="Lydia Bauer"
                                            img="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop"
                                            color="bg-orange-100"
                                        />
                                        <MockParticipant
                                            name="Celeste B."
                                            img="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop"
                                            color="bg-pink-100"
                                            talking
                                        />
                                        <MockParticipant
                                            name="Marcus R."
                                            img="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop"
                                            color="bg-blue-100"
                                        />

                                        {/* Reactions Overlay */}
                                        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                                            <FloatingReaction emoji="❤️" delay={2} x="20%" />
                                            <FloatingReaction emoji="👍" delay={4} x="70%" />
                                            <FloatingReaction emoji="👏" delay={6} x="40%" />
                                        </div>
                                    </div>

                                    {/* Sidebar (Chat) */}
                                    <div className="w-72 bg-white dark:bg-[#1f1f2e] border-l border-slate-200 dark:border-slate-700 flex flex-col hidden sm:flex shadow-xl z-20">
                                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                            <span className="font-bold text-sm text-slate-800 dark:text-white">Meeting Chat</span>
                                            <MoreHorizontal className="w-4 h-4 text-slate-500" />
                                        </div>

                                        <div className="flex-1 p-4 space-y-5 overflow-y-auto custom-scrollbar">
                                            <div className="text-center text-[10px] text-slate-400 my-2">Today, 10:00 AM</div>

                                            <ChatMessage name="Celeste Burton" time="10:02 AM" text="Good morning! Nice to see everyone today." avatar="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=64&auto=format&fit=crop" />

                                            <ChatMessage name="Tim Debo" time="10:03 AM" text="Yes, sales have been amazing this month! 🚀" avatar="https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=64&auto=format&fit=crop" isRight />

                                            <div className="flex justify-center my-2">
                                                <span className="bg-slate-100 dark:bg-slate-800 text-[10px] px-2 py-0.5 rounded-full text-slate-500">Lydia joined the chat</span>
                                            </div>

                                            <ChatMessage name="Lydia Bauer" time="10:04 AM" text="I've noticed a slight increase in usage across all fields." avatar="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=64&auto=format&fit=crop" />

                                            <ChatMessage name="Marcus R" time="10:05 AM" text="Lets review the Q3 projections." avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=64&auto=format&fit=crop" />

                                            <ChatMessage name="Tim Debo" time="10:05 AM" text="Screen sharing now..." avatar="https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=64&auto=format&fit=crop" isRight />

                                            <ChatMessage name="Celeste Burton" time="10:06 AM" text="Great, I can see it clearly." avatar="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=64&auto=format&fit=crop" />

                                            <ChatMessage name="Lydia Bauer" time="10:06 AM" text="Wait, go back to the previous slide please." avatar="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=64&auto=format&fit=crop" />
                                        </div>

                                        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1f1f2e]">
                                            <div className="flex gap-2 text-slate-400 mb-2">
                                                <div className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer"><span className="text-xs font-bold">B</span></div>
                                                <div className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer"><span className="text-xs italic">I</span></div>
                                                <div className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer"><span className="text-xs underline">U</span></div>
                                            </div>
                                            <div className="bg-white dark:bg-black/20 border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 text-xs text-slate-500 flex justify-between items-center cursor-text">
                                                <span>Type a new message</span>
                                                <Share className="w-3 h-3 rotate-12" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </motion.div>

                            {/* Floating MS Elements - moved slightly to avoid overlap */}
                            {/* Floating MS Elements - Repositioned to Intermediate Height */}
                            <FloatingElement delay={1} x={-80} y={-530}><div className="bg-[#f472b6] p-5 rounded-full shadow-xl -rotate-12 z-40"><MessageCircle className="w-8 h-8 text-white" /></div></FloatingElement>

                            {/* New 3D Camera Icon - Top Center-Right Floating */}
                            <motion.div
                                initial={{ opacity: 0, x: 160, y: -600 }}
                                animate={{
                                    opacity: 1,
                                    y: [-600, -620, -600],
                                    rotateY: [0, 360],
                                    rotateX: [5, -5, 5]
                                }}
                                transition={{
                                    y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                                    rotateY: { duration: 6, repeat: Infinity, ease: "linear" },
                                    rotateX: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                                    opacity: { duration: 0.5, delay: 0.5 }
                                }}
                                className="absolute z-50 perspective-1000"
                            >
                                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.5rem] flex items-center justify-center shadow-[0_15px_30px_rgba(99,102,241,0.4)] border border-white/20">
                                    <div className="absolute inset-0 bg-white/30 rounded-[1.5rem] blur-md -z-10" />
                                    <Video className="w-8 h-8 text-white drop-shadow-lg" strokeWidth={2.5} />
                                </div>
                            </motion.div>

                            {/* Floating MS Elements - Yellow Star (Top Right) */}
                            <FloatingElement delay={0} x={380} y={-550}><div className="bg-[#fbbf24] p-5 rounded-2xl shadow-[0_20px_40px_rgba(251,191,36,0.4)] rotate-12 z-40"><Star className="w-10 h-10 text-white" fill="currentColor" /></div></FloatingElement>

                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                className="absolute -z-10 -right-20 top-0 w-80 h-80 border-2 border-dashed border-indigo-300/50 rounded-full"
                            />
                        </motion.div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}

function TopBarIcon({ icon: Icon, label, active, filled }: any) {
    return (
        <div className={`flex flex-col items-center gap-0.5 cursor-pointer group p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'}`}>
            <Icon className={`w-4 h-4 ${filled ? 'fill-current' : ''}`} strokeWidth={2.5} />
            <span className="text-[9px] font-medium hidden md:block">{label}</span>
        </div>
    )
}

function FloatingElement({ children, x, y, delay }: { children: React.ReactNode, x: number, y: number, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: y + 50 }}
            animate={{
                opacity: 1,
                y: [y, y - 15, y],
                x: x,
                rotate: [0, 5, -5, 0]
            }}
            transition={{
                y: {
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: delay
                },
                rotate: {
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: delay
                },
                opacity: { duration: 0.5, delay: delay }
            }}
            className="absolute z-30"
        >
            {children}
        </motion.div>
    )
}

function MockParticipant({ name, color, img, delay, talking }: any) {
    return (
        <div className={`relative h-full w-full bg-black rounded-lg overflow-hidden group border border-white/10`}>
            <img src={img} alt={name} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />

            {/* Talking Indicator */}
            {talking && (
                <div className="absolute inset-0 border-4 border-indigo-500 rounded-lg animate-pulse" />
            )}

            {/* Name Tag */}
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-[11px] text-white font-medium flex items-center gap-1.5 shadow-sm">
                {talking && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                {name}
            </div>

            {/* Mic Icon */}
            <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-sm">
                {talking ? <Mic className="w-3 h-3 text-white" /> : <Mic className="w-3 h-3 text-red-500" />}
            </div>
        </div>
    )
}

function FloatingReaction({ emoji, delay, x }: any) {
    return (
        <motion.div
            initial={{ y: 200, opacity: 0, scale: 0.5 }}
            animate={{
                y: -100,
                opacity: [0, 1, 0]
            }}
            transition={{
                duration: 3,
                delay: delay,
                repeat: Infinity,
                repeatDelay: Math.random() * 5 + 2
            }}
            style={{ left: x }}
            className="absolute bottom-0 text-3xl"
        >
            {emoji}
        </motion.div>
    )
}

function ChatMessage({ name, time, text, avatar, isRight }: any) {
    return (
        <div className={`flex gap-3 ${isRight ? 'flex-row-reverse' : ''}`}>
            <img src={avatar} className="w-8 h-8 rounded-full object-cover mt-1" alt={name} />
            <div className={`flex flex-col ${isRight ? 'items-end' : 'items-start'} max-w-[85%]`}>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{name}</span>
                    <span className="text-[10px] text-slate-400">{time}</span>
                </div>
                <div className={`px-3 py-2 rounded-lg text-xs leading-relaxed shadow-sm border border-transparent ${isRight ? 'bg-[#e8eaf6] text-indigo-900 border-indigo-100 rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-700 rounded-tl-none'}`}>
                    {text}
                </div>
            </div>
        </div>
    )
}
