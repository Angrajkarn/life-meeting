"use client";

import { useEffect } from "react";
import { Camera, Mic } from "lucide-react";

interface PrivacyIndicatorProps {
    isCameraActive: boolean;
    isMicActive: boolean;
}

export function PrivacyIndicator({ isCameraActive, isMicActive }: PrivacyIndicatorProps) {
    useEffect(() => {
        // Update browser title to show active indicators
        const indicators = [];
        if (isCameraActive) indicators.push("🎥");
        if (isMicActive) indicators.push("🎤");

        if (indicators.length > 0) {
            document.title = `${indicators.join(" ")} Lobby - Life Meeting`;
        } else {
            document.title = "Lobby - Life Meeting";
        }

        return () => {
            document.title = "Life Meeting";
        };
    }, [isCameraActive, isMicActive]);

    if (!isCameraActive && !isMicActive) return null;

    return (
        <div
            className="fixed top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-3"
            role="status"
            aria-live="polite"
        >
            <div className="flex items-center gap-2">
                {isCameraActive && (
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                        <Camera className="h-4 w-4" />
                        <span className="text-sm font-medium">Camera Active</span>
                    </div>
                )}
                
                {isCameraActive && isMicActive && (
                    <div className="h-5 w-px bg-white/30" />
                )}
                
                {isMicActive && (
                    <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 bg-white rounded-full animate-pulse" />
                        <Mic className="h-4 w-4" />
                        <span className="text-sm font-medium">Mic Active</span>
                    </div>
                )}
            </div>
        </div>
    );
}
