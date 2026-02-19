"use client";

import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function Counter({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    const springValue = useSpring(0, {
        stiffness: 50,
        damping: 20,
        duration: 2000
    });

    const displayValue = useTransform(springValue, (current) => Math.floor(current));

    useEffect(() => {
        if (isInView) {
            springValue.set(value);
        }
    }, [isInView, springValue, value]);

    // Use a state to force re-render on value change for the text content
    const [displayString, setDisplayString] = useState("0");

    useEffect(() => {
        const unsubscribe = displayValue.on("change", (v) => {
            setDisplayString(v.toLocaleString());
        });
        return () => unsubscribe();
    }, [displayValue]);

    return (
        <div ref={ref} className="text-center space-y-2 p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
            <div className="text-4xl md:text-5xl font-bold text-slate-900">
                {displayString}{suffix}
            </div>
            <div className="text-slate-600 font-medium">{label}</div>
        </div>
    );
}

export function Stats() {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Counter value={10000} label="Active Users" suffix="+" />
                    <Counter value={500} label="Enterprise Clients" suffix="+" />
                    <Counter value={99} label="Uptime Guarantee" suffix="%" />
                    <Counter value={24} label="Global Regions" suffix="" />
                </div>
            </div>
        </section>
    );
}
