"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMediaDevices } from "@/lib/hooks/useMediaDevices";
import { mediaStreamManager } from "@/lib/mediaManager";
import { VideoPreview } from "@/components/lobby/video-preview";
import { AudioControls } from "@/components/lobby/audio-controls";
import { HardwareStatus, HardwareStatus as HardwareStatusType } from "@/components/lobby/hardware-status";
import { PolicyBanner, MeetingPolicy } from "@/components/lobby/policy-banner";
import { PrivacyIndicator } from "@/components/lobby/privacy-indicator";
import { Button } from "@/components/ui/button";
import { Loader2, Video } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";

interface LobbyPageProps {
    params: {
        id: string;
    };
}

export default function LobbyPage({ params }: LobbyPageProps) {
    const router = useRouter();
    const meetingId = params.id;

    // Device management
    const devices = useMediaDevices();

    // Meeting data & policy
    const { data: user } = useSWR("/users/me", fetcher);
    const { data: meetingConfig, isLoading: isPolicyLoading } = useSWR(
        `/api/meetings/${meetingId}/lobby-config`,
        fetcher
    );

    // Local state
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [permissionsRequested, setPermissionsRequested] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);

    // Request permissions on mount
    useEffect(() => {
        const requestPermissions = async () => {
            if (permissionsRequested) return;
            setPermissionsRequested(true);

            console.log("[Lobby] Requesting media permissions...");

            // Request camera permission
            await devices.requestCameraPermission();

            // Request microphone permission
            await devices.requestMicrophonePermission();
        };

        requestPermissions();
    }, [devices, permissionsRequested]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Prevent shortcuts if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Ctrl/Cmd + D: Toggle video
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                if (!meetingConfig?.policies?.video_locked) {
                    setIsVideoEnabled(prev => !prev);
                }
            }

            // Ctrl/Cmd + M: Toggle mute
            if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
                e.preventDefault();
                if (!meetingConfig?.policies?.audio_locked) {
                    setIsMuted(prev => !prev);
                }
            }

            // Enter: Join meeting (if allowed)
            const hasPermission = devices.cameraPermission === "granted" || devices.microphonePermission === "granted";
            if (e.key === 'Enter' && hasPermission && !isJoining) {
                e.preventDefault();
                // Trigger click on join button element
                document.querySelector<HTMLButtonElement>('[data-join-button]')?.click();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [meetingConfig, devices.cameraPermission, devices.microphonePermission, isJoining]);

    // Start video stream when camera permission is granted
    useEffect(() => {
        if (devices.cameraPermission === "granted" && isVideoEnabled && devices.selectedCamera) {
            mediaStreamManager
                .getVideoPreview(devices.selectedCamera)
                .then(stream => {
                    console.log("[Lobby] Video preview started");
                    setVideoStream(stream);
                })
                .catch(err => {
                    console.error("[Lobby] Failed to start video:", err);
                });
        }

        return () => {
            if (videoStream) {
                // Safe cleanup: Only stop THIS specific stream
                mediaStreamManager.stopStream(videoStream);
                setVideoStream(null);
            }
        };
    }, [devices.cameraPermission, devices.selectedCamera, isVideoEnabled]);

    // Start audio stream when microphone permission is granted
    useEffect(() => {
        if (devices.microphonePermission === "granted" && !isMuted && devices.selectedMicrophone) {
            mediaStreamManager
                .getAudioStream(devices.selectedMicrophone)
                .then(stream => {
                    console.log("[Lobby] Audio stream started");
                    setAudioStream(stream);
                })
                .catch(err => {
                    console.error("[Lobby] Failed to start audio:", err);
                });
        }

        return () => {
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
                setAudioStream(null);
            }
        };
    }, [devices.microphonePermission, devices.selectedMicrophone, isMuted]);

    // Handle video toggle
    const handleToggleVideo = useCallback(() => {
        if (meetingConfig?.policies?.video_locked) return;
        setIsVideoEnabled(prev => !prev);
    }, [meetingConfig]);

    // Handle mute toggle
    const handleToggleMute = useCallback(() => {
        if (meetingConfig?.policies?.audio_locked) return;
        setIsMuted(prev => !prev);
    }, [meetingConfig]);

    // Join meeting
    const handleJoinMeeting = async () => {
        setIsJoining(true);

        try {
            // Validate user is authenticated
            if (!user?.id) {
                throw new Error("User not authenticated");
            }

            // Apply policies
            const finalMuted = meetingConfig?.policies?.mute_on_entry || isMuted;
            const finalVideoOn = meetingConfig?.policies?.camera_on_entry === false 
                ? false 
                : isVideoEnabled;

            // Assemble join state
            const joinState = {
                is_muted: finalMuted,
                is_video_on: finalVideoOn,
                selected_devices: {
                    audio_input: devices.selectedMicrophone || "default",
                    video_input: devices.selectedCamera || "default",
                    audio_output: devices.selectedSpeaker || "default",
                },
                audio_settings: {
                    noise_suppression: true,
                    echo_cancellation: true,
                    auto_gain_control: true,
                },
                display_name: user?.full_name || "Guest",
                avatar_url: user?.avatar,
                joined_from_lobby: true,
            };

            console.log("[Lobby] Joining with state:", joinState);

            // Send join request to backend
            const response = await fetch(`http://localhost:8000/api/meetings/${meetingId}/join`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ 
                    user_id: user.id, 
                    join_state: joinState 
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || "Failed to join meeting");
            }

            const joinResponse = await response.json();
            console.log("[Lobby] Join successful:", joinResponse);

            // Store join state for meeting page
            sessionStorage.setItem(`meeting_${meetingId}_join_state`, JSON.stringify(joinState));

            // Redirect to meeting
            router.push(`/meeting/${meetingId}`);
        } catch (error: any) {
            console.error("[Lobby] Failed to join:", error);
            setJoinError(error.message || "Failed to join meeting");
            setIsJoining(false);
        }
    };

    // Determine hardware status
    const cameraStatus: HardwareStatusType =
        devices.cameraPermission === "granted" && devices.hasCamera
            ? "ready"
            : devices.cameraPermission === "denied"
            ? "blocked"
            : "limited";

    const microphoneStatus: HardwareStatusType =
        devices.microphonePermission === "granted" && devices.hasMicrophone
            ? "ready"
            : devices.microphonePermission === "denied"
            ? "blocked"
            : "limited";

    const canJoin = 
        (devices.cameraPermission === "granted" || devices.microphonePermission === "granted") &&
        !isJoining;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Privacy Indicator */}
            <PrivacyIndicator 
                isCameraActive={!!videoStream && isVideoEnabled}
                isMicActive={!!audioStream && !isMuted}
            />
            
            <div className="container max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        {meetingConfig?.title || "Joining Meeting"}
                    </h1>
                    <p className="text-slate-600">Get ready before you join</p>
                </div>

                {/* Policy Banner */}
                <div className="mb-6">
                    <PolicyBanner 
                        policy={meetingConfig?.policies} 
                        isLoading={isPolicyLoading}
                    />
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column - Video Preview */}
                    <div className="lg:col-span-2 space-y-6">
                        <VideoPreview
                            stream={videoStream}
                            isVideoEnabled={isVideoEnabled}
                            onToggleVideo={handleToggleVideo}
                            userName={user?.full_name || "Guest"}
                            avatarUrl={user?.avatar}
                            isDisabled={meetingConfig?.policies?.video_locked}
                            disabledReason={
                                meetingConfig?.policies?.video_locked
                                    ? "Host has locked video controls"
                                    : undefined
                            }
                        />
                    </div>

                    {/* Right Column - Controls */}
                    <div className="space-y-6">
                        {/* Audio Controls */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <AudioControls
                                stream={audioStream}
                                isMuted={isMuted}
                                onToggleMute={handleToggleMute}
                                microphones={devices.microphones}
                                speakers={devices.speakers}
                                selectedMicrophone={devices.selectedMicrophone}
                                selectedSpeaker={devices.selectedSpeaker}
                                onSelectMicrophone={devices.selectMicrophone}
                                onSelectSpeaker={devices.selectSpeaker}
                                isDisabled={meetingConfig?.policies?.audio_locked}
                                disabledReason={
                                    meetingConfig?.policies?.audio_locked
                                        ? "Host has locked audio controls"
                                        : undefined
                                }
                            />
                        </div>

                        {/* Hardware Status */}
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <HardwareStatus
                                cameraStatus={cameraStatus}
                                microphoneStatus={microphoneStatus}
                                cameraMessage={
                                    cameraStatus === "blocked"
                                        ? "Camera access denied"
                                        : cameraStatus === "limited"
                                        ? "No camera detected"
                                        : `${devices.cameras.length} camera(s) available`
                                }
                                microphoneMessage={
                                    microphoneStatus === "blocked"
                                        ? "Microphone access denied"
                                        : microphoneStatus === "limited"
                                        ? "No microphone detected"
                                        : `${devices.microphones.length} microphone(s) available`
                                }
                            />
                        </div>

                        {/* Join Button */}
                        <Button
                            onClick={handleJoinMeeting}
                            disabled={!canJoin}
                            className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            data-join-button
                        >
                            {isJoining ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Joining...
                                </>
                            ) : (
                                <>
                                    <Video className="h-5 w-5 mr-2" />
                                    Join Meeting
                                </>
                            )}
                        </Button>

                        {!canJoin && !isJoining && (
                            <p className="text-xs text-center text-slate-500" role="alert">
                                Please allow camera or microphone access to join
                            </p>
                        )}

                        {/* Error Display */}
                        {joinError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-md" role="alert">
                                <p className="text-sm text-red-800 font-medium">Join Error</p>
                                <p className="text-xs text-red-700 mt-1">{joinError}</p>
                                <button
                                    onClick={() => setJoinError(null)}
                                    className="text-xs text-red-600 underline mt-2"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
