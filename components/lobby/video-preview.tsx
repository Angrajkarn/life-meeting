"use client";

import { useRef, useEffect, useState } from "react";
import { Camera, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface VideoPreviewProps {
    stream: MediaStream | null;
    isVideoEnabled: boolean;
    onToggleVideo: () => void;
    userName?: string;
    avatarUrl?: string;
    isDisabled?: boolean;
    disabledReason?: string;
}

export function VideoPreview({
    stream,
    isVideoEnabled,
    onToggleVideo,
    userName = "User",
    avatarUrl,
    isDisabled = false,
    disabledReason,
}: VideoPreviewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasVideo, setHasVideo] = useState(false);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        if (stream && isVideoEnabled) {
            const videoTracks = stream.getVideoTracks();
            setHasVideo(videoTracks.length > 0);

            if (videoTracks.length > 0) {
                videoElement.srcObject = stream;
                videoElement.play().catch(err => {
                    console.error("[VideoPreview] Failed to play video:", err);
                });
            }
        } else {
            videoElement.srcObject = null;
            setHasVideo(false);
        }

        return () => {
            if (videoElement.srcObject) {
                videoElement.srcObject = null;
            }
        };
    }, [stream, isVideoEnabled]);

    return (
        <div 
            className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden shadow-xl"
            role="region"
            aria-label="Video preview"
        >
            {/* Video element */}
            {hasVideo && isVideoEnabled ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                />
            ) : (
                /* Avatar fallback */
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-600">
                    <Avatar className="h-32 w-32 border-4 border-white/20">
                        <AvatarImage src={avatarUrl} alt={userName} />
                        <AvatarFallback className="text-5xl font-semibold bg-blue-500 text-white">
                            {userName[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                </div>
            )}

            {/* User name label */}
            <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-md">
                <p className="text-sm font-medium text-white">{userName}</p>
            </div>

            {/* Video toggle button */}
            <div className="absolute bottom-4 right-4">
                <Button
                    onClick={onToggleVideo}
                    size="icon"
                    variant={isVideoEnabled ? "default" : "destructive"}
                    className="h-12 w-12 rounded-full shadow-lg"
                    disabled={isDisabled}
                    title={isDisabled ? disabledReason : isVideoEnabled ? "Turn off camera (Ctrl+D)" : "Turn on camera (Ctrl+D)"}
                    aria-label={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                    aria-pressed={isVideoEnabled}
                >
                    {isVideoEnabled ? (
                        <Camera className="h-5 w-5" />
                    ) : (
                        <CameraOff className="h-5 w-5" />
                    )}
                </Button>
            </div>

            {/* Camera off indicator */}
            {!isVideoEnabled && (
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-red-500/90 backdrop-blur-sm rounded-md flex items-center gap-2">
                    <CameraOff className="h-4 w-4 text-white" />
                    <span className="text-sm font-medium text-white">Camera Off</span>
                </div>
            )}

            {/* Disabled overlay */}
            {isDisabled && disabledReason && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4 max-w-sm mx-4">
                        <p className="text-sm text-white text-center">{disabledReason}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
