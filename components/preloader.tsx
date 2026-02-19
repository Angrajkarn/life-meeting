"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";

export function Preloader() {
    const [isLoading, setIsLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 2500); // Slightly longer for the animation to complete
        return () => clearTimeout(timer);
    }, []);

    const leafVariants: any = {
        hidden: (i: number) => ({
            opacity: 0,
            scale: 0,
            x: Math.sin(i * (Math.PI * 2) / 5) * 100, // Circular spread
            y: Math.cos(i * (Math.PI * 2) / 5) * 100,
            rotate: 180
        }),
        visible: (i: number) => ({
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0,
            rotate: 0,
            transition: {
                delay: i * 0.1,
                duration: 1.2,
                type: "spring",
                bounce: 0.4
            }
        })
    };

    return (
        <AnimatePresence mode="wait">
            {isLoading && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-[#e0e0ff] overflow-hidden"
                    exit={{
                        opacity: 0,
                        transition: { duration: 0.8, ease: "easeInOut" }
                    }}
                >
                    {isMounted && (
                        <div className="relative flex flex-col items-center justify-center">
                            {/* Container for the gathering leaves */}
                            <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                                {/* Central Glow */}
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1.5, opacity: 0.5 }}
                                    transition={{ delay: 0.5, duration: 1 }}
                                    className="absolute inset-0 bg-white/50 rounded-full blur-2xl"
                                />

                                {/* 5 Petals/Leaves joining */}
                                {[...Array(5)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        custom={i}
                                        variants={leafVariants}
                                        initial="hidden"
                                        animate="visible"
                                        className="absolute w-12 h-12 rounded-full opacity-80 mix-blend-multiply"
                                        style={{
                                            background: `linear-gradient(${i * 72}deg, #4f46e5, #ec4899)`, // Indigo to Pink
                                            borderRadius: "50% 0 50% 0", // Leaf shape
                                        }}
                                    />
                                ))}

                                {/* Final White Center Flash */}
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0] }}
                                    transition={{ delay: 1.5, duration: 0.6 }}
                                    className="absolute inset-0 bg-white rounded-full z-20"
                                />

                                {/* Reveal Final Logo */}
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1.5, opacity: 1 }}
                                    transition={{ delay: 1.8, duration: 0.5, type: "spring" }}
                                    className="absolute inset-0 flex items-center justify-center z-30"
                                >
                                    <Logo showText={false} />
                                </motion.div>
                            </div>

                            {/* Text Reveal */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.8, duration: 0.6 }}
                                className="text-center"
                            >
                                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                                    Life Meeting
                                </h1>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 2.2 }}
                                    className="text-sm text-slate-500 mt-2 font-medium"
                                >
                                    Connect naturally
                                </motion.p>
                            </motion.div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
