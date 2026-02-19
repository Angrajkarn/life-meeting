import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    textClassName?: string;
    showText?: boolean;
}

export function Logo({ className, textClassName, showText = true }: LogoProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="relative w-8 h-8 md:w-10 md:h-10">
                <svg
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full drop-shadow-md"
                >
                    <defs>
                        <linearGradient id="logoGradient" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#4F46E5" /> {/* Indigo-600 */}
                            <stop offset="50%" stopColor="#8B5CF6" /> {/* Violet-500 */}
                            <stop offset="100%" stopColor="#EC4899" /> {/* Pink-500 */}
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Main Shape: Stylized Camera / Flower Petal */}
                    <path
                        d="M30 20C30 14.4772 34.4772 10 40 10H60C65.5228 10 70 14.4772 70 20V30H80C85.5228 30 90 34.4772 90 40V60C90 65.5228 85.5228 70 80 70H70V80C70 85.5228 65.5228 90 60 90H40C34.4772 90 30 85.5228 30 80V70H20C14.4772 70 10 65.5228 10 60V40C10 34.4772 14.4772 30 20 30H30V20Z"
                        fill="url(#logoGradient)"
                        className="animate-pulse-subtle"
                    />

                    {/* Lens / Eye Center */}
                    <circle cx="50" cy="50" r="15" fill="white" fillOpacity="0.9" />
                    <circle cx="50" cy="50" r="8" fill="url(#logoGradient)" />

                    {/* Organic Leaf / Notification Dot */}
                    <circle cx="85" cy="15" r="10" fill="#F472B6" stroke="white" strokeWidth="4" />
                </svg>
            </div>
            {showText && (
                <span className={cn("font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600", textClassName)}>
                    Life Meeting
                </span>
            )}
        </div>
    );
}
