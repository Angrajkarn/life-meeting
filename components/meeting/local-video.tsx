"use client";

import { useVideo } from "@/contexts/VideoContext";
import { useEffect, useRef } from "react";
import { MicOff, VideoOff, User } from "lucide-react";

export function LocalVideo() {
    const { localStream, isMuted, isVideoOff, error } = useVideo();
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && localStream) {
            videoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    if (error) {
        return (
            <div className="w-full h-full bg-zinc-900 rounded-xl flex items-center justify-center border border-red-500/20">
                <div className="text-center p-4">
                    <VideoOff className="w-12 h-12 mx-auto text-red-500 mb-2" />
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-white/10 group">
            {/* Main Video Layer */}
            {!isVideoOff && localStream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover transform -scale-x-100"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center animate-pulse">
                        <User className="w-10 h-10 text-zinc-400" />
                    </div>
                </div>
            )}

            {/* Status Overlays */}
            <div className="absolute top-4 right-4 flex gap-2">
                {isMuted && (
                    <div className="p-2 bg-red-500/90 rounded-full backdrop-blur-md shadow-lg">
                        <MicOff className="w-4 h-4 text-white" />
                    </div>
                )}
            </div>

            {/* Label */}
            <div className="absolute bottom-4 left-4">
                <div className="px-3 py-1.5 bg-black/60 rounded-lg backdrop-blur-md text-xs font-medium text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    You (Me)
                </div>
            </div>

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </div>
    );
}
