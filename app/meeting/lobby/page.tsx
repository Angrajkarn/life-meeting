"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Volume2, MonitorUp, ChevronDown, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSWRConfig } from "swr";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { Input } from "@/components/ui/input";
import { UserPreferencesProvider, useUserPreferences } from "@/components/providers/user-preferences-provider";
import { Suspense } from "react";
import { toast } from "sonner";
import { useBackgroundFilter } from "@/hooks/useBackgroundFilter";
import { BackgroundFilterPanel } from "@/components/lobby/BackgroundFilterPanel";
import type { BgConfig } from "@/hooks/useBackgroundFilter";

function LobbyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const meetingCode = searchParams.get('code');
    const { mutate } = useSWRConfig();
    const { data: user } = useSWR('/users/me', fetcher);

    // Fetch meeting details if joining an existing one
    const { data: existingMeeting } = useSWR(meetingCode ? `/meetings/code/${meetingCode}` : null, fetcher);

    // States
    const [isLoading, setIsLoading] = useState(false);
    const [meetingTitle, setMeetingTitle] = useState("Team Meeting");
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCamOn, setIsCamOn] = useState(true);
    const [showBgPanel, setShowBgPanel] = useState(false);
    const [audioSource, setAudioSource] = useState<'computer' | 'phone' | 'room'>('computer');
    const [bgConfig, setBgConfig] = useState<BgConfig>({ mode: "none" });
    // STATE (not ref) so useBackgroundFilter reacts to stream becoming available
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

    // Media Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Background filter hook — receives reactive state, not a stale ref
    const bgFilter = useBackgroundFilter(cameraStream);

    const { preferences } = useUserPreferences();

    // Initialize Title
    useEffect(() => {
        if (existingMeeting?.title) {
            setMeetingTitle(existingMeeting.title);
        } else if (user?.full_name && !meetingCode) {
            setMeetingTitle(`${user.full_name}'s Meeting`);
        }
    }, [user, existingMeeting, meetingCode]);

    // Initialize Camera
    useEffect(() => {
        const startCamera = async () => {
            try {
                let displayStream: MediaStream;
                const constraints: MediaStreamConstraints = { 
                    audio: true, 
                    video: true // Default to true if no preference
                };

                // Apply preferences if available
                if (preferences?.devices?.last_camera_id) {
                    constraints.video = { deviceId: { exact: preferences.devices.last_camera_id } };
                }
                
                if (preferences?.devices?.last_mic_id) {
                    constraints.audio = { deviceId: { exact: preferences.devices.last_mic_id } };
                }

                try {
                    // Try with specific preferences
                    displayStream = await navigator.mediaDevices.getUserMedia(constraints);
                } catch (firstError) {
                    console.warn("Preferred device failed, falling back to default", firstError);
                    // Fallback to default any-device
                    displayStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                }

                streamRef.current = displayStream;
                setCameraStream(displayStream); // ← reactive update for bgFilter hook

                // Show raw camera in video preview (bgFilter will take over when active)
                if (videoRef.current) {
                    videoRef.current.srcObject = displayStream;
                }
            } catch (err) {
                console.error("Error media:", err);
                // Handle permission denied or no device
                setIsCamOn(false);
                setIsMicOn(false);
                toast.error("Could not access camera/microphone");
            }
        };
        
        // Only start if we haven't already or if preferences changed (optional, but good for consistency)
        // For now, run once on mount or when key prefs change is risky without cleanup
        // Let's stick to mount + a rough check
        startCamera();

        // Cleanup on unmount
        return () => {
            if (streamRef.current) {
                const tracks = streamRef.current.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    // When background filter produces an output stream, show it in the preview
    useEffect(() => {
        if (!videoRef.current) return;
        if (bgFilter.outputStream && (bgFilter.status === "active")) {
            videoRef.current.srcObject = bgFilter.outputStream;
        } else if (bgFilter.status === "idle" || bgFilter.status === "error") {
            if (streamRef.current) videoRef.current.srcObject = streamRef.current;
        }
    }, [bgFilter.outputStream, bgFilter.status]);

    // Attach filter canvas to preview container
    const previewCanvasContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const container = previewCanvasContainerRef.current;
        if (!container) return;
        while (container.firstChild) container.removeChild(container.firstChild);
        if (bgFilter.previewCanvas && (bgFilter.status === "active" || bgFilter.status === "fallback")) {
            const c = bgFilter.previewCanvas;
            c.style.cssText = "width:100%;height:100%;object-fit:cover;transform:scaleX(-1)";
            container.appendChild(c);
        }
    }, [bgFilter.previewCanvas, bgFilter.status]);

    const handleApplyBgFilter = useCallback((cfg: BgConfig) => {
        setBgConfig(cfg);
        bgFilter.apply(cfg);
    }, [bgFilter]);

    const handleDisableBgFilter = useCallback(() => {
        setBgConfig({ mode: "none" });
        bgFilter.disable();
        if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [bgFilter]);

    // Real-time Track Toggling
    const toggleMic = (newState: boolean) => {
        setIsMicOn(newState);
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(track => {
                track.enabled = newState;
            });
        }
    };

    const toggleCam = (newState: boolean) => {
        setIsCamOn(newState);
        if (streamRef.current) {
            streamRef.current.getVideoTracks().forEach(track => {
                track.enabled = newState;
            });
        }
        // Visually black out / restore the preview when cam is toggled
        if (!videoRef.current) return;
        if (newState) {
            // cam turning ON — restore the stream source
            const activeStream =
                (bgFilter.status === 'active' || bgFilter.status === 'fallback')
                    ? bgFilter.outputStream
                    : streamRef.current;
            videoRef.current.srcObject = activeStream;
        } else {
            // cam turning OFF — null srcObject so <video> goes black
            videoRef.current.srcObject = null;
        }
    };

    // Start/Join Meeting
    const handleJoin = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            let targetCode = meetingCode;

            if (!meetingCode) {
                // Create New Meeting
                const res = await fetch("http://localhost:8000/meetings/", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({
                        title: meetingTitle || "Team Meeting",
                        type: "instant",
                        start_time: new Date().toISOString(),
                        end_time: new Date(Date.now() + 3600000).toISOString()
                    }),
                });

                if (!res.ok) throw new Error("Failed to create meeting");
                const meeting = await res.json();
                targetCode = meeting.code;
            } else {
                // Join Existing Meeting (Backend Validation)
                const res = await fetch(`http://localhost:8000/meetings/${existingMeeting?.id}/join`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
                });
                if (!res.ok) throw new Error("Failed to join meeting");
            }

            await mutate('/meetings');

            // ── Persist lobby mic/cam state so meeting room joins correctly ──
            sessionStorage.setItem('joinMicOn', isMicOn ? '1' : '0');
            sessionStorage.setItem('joinVideoOn', isCamOn ? '1' : '0');

            // Disable background filter before nav so the worker is torn down cleanly
            bgFilter.disable();
            if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());

            router.push(`/meeting/${targetCode}?join=1`);            
            // Store chosen bg config for the meeting room to pick up
            if (bgConfig.mode !== "none") {
                sessionStorage.setItem("bgConfig", JSON.stringify(bgConfig));
            } else {
                sessionStorage.removeItem("bgConfig");
            }

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-4 font-sans text-slate-900">
            {/* Main Container */}
            <div className="max-w-[1000px] w-full flex flex-col gap-8">

                {/* Header Section */}
                <div className="flex flex-col items-center justify-center space-y-4 pt-4">
                    <div className="scale-125">
                        <Logo />
                    </div>

                    <div className="text-center w-full max-w-md space-y-2">
                        {meetingCode ? (
                            <h1 className="text-2xl font-bold text-slate-900">{meetingTitle}</h1>
                        ) : (
                            <Input
                                value={meetingTitle}
                                onChange={(e) => setMeetingTitle(e.target.value)}
                                className="text-center text-2xl font-bold border-none shadow-none bg-transparent hover:bg-white/50 focus:bg-white focus:ring-2 ring-indigo-500 transition-all rounded-lg h-12 placeholder:text-slate-300"
                                placeholder="Enter meeting title..."
                            />
                        )}
                        <p className="text-slate-500 font-medium">Choose your video and audio settings</p>
                    </div>
                </div>

                {/* Content Card */}
                <div className="flex flex-col md:flex-row gap-6 md:h-[420px]">

                    {/* Left: Preview */}
                    <div className="flex-1 rounded-xl bg-black relative overflow-hidden group shadow-lg ring-1 ring-black/5">
                        {/* Video Layer */}
                        <div className="absolute inset-0 bg-[#202020] flex items-center justify-center overflow-hidden">
                            {/* Raw video — hidden when bg filter canvas is active */}
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className={`w-full h-full object-cover transform scale-x-[-1] transition-all duration-300
                                    ${isCamOn ? 'opacity-100' : 'opacity-0'}
                                    ${(bgFilter.status === 'active' || bgFilter.status === 'fallback') ? 'hidden' : ''}`
                                }
                            />

                            {/* Background filter canvas output (shown when active) */}
                            {(bgFilter.status === 'active' || bgFilter.status === 'fallback') && isCamOn && (
                                <div
                                    ref={previewCanvasContainerRef}
                                    className="w-full h-full"
                                />
                            )}

                            {/* Loading overlay */}
                            {bgFilter.status === 'loading' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                                        </div>
                                        <p className="text-white/70 text-xs font-medium">Loading AI model…</p>
                                    </div>
                                </div>
                            )}

                            {/* Camera off avatar */}
                            <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 ${!isCamOn ? 'opacity-100' : 'opacity-0 delay-100 pointer-events-none'}`}>
                                <Avatar className="h-28 w-28 mb-4 border-4 border-white/10 shadow-2xl">
                                    <AvatarFallback className="text-3xl font-bold bg-indigo-600 text-white">
                                        {user?.full_name?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <p className="text-slate-400 font-medium text-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">Camera is off</p>
                            </div>
                        </div>

                        {/* Controls strip */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {/* Cam Toggle */}
                                <button
                                    onClick={() => toggleCam(!isCamOn)}
                                    className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center backdrop-blur-md border border-white/10 ${isCamOn ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-500/80 text-white hover:bg-red-600/80 shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}
                                    title={isCamOn ? "Turn camera off" : "Turn camera on"}
                                >
                                    {isCamOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                                </button>
                                {/* Mic Toggle */}
                                <button
                                    onClick={() => toggleMic(!isMicOn)}
                                    className={`p-3 rounded-full transition-all duration-200 flex items-center justify-center backdrop-blur-md border border-white/10 ${isMicOn ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-red-500/80 text-white hover:bg-red-600/80 shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}
                                    title={isMicOn ? "Mute microphone" : "Unmute microphone"}
                                >
                                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                                </button>
                            </div>

                            {/* Background Filters Button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`text-white hover:bg-white/10 gap-2 transition-all rounded-full px-4 border border-white/10 backdrop-blur-md ${
                                    (bgFilter.status === 'active' || bgFilter.status === 'fallback')
                                        ? 'bg-indigo-500/80 hover:bg-indigo-600/80'
                                        : 'bg-black/40'
                                }`}
                                onClick={() => setShowBgPanel(v => !v)}
                            >
                                <MonitorUp className="h-4 w-4" />
                                <span className="hidden sm:inline">Background filters</span>
                                {(bgFilter.status === 'active' || bgFilter.status === 'fallback') && (
                                    <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                )}
                            </Button>
                        </div>

                        {/* Filter Panel */}
                        {showBgPanel && (
                            <BackgroundFilterPanel
                                onClose={() => setShowBgPanel(false)}
                                onApply={handleApplyBgFilter}
                                onDisable={handleDisableBgFilter}
                                status={bgFilter.status}
                                error={bgFilter.error}
                                usingFallback={bgFilter.usingFallback}
                                currentConfig={bgConfig}
                            />
                        )}
                    </div>

                    {/* Right: Audio Settings */}
                    <div className="w-full md:w-[360px] flex flex-col justify-between">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex-1">
                            <h2 className="text-lg font-bold text-slate-800 mb-5">Audio settings</h2>

                            <div className="space-y-3">
                                {/* Option: Computer Audio */}
                                <div
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-3 relative overflow-hidden group
                                        ${audioSource === 'computer' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 hover:border-indigo-200 bg-white'}`}
                                    onClick={() => setAudioSource('computer')}
                                >
                                    <div className="flex items-start gap-3 relative z-10">
                                        <div className={`mt-1 rounded-full p-0.5 transition-colors ${audioSource === 'computer' ? 'text-indigo-600' : 'text-slate-300'}`}>
                                            {audioSource === 'computer' ? <div className="h-4 w-4 rounded-full border-[5px] border-current" /> : <div className="h-4 w-4 rounded-full border-2 border-slate-300" />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                                                Computer audio
                                            </div>

                                            {/* Expandable Device Config */}
                                            {audioSource === 'computer' && (
                                                <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-300">
                                                    <div className="flex items-center justify-between text-xs font-medium text-slate-700 bg-white/50 p-2 rounded border border-slate-200/60 shadow-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Mic className="h-3.5 w-3.5 text-slate-500" />
                                                            Default Mic
                                                        </div>
                                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs font-medium text-slate-700 bg-white/50 p-2 rounded border border-slate-200/60 shadow-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Volume2 className="h-3.5 w-3.5 text-slate-500" />
                                                            Default Speaker
                                                        </div>
                                                        <ChevronDown className="h-3 w-3 opacity-50" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Option: Phone Audio */}
                                <div
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 
                                        ${audioSource === 'phone' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 hover:border-indigo-200 bg-white'}`}
                                    onClick={() => setAudioSource('phone')}
                                >
                                    <div className={`rounded-full p-0.5 ${audioSource === 'phone' ? 'text-indigo-600' : 'text-slate-300'}`}>
                                        {audioSource === 'phone' ? <div className="h-4 w-4 rounded-full border-[5px] border-current" /> : <div className="h-4 w-4 rounded-full border-2 border-slate-300" />}
                                    </div>
                                    <span className="font-semibold text-slate-700">Phone audio</span>
                                </div>

                                {/* Option: No Audio */}
                                <div
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 
                                        ${audioSource === 'room' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 hover:border-indigo-200 bg-white'}`}
                                    onClick={() => setAudioSource('room')}
                                >
                                    <div className={`rounded-full p-0.5 ${audioSource === 'room' ? 'text-indigo-600' : 'text-slate-300'}`}>
                                        {audioSource === 'room' ? <div className="h-4 w-4 rounded-full border-[5px] border-current" /> : <div className="h-4 w-4 rounded-full border-2 border-slate-300" />}
                                    </div>
                                    <span className="font-semibold text-slate-700">Don't use audio</span>
                                </div>
                            </div>
                        </div>

                        {/* Join Button */}
                        <div className="mt-4 flex gap-3">
                            <Button variant="outline" className="flex-1 h-12 border-slate-300 text-slate-700 font-medium hover:bg-slate-50" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 h-12 bg-[#5B5FC7] hover:bg-[#4f52b2] text-white font-bold shadow-md hover:shadow-lg transition-all"
                                onClick={handleJoin}
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Join now"}
                            </Button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default function LobbyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        }>
            <UserPreferencesProvider>
                <LobbyContent />
            </UserPreferencesProvider>
        </Suspense>
    );
}
