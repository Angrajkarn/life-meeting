"use client";

import { cn } from "@/lib/utils";
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, MessageSquare, Users, MoreHorizontal, Smile, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useVideo } from "@/contexts/VideoContext";

interface ControlBarProps {
    className?: string;
    onChatToggle?: () => void;
}

export function ControlBar({ className, onChatToggle }: ControlBarProps) {
    const router = useRouter();
    // Safely try to use context, fallback if not wrapped (for testing/mocking)
    let videoContext;
    try {
        videoContext = useVideo();
    } catch (e) {
        // Fallback or handle graceful degradation if needed
        videoContext = { isMuted: false, isVideoOff: false, toggleAudio: () => { }, toggleVideo: () => { } };
    }

    const { isMuted, isVideoOff, toggleAudio, toggleVideo } = videoContext;

    return (
        <div className={cn(
            "h-20 bg-[#1f1f2e] border-t border-white/10 px-4 flex items-center justify-between shrink-0 z-50",
            className
        )}>
            {/* Left: Meeting Info / Time */}
            <div className="hidden md:flex flex-col">
                <span className="font-semibold text-sm text-white">Daily Standup</span>
                <span className="text-xs text-slate-400">10:42 AM</span>
            </div>

            {/* Center: Main Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
                <ControlBtn
                    icon={isMuted ? MicOff : Mic}
                    label={isMuted ? "Unmute" : "Mute"}
                    onClick={toggleAudio}
                    variant={isMuted ? "destructive" : "secondary"}
                />
                <ControlBtn
                    icon={isVideoOff ? VideoOff : Video}
                    label={isVideoOff ? "Start Video" : "Stop Video"}
                    onClick={toggleVideo}
                    variant={isVideoOff ? "destructive" : "secondary"}
                />

                <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block" />

                <ControlBtn icon={Monitor} label="Share" />
                <ControlBtn icon={Smile} label="React" />
                <ControlBtn icon={Hand} label="Raise" />

                <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block" />

                <ControlBtn icon={MessageSquare} label="Chat" onClick={onChatToggle} />
                <ControlBtn icon={Users} label="People" />
                <ControlBtn icon={MoreHorizontal} label="More" />
            </div>

            {/* Right: End Call */}
            <div className="flex items-center">
                <Button
                    variant="destructive"
                    className="rounded-full px-6 h-10 font-semibold bg-red-600 hover:bg-red-700 shadow-lg shadow-red-900/20"
                    onClick={() => router.push('/')}
                >
                    <PhoneOff className="w-4 h-4 mr-2" />
                    Leave
                </Button>
            </div>
        </div>
    );
}

function ControlBtn({ icon: Icon, label, variant = "ghost", onClick }: any) {
    const isDestructive = variant === "destructive";
    const isSecondary = variant === "secondary"; // Muted/Video active states usually "secondary" or "default" depending on design system

    return (
        <div className="flex flex-col items-center gap-1 group">
            <Button
                variant="ghost"
                size="icon"
                onClick={onClick}
                className={cn(
                    "rounded-2xl w-10 h-10 sm:w-11 sm:h-11 transition-all duration-200",
                    isDestructive && "bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-red-500/20",
                    !isDestructive && "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-white/5 shadow-sm"
                )}
            >
                <Icon className={cn("w-5 h-5", isDestructive && "fill-current")} />
            </Button>
            <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-black px-2 py-1 rounded">
                {label}
            </span>
        </div>
    )
}
