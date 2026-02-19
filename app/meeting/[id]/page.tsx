"use client";

import { Button } from "@/components/ui/button";
import { Mic, Video, PhoneOff, Settings, MessageSquare, Users, Share, Volume2, MonitorUp, MoreHorizontal, Shield, Camera, Filter, X, MicOff, Hand, Smile, LayoutDashboard, Paperclip, Image as ImageIcon, SendHorizontal, Bold, Italic, Underline, Search, Link as LinkIcon, Mail, Grid, User, Users2, Maximize, EyeOff, Monitor, Disc, Captions, HelpCircle, Activity, Zap, ArrowLeft, Layout, MoveVertical, Wifi, VideoOff, AppWindow, Presentation, FileText, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Calendar, Info, Copy, Check, Plus, Keyboard, LogOut, DoorOpen, Lock } from "lucide-react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/logo";
import { ScheduleMeetingModal } from "@/components/schedule-meeting-modal";
import { useSocket } from "@/lib/socket";
import useSWR from "swr";
import { fetcher } from "@/lib/api";

import { ParticipantItem } from "@/components/meeting/participant-item";
import { ChatPanel } from "@/components/meeting/chat/chat-panel";
import { ChatMessage } from "@/components/meeting/chat/types";
import { PeerConnectionManager } from "@/lib/webrtc";
import { ScreenRecorder } from "@/lib/screen-recorder";
import { BandwidthDetector } from "@/lib/bandwidth-detector";
import { QualityPreset, getDisplayMediaWithQuality } from "@/lib/webrtc-config";
import { VideoGrid } from "@/components/VideoGrid";
import { SpeakingDetector } from "@/lib/speakingDetector";
import { useMediaDevices } from "@/lib/hooks/useMediaDevices";
import { mediaStreamManager } from "@/lib/mediaManager";
import { ParticipantPresence } from "@/lib/gridLayout";
import { ReactionPicker } from "@/components/meeting/ReactionPicker";
import { FloatingReaction } from "@/components/meeting/FloatingReaction";
import "./reactions.css";

// Presence type definition
// Presence type definition - Now imported from lib/gridLayout as GridParticipantPresence

const BACKGROUND_OPTIONS = [
    { name: 'Modern Office', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80' },
    { name: 'Cozy Home', url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=400&q=80' },
    { name: 'Executive Room', url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80' },
    { name: 'Bookshelf', url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=400&q=80' },
    { name: 'Neon Vibes', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=80' },
    { name: 'Nature', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=400&q=80' },
];

export default function MeetingPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    // Bypass lobby if join=1 is present
    const [isInLobby, setIsInLobby] = useState(() => {
        return searchParams.get('join') !== '1';
    });
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Guest Identity
    const [guestId, setGuestId] = useState('');
    useEffect(() => {
        if (typeof window !== 'undefined') {
            let id = sessionStorage.getItem('guest_id');
            if (!id) {
                id = `guest_${Math.random().toString(36).substr(2, 9)}`;
                sessionStorage.setItem('guest_id', id);
            }
            setGuestId(id);
        }
    }, []);



    // Draggable Video State (Must be declared before useEffects)
    const [videoPosition, setVideoPosition] = useState({ x: 0, y: 0 });
    const [isVideoDragging, setIsVideoDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    
    // Video Grid State
    const [pinnedUserId, setPinnedUserId] = useState<string | null>(null);
    const [spotlightedUserId, setSpotlightedUserId] = useState<string | null>(null);

    useEffect(() => {
        // Hydration fix for window access - Default to TOP RIGHT as requested
        // x = window width - video width (approx 200px) - margin (20px)
        // y = margin (20px)
        setVideoPosition({ x: window.innerWidth - 220, y: 20 });
    }, []);

    // Media State
    const [micOn, setMicOn] = useState(true);
    const [videoOn, setVideoOn] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    const toggleMic = () => {
        const targetState = !micOn; // If currently ON, target is OFF (Mute = true) -> isMuted = true
        // isMuted = !targetState

        if (socket && socket.readyState === WebSocket.OPEN && effectiveUserId) {
            // Permission Check (Client-side fast fail)
            const me = participants.find(p => p.id === effectiveUserId);
            // If Trying to Unmute (targetState=true) AND Audio Locked AND I am not admin
            const isLocked = meetingData?.settings?.audio_locked;
            const isAdmin = me?.role === 'host' || me?.role === 'co-host';

            if (targetState && isLocked && !isAdmin) {
                toast.error("Audio is locked by the host.");
                return;
            }

            socket.send(JSON.stringify({
                type: 'audio_control',
                action: 'set_mute_state',
                target_user_id: effectiveUserId,
                requested_state: !targetState // requested_state is isMuted
            }));
        } else {
            // Offline fallback or error
            toast.error("Connection lost. Cannot toggle audio.");
        }
    };
    const toggleVideo = () => {
        const targetState = !videoOn;
        const me = participants.find(p => p.id === effectiveUserId);
        const isLocked = meetingData?.settings?.video_locked;
        const isAdmin = me?.role === 'host' || me?.role === 'co-host';

        // 1. Check Global Lock
        if (targetState && isLocked && !isAdmin) {
            toast.error("Camera is disabled by the host.");
            return;
        }

        // 2. Check Individual Permission
        if (targetState && me && !me.permissions?.canShareVideo) {
            toast.error("Your camera permission has been revoked.");
            return;
        }

        // Enterprise: Request Change, do not just toggle
        if (socket && socket.readyState === WebSocket.OPEN && effectiveUserId) {
            socket.send(JSON.stringify({
                type: 'video_control',
                action: 'set_video_state',
                target_user_id: effectiveUserId,
                requested_state: targetState
            }));
        } else {
             toast.error("Connection lost. Cannot toggle video.");
        }
    };

    const [filterMode, setFilterMode] = useState<'none' | 'blur' | 'image'>('none');
    const [backgroundImage, setBackgroundImage] = useState<string>(BACKGROUND_OPTIONS[0].url);
    const [showBackgroundPanel, setShowBackgroundPanel] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0); // 0-100

    // Device State
    const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
    const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
    const [audioMode, setAudioMode] = useState<'computer' | 'phone' | 'room' | 'none'>('computer');

    // Audio Analysis
    // --- STATE FOR MEETING ROOM FUNCTIONALITY ---
    // --- STATE FOR MEETING ROOM FUNCTIONALITY ---
    // --- STATE FOR MEETING ROOM FUNCTIONALITY ---
    const [activePanel, setActivePanel] = useState<'none' | 'chat' | 'people'>('none');

    // Resizable Panel State
    const [panelWidth, setPanelWidth] = useState(360);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let isDragging = false;

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 280 && newWidth < 800) {
                setPanelWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            isDragging = false;
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };

        const handleMouseDown = (e: MouseEvent) => {
            // Check if we are clicking on the resizer handle
            // This is handled by the onMouseDown event on the div itself, but we need this closure for the listeners
        };

        if (isResizing) {
            isDragging = true;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (isVideoDragging) {
                setVideoPosition({
                    x: e.clientX - dragOffset.current.x,
                    y: e.clientY - dragOffset.current.y
                });
            }
        };

        const handleGlobalMouseUp = () => {
            setIsVideoDragging(false);
        };

        if (isVideoDragging) {
            window.addEventListener('mousemove', handleGlobalMouseMove);
            window.addEventListener('mouseup', handleGlobalMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isVideoDragging]);

    const startResizing = () => {
        setIsResizing(true);
    };

    // --- Real-Time Integration ---
    const { data: user, isLoading: userLoading } = useSWR('/users/me', fetcher);
    // Effective User ID (User ID if logged in, otherwise Guest ID)
    const effectiveUserId = user?.id || guestId;

    const meetingId = params.id as string;

    // Fetch initial meeting state
    const { data: meetingData, mutate: mutateMeeting, isLoading: meetingLoading } = useSWR(meetingId && meetingId !== 'new' ? `/meetings/code/${meetingId}` : null, fetcher);

    useEffect(() => {
        console.log("MeetingPage State:", { meetingId, meetingData, user, userLoading, meetingLoading });
        if (meetingData) {
            console.log("Started At:", meetingData.started_at);
            console.log("Host ID:", meetingData.host_id, "Effective User ID:", effectiveUserId);
        }
    }, [meetingData, user, userLoading, meetingLoading, meetingId]);

    // Timer Logic - Synced with Server
    useEffect(() => {
        if (!meetingData?.started_at) {
            setElapsedSeconds(0);
            return;
        }

        const calculateElapsed = () => {
            const startTime = new Date(meetingData.started_at).getTime();
            const now = Date.now();
            const elapsed = Math.max(0, Math.floor((now - startTime) / 1000));
            setElapsedSeconds(elapsed);
        };

        // Initial calculation
        calculateElapsed();

        const interval = setInterval(calculateElapsed, 1000);
        return () => clearInterval(interval);
    }, [meetingData?.started_at]);

    // Socket Connection
    const { socket, lastMessage } = useSocket(meetingData?.id, effectiveUserId);

    // Participant State
    // (Moved hooks up to avoid conditional hook execution)
    type ParticipantPermissions = {
        canUnmute: boolean;
        canShareVideo: boolean;
        canShareScreen: boolean;
        canChat: boolean;
        canUseReactions: boolean;
    };

    type Participant = {
        id: string;
        name: string;
        role: 'host' | 'co-host' | 'presenter' | 'guest';
        status: 'In Meeting' | 'Invited' | 'Suggestion' | 'waiting';
        isMuted: boolean;
        isHandRaised?: boolean;
        isVideoOn?: boolean;
        avatarColor: string;
        jobTitle?: string;
        user_id?: string;
        permissions: ParticipantPermissions;
    };

    // Simplified Message type removed in favor of ChatMessage


    const [participants, setParticipants] = useState<Participant[]>([]);
    
    // Enterprise Video Presence State
    const [presenceParticipants, setPresenceParticipants] = useState<ParticipantPresence[]>([]);
    const [videoStreams, setVideoStreams] = useState<Map<string, MediaStream>>(new Map());
    
    
    // Enterprise: Pin & Spotlight
    const [pinnedUserIds, setPinnedUserIds] = useState<string[]>([]); // Client-side only, session-only
    const [spotlightedUserIds, setSpotlightedUserIds] = useState<string[]>([]); // Global, DB-persisted
    
    // Enterprise: Reactions
   interface ReactionEvent {
        id: string;
        user_id: string;
        user_name: string;
        reaction: string;
        timestamp: number;
    }
    const [reactions, setReactions] = useState<ReactionEvent[]>([]);
    const [reactionPolicy, setReactionPolicy] = useState({
        allow_reactions: true,
        allowed_roles: ['host', 'co-host', 'participant']
    });
    
    // Device Management
    const devices = useMediaDevices();

    // Initialize local stream on join
    useEffect(() => {
        const initializeLocalStream = async () => {
            if (devices.cameraPermission !== "granted" && devices.microphonePermission !== "granted") {
                await devices.enumerateDevices();
            }

            // Restore from lobby state if available
            const savedState = sessionStorage.getItem(`meeting_${meetingId}_join_state`);
            if (savedState) {
                const state = JSON.parse(savedState);
                if (state.selected_devices?.video_input) {
                    devices.selectCamera(state.selected_devices.video_input);
                }
                if (state.selected_devices?.audio_input) {
                    devices.selectMicrophone(state.selected_devices.audio_input);
                }
            }
        };
        initializeLocalStream();
    }, []);

    // Active Camera Stream Management
    useEffect(() => {
        if (!videoOn || !devices.selectedCamera) {
            if (userStream) {
                userStream.getTracks().forEach(t => t.stop());
                setUserStream(null);
                // Clear from videoStreams
                if (effectiveUserId) {
                    setVideoStreams(prev => {
                        const next = new Map(prev);
                        next.delete(effectiveUserId);
                        return next;
                    });
                }
            }
            return;
        }

        let mounted = true;

        const startStream = async () => {
            try {
                const stream = await mediaStreamManager.getVideoPreview(devices.selectedCamera!);
                if (!mounted) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                setUserStream(stream);

                // CRITICAL: Update videoStreams map for self-view
                if (effectiveUserId) {
                    setVideoStreams(prev => {
                        const next = new Map(prev);
                        next.set(effectiveUserId, stream);
                        return next;
                    });
                }
            } catch (err) {
                console.error("Failed to start camera:", err);
                toast.error("Failed to access camera");
            }
        };

        startStream();

        return () => {
            mounted = false;
        };
    }, [videoOn, devices.selectedCamera, effectiveUserId]);
    




    // Initialize Participants from Backend
    useEffect(() => {
        if (meetingData?.participants) {
            setParticipants(prevParticipants => {
                // Deduplicate incoming participants based on user_id
                const uniqueIncoming = meetingData.participants.filter((p: any, index: number, self: any[]) =>
                    index === self.findIndex((t: any) => (
                        t.user_id === p.user_id
                    ))
                );

                const merged = uniqueIncoming.map((p: any) => {
                    const existing = prevParticipants.find(prev => prev.id === p.user_id);
                    // Standardize role to match lib/gridLayout
                    const rawRole = p.role?.toLowerCase() || (String(p.user_id) === String(meetingData.host_id) ? 'host' : 'guest');
                    const normalizedRole = rawRole === 'host' ? 'host' : (rawRole === 'co-host' ? 'co-host' : 'participant');

                    // Rule 3: Initialization - DB Wins
                    let isMutedValue = true;
                    if (p.isMuted !== undefined) isMutedValue = p.isMuted;
                    else if (existing) isMutedValue = existing.isMuted;

                    const finalRole = (rawRole === 'host' || rawRole === 'co-host' || rawRole === 'presenter' || rawRole === 'guest') 
                        ? rawRole 
                        : 'guest';

                    return {
                        id: p.user_id,
                        name: p.name,
                        role: finalRole,
                        status: p.status === 'active' ? 'In Meeting' : (p.status || 'In Meeting'),
                        isMuted: isMutedValue,
                        isHandRaised: existing ? existing.isHandRaised : false,
                        isVideoOn: p.isVideoOn !== undefined ? p.isVideoOn : false,
                        avatarColor: existing ? existing.avatarColor : `bg-indigo-100 text-indigo-700`,
                        jobTitle: existing ? existing.jobTitle : 'Participant',
                        joined_at: p.joined_at || new Date().toISOString(), // Ensure joined_at exists
                        permissions: p.permissions || {
                            canUnmute: true,
                            canShareVideo: true,
                            canShareScreen: true,
                            canChat: true,
                            canUseReactions: true
                        }
                    };
                });
                return merged;
            });
        }
    }, [meetingData, user]);

    // Derived Presence State for Grid (Full List)
    const gridParticipants = useMemo(() => {
        // Map UI participants to Presence interface
        return participants.map(p => ({
            user_id: p.id,
            name: p.name,
            role: (p.role === 'host' || p.role === 'co-host') ? p.role : 'participant',
            presence: 'connected', // Default to connected for now
            // Ensure media state is accurate by checking presenceParticipants first (real-time source)
            // fallback to legacy 'participants' state if not found
            is_video_on: presenceParticipants.find(pp => pp.user_id === p.id)?.is_video_on ?? !!p.isVideoOn,
            is_audio_on: presenceParticipants.find(pp => pp.user_id === p.id)?.is_audio_on ?? !p.isMuted,
            is_speaking: presenceParticipants.find(pp => pp.user_id === p.id)?.is_speaking || false,
            is_presenting: false, // TODO: Link to screen share state
            is_hand_raised: !!p.isHandRaised,
            is_spotlighted: spotlightedUserIds.includes(p.id),
            avatar_color: p.avatarColor,
            joined_at: (p as any).joined_at || new Date().toISOString()
        })) as ParticipantPresence[];
    }, [participants, presenceParticipants, spotlightedUserIds]);

    // Handle Real-Time Events
    useEffect(() => {
        if (!lastMessage) return;

        if (lastMessage.type === 'user_joined') {
            console.log("User Joined Event:", lastMessage);
            mutateMeeting((prev: any) => {
                if (!prev) return prev;
                // Check if already exists to avoid dupes
                if (prev.participants.some((p: any) => p.user_id === lastMessage.user_id)) {
                    return prev;
                }
                return {
                    ...prev,
                    participants: [...prev.participants, {
                        user_id: lastMessage.user_id,
                        name: lastMessage.name || "Guest", // Use name from backend
                        joined_at: lastMessage.timestamp
                    }]
                };
            }, false); // Update SWR cache without revalidation
        }

        if (lastMessage.type === 'user_left') {
            console.log("User Left Event:", lastMessage);
            mutateMeeting((prev: any) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    participants: prev.participants.filter((p: any) => p.user_id !== lastMessage.user_id)
                };
            }, false);
        }

        if (lastMessage.type === 'meeting_ended') {
            alert("The host has ended the meeting.");
            router.push('/dashboard');
        }

        if (lastMessage.type === 'user_update') {
            // Rule 2: Idempotent Updates
            // Update the specific user in the participants array
            // This is the SINGLE point where UI state is updated from the Truth
            setParticipants(prev => prev.map(p => {
                if (p.id !== lastMessage.user_id) return p;
                
                const updates = { ...lastMessage.data };
                if (updates.status === 'active') updates.status = 'In Meeting';
                if (updates.role) {
                    updates.role = updates.role.toLowerCase();
                    if (!['host', 'co-host', 'presenter', 'guest'].includes(updates.role)) {
                        updates.role = 'guest';
                    }
                }
                
                return { ...p, ...updates };
            }));
        }
        
        // ================== ENTERPRISE PRESENCE EVENTS ==================
        
        // Participant joined with full presence data
        if (lastMessage.type === 'participant_joined' && lastMessage.data) {
            console.log('[Presence] Participant joined:', lastMessage.data);
            const joinedUser = lastMessage.data;
            
            setPresenceParticipants(prev => {
                // Avoid duplicates
                if (prev.some(p => p.user_id === joinedUser.user_id)) {
                    return prev;
                }
                return [...prev, joinedUser];
            });
            
            // ====== CRITICAL: Create WebRTC Peer Connection for Video/Audio ======
            // When a new participant joins, establish P2P connection for their camera/mic
            if (joinedUser.user_id !== effectiveUserId && effectiveUserId) {
                console.log('[WebRTC] New participant joined:', joinedUser.user_id);
                
                // Initialize peer manager if needed
                if (!peerManagerRef.current) {
                    peerManagerRef.current = new PeerConnectionManager();
                }
                
                // Check if peer already exists to avoid duplicates
                const existingPeer = peerManagerRef.current.getPeer(joinedUser.user_id);
                if (existingPeer) {
                    console.log('[WebRTC] Peer connection already exists for', joinedUser.user_id, 'skipping creation');
                    return;
                }
                
                // Use tie-breaker: only the user with the lower ID initiates
                const shouldInitiate = effectiveUserId < joinedUser.user_id;
                
                if (shouldInitiate) {
                    console.log('[WebRTC] Creating initiator peer connection');
                    
                    peerManagerRef.current.createPeer({
                        userId: joinedUser.user_id,
                        initiator: true,
                        stream: userStream || undefined,
                        onSignal: (signal) => {
                            if (socket && socket.readyState === WebSocket.OPEN) {
                                socket.send(JSON.stringify({
                                    type: 'webrtc_signal',
                                    to_user_id: joinedUser.user_id,
                                    from_user_id: effectiveUserId,
                                    signal: signal
                                }));
                            }
                        },
                        onStream: (remoteStream) => {
                            console.log('[WebRTC] Received camera stream from:', joinedUser.user_id);
                            setVideoStreams(prev => {
                                const next = new Map(prev);
                                next.set(joinedUser.user_id, remoteStream);
                                return next;
                            });
                        },
                        onError: (err) => {
                            console.error('[WebRTC] Peer connection error:', err);
                        },
                        onClose: () => {
                            console.log('[WebRTC] Peer connection closed:', joinedUser.user_id);
                        }
                    });
                } else {
                    console.log('[WebRTC] I am responder (higher ID), waiting for signal from', joinedUser.user_id);
                }
            }
        }
        
        // Initial participant list (for late joiners)
        if (lastMessage.type === 'participant_list' && Array.isArray(lastMessage.data)) {
            console.log('[Presence] Received participant list:', lastMessage.data);
            const existingParticipants = lastMessage.data;
            
            setPresenceParticipants(prev => {
                // Merge with existing, avoid duplicates
                const newParticipants = existingParticipants.filter((newP: ParticipantPresence) =>
                    !prev.some(p => p.user_id === newP.user_id)
                );
                return [...prev, ...newParticipants];
            });
            
            // ====== CRITICAL: Create WebRTC Connections for Existing Participants ======
            // Late joiner needs to connect to all existing participants
            if (effectiveUserId) {
                console.log('[WebRTC] Late joiner: Creating connections to existing participants');
                
                // Initialize peer manager if needed
                if (!peerManagerRef.current) {
                    peerManagerRef.current = new PeerConnectionManager();
                }
                
                existingParticipants.forEach((participant: ParticipantPresence) => {
                    if (participant.user_id !== effectiveUserId) {
                        // Check if peer already exists to avoid duplicates
                        const existingPeer = peerManagerRef.current!.getPeer(participant.user_id);
                        if (existingPeer) {
                            console.log('[WebRTC] Peer connection already exists for', participant.user_id, 'skipping');
                            return;
                        }
                        
                        const shouldInitiate = effectiveUserId < participant.user_id;
                        
                        if (shouldInitiate) {
                            console.log('[WebRTC] Creating connection as initiator to:', participant.user_id);
                            
                            peerManagerRef.current!.createPeer({
                                userId: participant.user_id,
                                initiator: true,
                                stream: userStream || undefined,
                                onSignal: (signal) => {
                                    if (socket && socket.readyState === WebSocket.OPEN) {
                                        socket.send(JSON.stringify({
                                            type: 'webrtc_signal',
                                            to_user_id: participant.user_id,
                                            from_user_id: effectiveUserId,
                                            signal: signal
                                        }));
                                    }
                                },
                                onStream: (remoteStream) => {
                                    console.log('[WebRTC] Received camera stream from:', participant.user_id);
                                    setVideoStreams(prev => {
                                        const next = new Map(prev);
                                        next.set(participant.user_id, remoteStream);
                                        return next;
                                    });
                                },
                                onError: (err) => {
                                    console.error('[WebRTC] Peer connection error:', err);
                                },
                                onClose: () => {
                                    console.log('[WebRTC] Peer connection closed:', participant.user_id);
                                }
                            });
                        } else {
                            console.log('[WebRTC] Waiting for signal from', participant.user_id);
                        }
                    }
                });
            }
        }
        
        // Participant presence update (camera/mic/speaking)
        if (lastMessage.type === 'participant_update') {
            console.log('[Presence] Participant update:', lastMessage.user_id, lastMessage.updates);
            setPresenceParticipants(prev => prev.map(p =>
                p.user_id === lastMessage.user_id
                    ? { ...p, ...lastMessage.updates }
                    : p
            ));
        }
        
        // Participant left
        if (lastMessage.type === 'participant_left') {
            console.log('[Presence] Participant left:', lastMessage.user_id);
            setPresenceParticipants(prev => prev.filter(p => p.user_id !== lastMessage.user_id));
            // Clean up video stream
            setVideoStreams(prev => {
                const next = new Map(prev);
                next.delete(lastMessage.user_id);
                return next;
            });
        }

        if (lastMessage.type === 'meeting_settings_updated' || lastMessage.type === 'meeting_settings_update') {
             const settings = lastMessage.settings || {};
             mutateMeeting((prev: any) => {
                 if (!prev) return prev;
                 return {
                     ...prev,
                     settings: { ...prev.settings, ...settings }
                 };
             }, false);
             
             if (settings.audio_locked !== undefined) {
                 toast.info(settings.audio_locked ? "Audio has been locked by host." : "Audio has been unlocked.");
                 // If locked and we are unmuted and not admin? Usually lock doesn't force mute existing, just prevents new unmutes.
                 // But typically "Lock Audio" also mutes everyone.
                 // The backend 'mute_all' handler does the muting. 'lock' just locks.
             }
        }

        if (lastMessage.type === 'meeting_updated') {
             mutateMeeting(lastMessage.meeting, false);
        }

        if (lastMessage.type === 'participant_audio_update') {
            const { user_id, isMuted, updated_by } = lastMessage;
            
            // Legacy State Update
            setParticipants(prev => prev.map(p => 
                p.id === user_id ? { ...p, isMuted } : p
            ));

            // Enterprise Presence Update (Crucial for VideoGrid)
            setPresenceParticipants(prev => prev.map(p => 
                p.user_id === user_id ? { ...p, is_audio_on: !isMuted } : p
            ));
            
            // Notification if I was modified by someone else
            if (effectiveUserId === user_id && updated_by !== effectiveUserId) {
                if (isMuted) {
                    toast.info("You have been muted by the host."); 
                } else {
                    toast.success("You have been unmuted.");
                }
            }
        }

        if (lastMessage.type === 'participant_video_update') {
            const { user_id, is_video_on, updated_by } = lastMessage;
            
            // Legacy State Update
            setParticipants(prev => prev.map(p => 
                p.id === user_id ? { ...p, isVideoOn: is_video_on } : p
            ));

            // Enterprise Presence Update (Crucial for VideoGrid)
            setPresenceParticipants(prev => prev.map(p => 
                p.user_id === user_id ? { ...p, is_video_on: is_video_on } : p
            ));
            
            // Sync local state if it's me
            if (effectiveUserId === user_id) {
                 setVideoOn(is_video_on);
                 if (!is_video_on && updated_by !== effectiveUserId) {
                     toast.info("Your camera has been stopped by the host.");
                 }
            }
        }
        
        if (lastMessage.type === 'participant_video_update_bulk' && lastMessage.action === 'stop_all_video') {
             const { except_user } = lastMessage;
             setParticipants(prev => prev.map(p => 
                 p.id === except_user ? p : { ...p, isVideoOn: false }
             ));
             
             if (effectiveUserId !== except_user) {
                 setVideoOn(false);
                 toast.info("The host has stopped all videos.");
             }
        }

        if (lastMessage.type === 'screen_share_update') {
             const { active_presenter_id, updated_by } = lastMessage;
             setActivePresenterId(active_presenter_id);

             // Handle UI State for Viewer
             if (active_presenter_id) {
                 // Someone is sharing (or me)
                 // If it's NOT me, and I was sharing, I should have stopped by now via logic below.
             }

             // Hard Sync: If I am sharing locally, but server says someone else (or null) is active...
             // STOP MY TRACKS IMMEDIATELY.
             if (isScreenSharing && active_presenter_id !== effectiveUserId) {
                 if (screenStream) {
                     screenStream.getTracks().forEach(t => t.stop());
                     setScreenStream(null);
                 }
                 setIsScreenSharing(false);
                 setSharingMode('screen');
                 toast.info("Your screen share has been stopped.");
             }
        }

        // WebRTC Signaling Handler
        if (lastMessage.type === 'webrtc_signal') {
            const { from_user_id, signal } = lastMessage;
            
            // Initialize peer manager if needed
            if (!peerManagerRef.current) {
                peerManagerRef.current = new PeerConnectionManager();
            }

            // Check if we already have a peer for this user
            const existingPeer = peerManagerRef.current.getPeer(from_user_id);
            
            if (existingPeer) {
                // We have an existing peer, just handle the signal
                console.log('[WebRTC] Handling signal for existing peer:', from_user_id);
                peerManagerRef.current.handleSignal(from_user_id, signal);
            } else {
                // No existing peer - need to create one
                // Use tie-breaker: only respond if we have a lower user ID
                // This prevents both sides from becoming initiators simultaneously
                const shouldBeInitiator = effectiveUserId && effectiveUserId < from_user_id;
                
                if (signal.type === 'offer' || !shouldBeInitiator) {
                    // Receive an offer OR we should be the responder (higher ID)
                    console.log('[WebRTC] Creating peer as responder for:', from_user_id);
                    
                    peerManagerRef.current.createPeer({
                        userId: from_user_id,
                        initiator: false,
                        stream: userStream || undefined, // Send our camera stream back
                        onSignal: (responseSignal) => {
                            // Send our signal back
                            if (socket && socket.readyState === WebSocket.OPEN && effectiveUserId) {
                                socket.send(JSON.stringify({
                                    type: 'webrtc_signal',
                                    to_user_id: from_user_id,
                                    from_user_id: effectiveUserId,
                                    signal: responseSignal
                                }));
                            }
                        },
                        onStream: (remoteStream) => {
                            console.log('[WebRTC] Received camera stream from', from_user_id);
                            // Add to video streams for camera feeds
                            setVideoStreams(prev => {
                                const next = new Map(prev);
                                next.set(from_user_id, remoteStream);
                                return next;
                            });
                        },
                        onError: (err) => {
                            console.error('[WebRTC] Peer error:', err);
                        },
                        onClose: () => {
                            console.log('[WebRTC] Peer connection closed:', from_user_id);
                            setVideoStreams(prev => {
                                const next = new Map(prev);
                                next.delete(from_user_id);
                                return next;
                            });
                        }
                    });
                    
                    // Now handle the signal
                    peerManagerRef.current.handleSignal(from_user_id, signal);
                } else {
                    // We should be the initiator (lower ID), ignore this signal
                    // Our outgoing connection should handle this
                    console.log('[WebRTC] Ignoring signal (tie-breaker), we should initiate');
                }
            }
        }

        // Late Joiner Support: Auto-connect to active presenter
        if (lastMessage.type === 'active_presenter_notification') {
            const { active_presenter_id } = lastMessage;
            
            console.log('[Late Joiner] Received notification:', {
                active_presenter_id,
                effectiveUserId,
                isSameUser: active_presenter_id === effectiveUserId
            });
            
            if (active_presenter_id && active_presenter_id !== effectiveUserId) {
                console.log('[Late Joiner] Notified of active presenter:', active_presenter_id);
                
                if (!peerManagerRef.current) {
                    peerManagerRef.current = new PeerConnectionManager();
                    console.log('[Late Joiner] Created new PeerConnectionManager');
                }

                // Check if we already have a peer connection with this presenter
                const existingPeer = peerManagerRef.current.getPeer(active_presenter_id);
                if (existingPeer) {
                    console.log('[Late Joiner] Peer connection already exists, skipping');
                    return;
                }

                console.log('[Late Joiner] Creating new peer connection as initiator');
                peerManagerRef.current.createPeer({
                    userId: active_presenter_id,
                    initiator: true, // We initiate to request the stream
                    onSignal: (signal) => {
                        console.log('[Late Joiner] Sending WebRTC signal to presenter');
                        if (socket && socket.readyState === WebSocket.OPEN) {
                            socket.send(JSON.stringify({
                                type: 'webrtc_signal',
                                to_user_id: active_presenter_id,
                                from_user_id: effectiveUserId,
                                signal
                            }));
                        }
                    },
                    onStream: (remoteStream) => {
                        console.log('[Late Joiner] ✅ Received screen stream from presenter');
                        setRemoteScreenStream(remoteStream);
                        // Also add to video streams for presence system
                        setVideoStreams(prev => new Map(prev).set(active_presenter_id, remoteStream));
                        toast.success('Connected to screen share');
                    },
                    onError: (err) => {
                        console.error('[Late Joiner] Connection error:', err);
                    },
                    onClose: () => {
                        console.log('[Late Joiner] Connection closed');
                        setRemoteScreenStream(null);
                    }
                });
            } else {
                console.log('[Late Joiner] Skipping - same user or no presenter_id');
            }
        }

        if (lastMessage.type === 'audio_control' && lastMessage.action === 'request_to_unmute') {
             toast("The host would like you to unmute", {
                 action: {
                     label: "Unmute",
                     onClick: () => toggleMic()
                 }
             });
        }
        
        if (lastMessage.type === 'participant_audio_update_bulk' && lastMessage.action === 'mute_all') {
             const { except_user } = lastMessage;
             setParticipants(prev => prev.map(p => 
                 p.id === except_user ? p : { ...p, isMuted: true }
             ));
             if (effectiveUserId !== except_user) {
                 toast.info("The host has muted everyone.");
             }
        }

        if (lastMessage.type === 'participant_updated') {
            const { action, targetId, value } = lastMessage;

            // Update local state
            setParticipants(prev => prev.map(p => {
                if (p.id !== targetId) return p;

                // Apply specific updates based on action
                // Apply specific updates based on action
                switch (action) {
                    case 'mute_participant':
                        return { ...p, isMuted: true };
                    case 'stop_video':
                        return { ...p, isVideoOn: false };
                    case 'promote_host':
                        return { ...p, role: 'co-host' };
                    case 'demote_host':
                        return { ...p, role: 'guest' };

                    // Locks
                    case 'lock_mic':
                        return { ...p, permissions: { ...p.permissions, canUnmute: false } };
                    case 'unlock_mic':
                        return { ...p, permissions: { ...p.permissions, canUnmute: true } };
                    case 'lock_camera':
                        return { ...p, permissions: { ...p.permissions, canShareVideo: false } };
                    case 'unlock_camera':
                        return { ...p, permissions: { ...p.permissions, canShareVideo: true } };
                    case 'lock_screen_share':
                        return { ...p, permissions: { ...p.permissions, canShareScreen: false } };
                    case 'unlock_screen_share':
                        return { ...p, permissions: { ...p.permissions, canShareScreen: true } };
                    case 'lock_chat':
                        return { ...p, permissions: { ...p.permissions, canChat: false } };
                    case 'unlock_chat':
                        return { ...p, permissions: { ...p.permissions, canChat: true } };
                    case 'lock_reactions':
                        return { ...p, permissions: { ...p.permissions, canUseReactions: false } };
                    case 'unlock_reactions':
                        return { ...p, permissions: { ...p.permissions, canUseReactions: true } };

                    // Moderation
                    case 'send_to_waiting_room':
                        return { ...p, status: 'waiting' };
                    case 'admit_participant':
                        return { ...p, status: 'In Meeting' };

                    default:
                        return p;
                }
            })); // End setParticipants

            // Sync Enterprise Presence State for Actions affecting Media
            if (action === 'mute_participant') {
                setPresenceParticipants(prev => prev.map(p => 
                    p.user_id === targetId ? { ...p, is_audio_on: false } : p
                ));
            }
            if (action === 'stop_video') {
                setPresenceParticipants(prev => prev.map(p => 
                    p.user_id === targetId ? { ...p, is_video_on: false } : p
                ));
            }

            // Sync hardware/UI if I am the target
            if (effectiveUserId === targetId) {
                if (action === 'mute_participant') setMicOn(false);
                if (action === 'stop_video') setVideoOn(false);

                if (action === 'lock_mic') {
                    setMicOn(false); // Force mute on lock
                    alert("The host has locked your microphone.");
                }
                if (action === 'lock_camera') {
                    setVideoOn(false);
                    alert("The host has locked your camera.");
                }
                if (action === 'lock_screen_share') {
                    stopScreenShare();
                    alert("The host has disabled screen sharing.");
                }
                if (action === 'send_to_waiting_room') {
                    // We don't have a specific Waiting Room UI page yet
                    // But we should stop media
                    setMicOn(false);
                    setVideoOn(false);
                    stopScreenShare();
                    alert("You have been sent to the waiting room.");
                }
                if (action === 'participant_removed') {
                    alert("You have been removed from the meeting.");
                    router.push('/dashboard');
                }
            }
        }

        if (lastMessage.type === 'participant_removed') {
            setParticipants(prev => prev.filter(p => p.id !== lastMessage.targetId));
            if (effectiveUserId === lastMessage.targetId) {
                alert("You have been removed from the meeting.");
                router.push('/dashboard');
            }
        }

        // ================== ENTERPRISE REACTION SYSTEM ==================
        if (lastMessage.type === 'reaction') {
            const { user_id, user_name, reaction, timestamp } = lastMessage.data;
            
            setReactions(prev => [...prev, {
                id: crypto.randomUUID(),
                user_id,
                user_name,
                reaction,
                timestamp
            }]);
        }

        if (lastMessage.type === 'reaction_rejected') {
            const { reason, retry_after } = lastMessage.data;
            
            const errorMessages = {
                rate_limit: `Too many reactions. Please wait ${retry_after || 10} seconds.`,
                disabled: 'Reactions have been disabled by the host.',
                no_permission: 'You do not have permission to send reactions.'
            };
            
            toast.error(errorMessages[reason as keyof typeof errorMessages] || 'Could not send reaction.');
        }

        if (lastMessage.type === 'reaction_policy_updated') {
            const policy = lastMessage.data;
            setReactionPolicy(policy);
            
            if (!policy.allow_reactions) {
                toast.info('Reactions have been disabled by the host.');
            } else {
                toast.success('Reactions have been enabled.');
            }
        }


    }, [lastMessage, mutateMeeting, router]);

    const [participantSearch, setParticipantSearch] = useState('');
    // ... (rest of search)

    // ... (rest of effects)

    const handleEndMeeting = () => {
        if (confirm("Are you sure you want to end the meeting for everyone?")) {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'end_meeting' }));
            }
        }
    };

    const handleForceMute = (participantId: string) => {
        // Legacy wrapper for new action
        handleParticipantAction('mute_participant', participantId, true);
    };

    const toggleAudioLock = () => {
         const currentLock = meetingData?.settings?.audio_locked || false;
         const newLock = !currentLock;
         
         if (socket && socket.readyState === WebSocket.OPEN) {
             socket.send(JSON.stringify({
                 type: 'audio_control',
                 action: 'set_global_lock',
                 locked: newLock
             }));
         }
    };

    const toggleVideoLock = () => {
         const currentLock = meetingData?.settings?.video_locked || false;
         const newLock = !currentLock;
         
         if (socket && socket.readyState === WebSocket.OPEN) {
             socket.send(JSON.stringify({
                 type: 'video_control',
                 action: 'set_global_lock',
                 locked: newLock
             }));
         }
    };

    const toggleScreenShareLock = () => {
         const currentLock = meetingData?.settings?.screen_share_locked || false;
         const newLock = !currentLock;
         
         if (socket && socket.readyState === WebSocket.OPEN) {
             socket.send(JSON.stringify({
                 type: 'screen_share',
                 action: 'set_global_lock',
                 locked: newLock
             }));
         }
    };

    // ================== ENTERPRISE REACTION SYSTEM ==================
    const sendReaction = (emoji: string) => {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            toast.error("Not connected to meeting");
            return;
        }

        if (!reactionPolicy.allow_reactions) {
            toast.error("Reactions have been disabled by the host");
            return;
        }

        socket.send(JSON.stringify({
            type: 'reaction_send',
            data: {
                reaction: emoji,
                meeting_id: meetingData?.id
            }
        }));
    };

    // Auto-cleanup expired reactions (older than 5 seconds)
    useEffect(() => {
        const cleanup = setInterval(() => {
            const now = Date.now();
            setReactions(prev => 
                prev.filter(r => now - r.timestamp * 1000 < 5000)
            );
        }, 1000);

        return () => clearInterval(cleanup);
    }, []);

    const handleParticipantAction = (action: string, targetId: string, value?: any) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            // Enterprise Audio Controls
            if (action === 'mute_participant') {
                socket.send(JSON.stringify({
                    type: 'audio_control',
                    action: 'set_mute_state',
                    target_user_id: targetId,
                    requested_state: true
                }));
                return;
            }
            if (action === 'ask_to_unmute') {
                socket.send(JSON.stringify({
                    type: 'audio_control',
                    action: 'set_mute_state',
                    target_user_id: targetId,
                    requested_state: false // Request to Unmute
                }));
                toast.success("Sent request to unmute.");
                return;
            }

            if (action === 'mute_all') {
                 socket.send(JSON.stringify({
                     type: 'audio_control',
                     action: 'mute_all'
                 }));
                 return;
            }

            // Enterprise Screen Share Controls
            if (action === 'stop_screen_share') {
                socket.send(JSON.stringify({
                    type: 'screen_share',
                    action: 'force_stop_share'
                }));
                return;
            }

            // Enterprise Video Controls
            if (action === 'stop_video') {
                socket.send(JSON.stringify({
                    type: 'video_control',
                    action: 'set_video_state',
                    target_user_id: targetId,
                    requested_state: false // Force OFF
                }));
                return;
            }
            if (action === 'stop_all_video') {
                socket.send(JSON.stringify({
                     type: 'video_control',
                     action: 'stop_all_video'
                }));
                return;
            }

            // Legacy
            socket.send(JSON.stringify({
                type: 'participant_action',
                action,
                targetId,
                value
            }));

            // Optimistic update for my own actions? 
            // Better to wait for server broadcast to ensure permission validation passed.
        }
    };


    // ... (rest of component)

    // Rule 1 & 14: Hardware Mic State vs Logical Mute Sync
    // This effect ensures hardware (micOn) follows the authoritative DB/UI state (participants)
    useEffect(() => {
        if (!effectiveUserId || isInLobby) return; // Don't sync if in Lobby!

        const myParticipant = participants.find(p => p.id === effectiveUserId);

        // If we found myself in the participant list (which comes from DB/WS),
        // Sync my hardware state to match.
        // myParticipant.isMuted (True) -> micOn (False)
        if (myParticipant) {
            const shouldBeOn = !myParticipant.isMuted;
            // Only sync if different
            if (micOn !== shouldBeOn) {
                console.log(`[Sync] Enforcing Hardware State (Audio): ${shouldBeOn ? 'ON' : 'OFF'} based on DB`);
                setMicOn(shouldBeOn);
            }
        }
    }, [participants, effectiveUserId, micOn, isInLobby]);

    const filteredParticipants = participants.filter(p =>
        p.name.toLowerCase().includes(participantSearch.toLowerCase()) ||
        p.role.toLowerCase().includes(participantSearch.toLowerCase())
    );

    const inMeeting = filteredParticipants.filter(p => p.status === 'In Meeting');
    const waitingParticipants = filteredParticipants.filter(p => p.status === 'waiting');
    const suggestions = filteredParticipants.filter(p => p.status !== 'In Meeting' && p.status !== 'waiting');

    // --- Chat Integration ---
    const { data: chatHistory, mutate: mutateChat } = useSWR(
        meetingData?.id ? `/meetings/${meetingData.id}/chat` : null, 
        fetcher, 
        { 
            revalidateOnFocus: false,
            revalidateOnReconnect: false 
        }
    );

    // Initial Message State from History
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    useEffect(() => {
        if (chatHistory && Array.isArray(chatHistory)) {
             // Directly set chat history (it is already ChatMessage[])
             setMessages(chatHistory);
        }
    }, [chatHistory]);

    const [inputMessage, setInputMessage] = useState('');
    const [unreadChatCount, setUnreadChatCount] = useState(0);

    // Reset unread count when chat opens
    useEffect(() => {
        if (activePanel === 'chat') {
            setUnreadChatCount(0);
        }
    }, [activePanel]);

    const lastProcessedMessageId = useRef<string | null>(null);

    // Listen for incoming Chat via Socket
    useEffect(() => {
        if (!lastMessage) return;

        if (lastMessage.type === 'chat_message' || (lastMessage.type === 'chat_message' && lastMessage.message)) {
            // Handle wrapper format
            const msgPayload = lastMessage.message || lastMessage;
            
            // Deduplicate processing
            const msgId = msgPayload.id || 'unknown';
            if (msgId === lastProcessedMessageId.current) return;
            lastProcessedMessageId.current = msgId;

            // Increment unread if chat is closed
            if (activePanel !== 'chat') {
                 setUnreadChatCount(prev => prev + 1);
            }

            // Use functional update to avoid stale closure
            setMessages(prev => {
                // Deduplicate just in case
                if (prev.some(m => m.id === msgId)) return prev;
                return [...prev, msgPayload];
            });
        }
        else if (lastMessage.type === 'chat_reaction_update') {
            const { messageId, reactions } = lastMessage;
            setMessages(prev => prev.map(m => 
                m.id === messageId ? { ...m, reactions } : m
            ));
        }
        else if (lastMessage.type === 'chat_message_deleted') {
            const { messageId } = lastMessage;
            setMessages(prev => prev.map(m => 
                m.id === messageId ? { ...m, is_deleted: true } : m
            ));
        }
        else if (lastMessage.type === 'chat_cleared') {
            setMessages([]);
        }
    }, [lastMessage, activePanel]);

    // Chat State for Rich Features
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Reaction State
    const [showReactionMenu, setShowReactionMenu] = useState(false);

    const [isHandRaised, setIsHandRaised] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);

    const [viewMode, setViewMode] = useState<'speaker' | 'gallery' | 'together'>('speaker');
    const [showViewMenu, setShowViewMenu] = useState(false);
    const [showMoreOptions, setShowMoreOptions] = useState(false);
    const [hideMe, setHideMe] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Advanced View Options
    const [galleryAtTop, setGalleryAtTop] = useState(false);
    // --- Rule 15: Initial Presence Sync (Fix for Blank Screen) ---
    // Ensure that when we join (especially if skipping lobby or late),
    // we explicitly tell the server our initial media state.
    const initialSyncRef = useRef(false);

    useEffect(() => {
        if (
            socket && 
            socket.readyState === WebSocket.OPEN && 
            effectiveUserId && 
            !isInLobby && 
            !initialSyncRef.current
        ) {
            console.log('[Presence] Sending initial presence sync', { videoOn, micOn });
            
            // Send immediate update to ensure other participants see us correctly
            socket.send(JSON.stringify({
                type: 'presence_update',
                updates: {
                    is_video_on: videoOn,
                    is_audio_on: micOn,
                    status: 'In Meeting'
                }
            }));
            
            initialSyncRef.current = true;
        }
    }, [socket, effectiveUserId, isInLobby, videoOn, micOn]);

    const [focusContent, setFocusContent] = useState(false);
    const [incomingVideo, setIncomingVideo] = useState(true);


    // Share State
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [activePresenterId, setActivePresenterId] = useState<string | null>(null);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    // isScreenSharing is authoritative local state for ME. activePresenterId is remote.
    // Derived isSharing for UI View:
    const isSharing = !!activePresenterId;

    // Video Streams State
    const [userStream, setUserStream] = useState<MediaStream | null>(null);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

    const screenRef = useRef<HTMLVideoElement>(null);
    const [sharingMode, setSharingMode] = useState<'screen' | 'whiteboard'>('screen');

    // WebRTC State for Remote Screen Sharing
    const peerManagerRef = useRef<PeerConnectionManager | null>(null);
    const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);
    const remoteScreenRef = useRef<HTMLVideoElement>(null);
    
    
    // Stream Update Propagation (Fixed Placement)
    // Ref to track the previous stream to correctly remove it when updating
    const prevUserStreamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (!peerManagerRef.current) return;
        
        const currentStream = userStream;
        const prevStream = prevUserStreamRef.current;

        if (currentStream === prevStream) return;

        console.log('[WebRTC] Local stream changed, updating peers');
        
        // Update all existing peers with the new stream
        peerManagerRef.current.getPeerIds().forEach(peerId => {
            console.log(`[WebRTC] Updating stream for peer ${peerId}`);
            if (currentStream) {
                peerManagerRef.current!.replaceStream(peerId, prevStream, currentStream);
            } else if (prevStream) {
                peerManagerRef.current!.removeStream(peerId, prevStream);
            }
        });
        
        // Update ref
        prevUserStreamRef.current = currentStream;
    }, [userStream]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
             if (peerManagerRef.current) {
                peerManagerRef.current.destroyAll();
                peerManagerRef.current = null;
            }
        };
    }, []);

    // Enterprise Features: Speaking Detection
    const speakingDetectorRef = useRef<SpeakingDetector | null>(null);

    // Enterprise Features: Recording & Quality
    const screenRecorderRef = useRef<ScreenRecorder | null>(null);
    const [isRecordingScreen, setIsRecordingScreen] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [qualityPreset, setQualityPreset] = useState<QualityPreset>(QualityPreset.AUTO);
    const [bandwidthQuality, setBandwidthQuality] = useState<'high' | 'medium' | 'low'>('high');

    // "More" Menu State
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [areCaptionsOn, setAreCaptionsOn] = useState(false);
    const [showLeaveMenu, setShowLeaveMenu] = useState(false);

    // Enterprise Features State
    const [showMeetingInfo, setShowMeetingInfo] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [inviteSearch, setInviteSearch] = useState('');
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showCreateMenu, setShowCreateMenu] = useState(false);

    // Global Meeting Settings (Host Controls)
    const [muteOnEntry, setMuteOnEntry] = useState(false);
    const [allowUnmute, setAllowUnmute] = useState(true);
    const [allowRename, setAllowRename] = useState(true);
    const [isMeetingLocked, setIsMeetingLocked] = useState(false);

    const toggleMeetingLock = () => {
        const newState = !isMeetingLocked;
        setIsMeetingLocked(newState);
        // Emulate broadcast
        if (socket && socket.readyState === WebSocket.OPEN) {
            // In a real implementation this would be a specialized event
        }
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            meeting_id: meetingData?.id || 'unknown',
            sender_id: 'system',
            sender_name: 'System',
            sender_role: 'system',
            timestamp: new Date().toISOString(),
            content: {
                type: 'text',
                body: newState ? 'Meeting has been locked 🔒' : 'Meeting has been unlocked 🔓'
            },
            scope: 'public',
            reactions: [],
            is_deleted: false,
            type: 'system'
        } as ChatMessage]);
    };

    const copyMeetingLink = () => {
        navigator.clipboard.writeText(`https://life-meeting.com/meeting/${params.id || 'new'}`);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    const toggleRaiseHand = () => {
        // Permission Check
        const me = participants.find(p => p.id === effectiveUserId);
        if (me && !me.permissions.canUseReactions && !isHandRaised) {
            alert("The host has disabled reactions.");
            return;
        }

        setIsHandRaised(prev => !prev);
        // Update my status in participants list
        setParticipants(prev => prev.map(p =>
            p.id === '1' ? { ...p, isHandRaised: !isHandRaised } : p
        ));

        // Broadcast hand raise if socket is open (Assuming backend supports generic updates or relies on user_update of isHandRaised?)
        // The original code was updating local state and sending system message locally?
        // Let's assume user_update handles it.
        if (socket && socket.readyState === WebSocket.OPEN && effectiveUserId) {
            socket.send(JSON.stringify({
                type: 'user_update',
                user_id: effectiveUserId,
                data: { isHandRaised: !isHandRaised }
            }));
        }

        // System message
        if (!isHandRaised) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                meeting_id: meetingData?.id || 'unknown',
                sender_id: 'system',
                sender_name: 'System',
                sender_role: 'system',
                timestamp: new Date().toISOString(),
                content: {
                    type: 'text',
                    body: 'You raised your hand ✋'
                },
                scope: 'public',
                reactions: [],
                is_deleted: false,
                type: 'system'
            } as ChatMessage]);
        }
    };

    const toggleScreenShare = async () => {
        // Case 1: Stop Sharing
        if (isScreenSharing) {
            stopScreenShare();
            return;
        }

        // Case 2: Start Sharing
        const me = participants.find(p => p.id === effectiveUserId);
        const isLocked = meetingData?.settings?.screen_share_locked;
        const isAdmin = me?.role === 'host' || me?.role === 'co-host';

        // Check Lock
        if (isLocked && !isAdmin) {
             toast.error("Screen sharing is locked by the host.");
             return;
        }

        // Check Active Presenter
        if (activePresenterId && activePresenterId !== effectiveUserId) {
             // If Admin, confirm takeover?
             if (!isAdmin) {
                 toast.error("Someone is already sharing.");
                 return;
             } else {
                 if (!confirm("Start sharing? This will stop the current presentation.")) return;
             }
        }

        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            setScreenStream(stream);
            setIsScreenSharing(true);
            setSharingMode('screen');
            setShowShareMenu(false);

            // Handle Native Stop
            stream.getVideoTracks()[0].onended = () => {
                stopScreenShare();
            };

            // Notify Backend
            if (socket && socket.readyState === WebSocket.OPEN && effectiveUserId) {
                socket.send(JSON.stringify({
                    type: 'screen_share',
                    action: 'start_share',
                    target_user_id: effectiveUserId
                }));
            }
            
            // Initialize peer manager if needed
            if (!peerManagerRef.current) {
                peerManagerRef.current = new PeerConnectionManager();
            }

            // Create peer connections to all other participants and share screen
            participants.forEach(participant => {
                if (participant.id !== effectiveUserId && participant.user_id) {
                    // Check if peer already exists (prevents duplicate creation)
                    const existingPeer = peerManagerRef.current!.getPeer(participant.user_id);
                    if (existingPeer) {
                        console.log(`[WebRTC] Peer already exists for ${participant.name}, adding stream`);
                        peerManagerRef.current!.addStream(participant.user_id, stream);
                        return;
                    }
                    
                    console.log(`[WebRTC] Creating peer connection to ${participant.name}`);
                    
                    peerManagerRef.current!.createPeer({
                        userId: participant.user_id,
                        initiator: true, // We are starting the share, so we initiate
                        stream,
                        onSignal: (signal) => {
                            // Send WebRTC signal to this participant
                            if (socket && socket.readyState === WebSocket.OPEN) {
                                socket.send(JSON.stringify({
                                    type: 'webrtc_signal',
                                    to_user_id: participant.user_id,
                                    from_user_id: effectiveUserId,
                                    signal
                                }));
                            }
                        },
                        onStream: () => {
                            // We don't expect to receive a stream since we're sharing
                        },
                        onError: (err) => {
                            console.error(`[WebRTC] Error with peer ${participant.name}:`, err);
                        },
                        onClose: () => {
                            console.log(`[WebRTC] Connection closed with ${participant.name}`);
                        }
                    });
                }
            });
            
            // User Guidance
            toast.success("Started screen share");
            
            // Check if potentially sharing the same tab (heuristic: if stream has very similar dimensions to window)
            const videoTrack = stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            if (settings.displaySurface === 'browser') {
                toast.info("💡 Tip: Share your screen or a different window to avoid the mirror effect", { duration: 5000 });
            }

        } catch (err) {
            console.error("Screen Share Error:", err);
        }
    };

    const stopScreenShare = () => {
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
            setScreenStream(null);
        }
        setIsScreenSharing(false);
        setSharingMode('screen');
        
        // Destroy all peer connections
        if (peerManagerRef.current) {
            peerManagerRef.current.destroyAll();
        }
        
        if (socket && socket.readyState === WebSocket.OPEN && effectiveUserId) {
             socket.send(JSON.stringify({
                 type: 'screen_share',
                 action: 'stop_share',
                 target_user_id: effectiveUserId
             }));
        }
    };

    // Toggle Screen Recording
    const toggleScreenRecording = async () => {
        if (!screenStream) {
            toast.error('Start screen share first before recording');
            return;
        }

        if (isRecordingScreen) {
            // Stop recording
            if (screenRecorderRef.current) {
                try {
                    const blob = await screenRecorderRef.current.stop();
                    setIsRecordingScreen(false);
                    setRecordingDuration(0);
                    
                    // Option 1: Download locally
                    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
                    screenRecorderRef.current.downloadRecording(blob, `screen-recording-${timestamp}.webm`);
                    
                    // Option 2: Upload to server (uncomment to enable)
                    // if (effectiveUserId) {
                    //     await screenRecorderRef.current.uploadRecording(blob, id as string, effectiveUserId);
                    //     toast.success('Recording uploaded successfully');
                    // }
                    
                    toast.success('Recording saved!');
                } catch (error) {
                    console.error('[Recording] Failed to stop:', error);
                    toast.error('Failed to save recording');
                }
            }
        } else {
            // Start recording
            if (!screenRecorderRef.current) {
                screenRecorderRef.current = new ScreenRecorder();
            }
            
            try {
                await screenRecorderRef.current.start(screenStream, {
                    videoBitsPerSecond: 2500000,
                    audioBitsPerSecond: 128000,
                });
                setIsRecordingScreen(true);
                toast.success('Recording started');
                
                // Update duration every second
                const interval = setInterval(() => {
                    if (screenRecorderRef.current) {
                        setRecordingDuration(screenRecorderRef.current.getDuration());
                    }
                }, 1000);
                
                // Cleanup interval when stopped
                return () => clearInterval(interval);
            } catch (error) {
                console.error('[Recording] Failed to start:', error);
                toast.error('Failed to start recording');
            }
        }
    };

    // Change quality preset
    const changeQualityPreset = async (preset: QualityPreset) => {
        setQualityPreset(preset);
        toast.success(`Quality set to ${preset}`);
        
        // Apply to current screen stream if sharing
        if (screenStream) {
            const { applyQualityConstraints } = await import('@/lib/webrtc-config');
            await applyQualityConstraints(screenStream, preset);
        }
    };


    const startWhiteboard = () => {
        if (effectiveUserId) setActivePresenterId(effectiveUserId);
        setSharingMode('whiteboard');
        setShowShareMenu(false);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            meeting_id: meetingData?.id || 'unknown',
            sender_id: 'system',
            sender_name: 'System',
            sender_role: 'system',
            timestamp: new Date().toISOString(),
            content: {
                type: 'text',
                body: 'You started a Whiteboard session 📝'
            },
            scope: 'public',
            reactions: [],
            is_deleted: false,
            type: 'system'
        } as ChatMessage]);
    };

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputMessage.trim()) return;

        // Permission Check
        const me = participants.find(p => p.id === effectiveUserId);
        if (me && !me.permissions.canChat) {
            alert("The host has disabled chat.");
            return;
        }

        if (socket && socket.readyState === WebSocket.OPEN) {
            const payload = {
                type: 'chat_message',
                content: inputMessage,
                sender_name: user?.full_name || "Guest"
            };
            socket.send(JSON.stringify(payload));
            setInputMessage('');
        } else {
            console.error("Socket not connected");
        }
    };

    // Handle File Uploads (Mock)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create a fake URL for preview
        const url = URL.createObjectURL(file);

        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            meeting_id: meetingData?.id || 'unknown',
            sender_id: effectiveUserId,
            sender_name: user?.full_name || 'You',
            sender_role: 'guest',
            timestamp: new Date().toISOString(),
            content: {
                type: type,
                body: type === 'image' ? 'Shared an image' : `Shared a file: ${file.name}`,
                fileUrl: url,
                fileName: file.name
            },
            scope: 'public',
            reactions: [],
            is_deleted: false,
            type: type
        };

        setMessages(prev => [...prev, newMessage]);

        // Reset input
        if (e.target) e.target.value = '';
    };

    const addEmoji = (emoji: string) => {
        setInputMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const triggerReaction = (emoji: string) => {
        // Permission Check
        const me = participants.find(p => p.id === effectiveUserId);
        if (me && !me.permissions.canUseReactions) {
            alert("The host has disabled reactions.");
            return;
        }

        const id = Date.now().toString();
        setReactions(prev => [...prev, { 
            id, 
            user_id: effectiveUserId || 'guest', 
            user_name: user?.full_name || 'You', 
            reaction: emoji, 
            timestamp: Date.now() 
        }]);
        
        setTimeout(() => {
            setReactions(prev => prev.filter(r => r.id !== id));
        }, 2000);

        // Broadcast reaction to others via socket
        if (socket && socket.readyState === WebSocket.OPEN && effectiveUserId) {
            socket.send(JSON.stringify({
                type: 'chat_reaction',
                user_id: effectiveUserId,
                reaction: emoji
            }));
        }
    };

    useEffect(() => {
        if (isInLobby && micOn) {
            let audioContext: AudioContext;
            let analyser: AnalyserNode;
            let dataArray: Uint8Array;
            let source: MediaStreamAudioSourceNode;
            let animationFrame: number;

            const setupAudio = async () => {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    analyser = audioContext.createAnalyser();
                    analyser.fftSize = 32; // Small size for simple volume check
                    source = audioContext.createMediaStreamSource(stream);
                    source.connect(analyser);
                    dataArray = new Uint8Array(analyser.frequencyBinCount);

                    const update = () => {
                        analyser.getByteFrequencyData(dataArray as any);
                        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
                        setAudioLevel(avg);
                        animationFrame = requestAnimationFrame(update);
                    };
                    update();
                } catch (e) {
                    console.error("Audio visualizer failed", e);
                }
            };
            setupAudio();

            return () => {
                if (animationFrame) cancelAnimationFrame(animationFrame);
                if (audioContext) audioContext.close();
            };
        } else {
            setAudioLevel(0);
        }
    }, [isInLobby, micOn]);

    // Device Enumeration
    useEffect(() => {
        if (!isInLobby) return;

        const getDevices = async () => {
            try {
                // Request permission first to get labels
                if (micOn) await navigator.mediaDevices.getUserMedia({ audio: true });

                const devices = await navigator.mediaDevices.enumerateDevices();
                setAudioInputs(devices.filter(d => d.kind === 'audioinput'));
                setAudioOutputs(devices.filter(d => d.kind === 'audiooutput'));
            } catch (e) {
                console.error("Error fetching devices", e);
            }
        };

        getDevices();
        navigator.mediaDevices.addEventListener('devicechange', getDevices);
        return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    }, [isInLobby, micOn]);


    // Camera Access (Lobby & Meeting)
    // Camera Management
    /* 
    // REDUNDANT: Handled by mediaStreamManager effect above (lines 385+)
    useEffect(() => {
        // Initialize User Stream
        const initCamera = async () => {
            if (videoOn && !userStream) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    setUserStream(stream);
                } catch (err) {
                    console.error("Camera access denied:", err);
                    setVideoOn(false);
                }
            } else if (!videoOn && userStream) {
                // Stop stream if video is turned off
                userStream.getTracks().forEach(t => t.stop());
                setUserStream(null);
            }
        };
        initCamera();

        // Cleanup function only runs on unmount or dependency change causing re-execution
        // We rely on the logic above to handle toggles
    }, [videoOn, userStream]); 
    */

    // Hardware Sync: Mic On/Off -> MediaStream
    useEffect(() => {
        if (userStream) {
            userStream.getAudioTracks().forEach(track => {
                track.enabled = micOn;
                console.log(`[Hardware] Set mic track enabled = ${micOn}`);
            });
        }
    }, [micOn, userStream]);

    // Hardware Sync: Video On/Off -> MediaStream
    useEffect(() => {
        if (userStream) {
            userStream.getVideoTracks().forEach(track => {
                // Enterprise Rule: Hardware cannot override DB state.
                // WE assume videoOn IS the authoritative state (synced via WebSocket)
                track.enabled = videoOn;
                console.log(`[Hardware] Set video track enabled = ${videoOn}`);
            });
        }
    }, [videoOn, userStream]);

    // Attach User Stream to Ref (Whenever layout changes)
    useEffect(() => {
        if (videoRef.current && userStream) {
            videoRef.current.srcObject = userStream;
        }
    }, [userStream, isSharing, activePanel, viewMode, isInLobby]);

    // Sync Local Stream to Presence Map (Crucial for VideoGrid)
    useEffect(() => {
        if (!effectiveUserId) return;

        setVideoStreams(prev => {
            const next = new Map(prev);
            if (userStream) {
                next.set(effectiveUserId, userStream);
            } else {
                next.delete(effectiveUserId);
            }
            return next;
        });
    }, [userStream, effectiveUserId]);

    // Update Stream in All Active Peer Connections (Crucial for Remote Participants)
    useEffect(() => {
        if (!peerManagerRef.current) return;
        
        const peerIds = peerManagerRef.current.getPeerIds();
        if (peerIds.length === 0) return;
        
        console.log('[WebRTC] Local stream changed, updating all peer connections');
        
        peerIds.forEach(peerId => {
            const peer = peerManagerRef.current!.getPeer(peerId);
            if (peer) {
                // Remove old tracks and add new ones
                if (userStream) {
                    try {
                        const pc = (peer as any)._pc as RTCPeerConnection;
                        if (pc) {
                            const senders = pc.getSenders();
                            const videoTrack = userStream.getVideoTracks()[0];
                            const audioTrack = userStream.getAudioTracks()[0];
                            
                            // Check for Video Sender
                            const videoSender = senders.find(s => s.track?.kind === 'video');
                            
                            if (videoSender && videoTrack) {
                                // CASE A: Replace Track (Seamless Switch)
                                console.log('[WebRTC] Replacing video track for peer', peerId);
                                videoSender.replaceTrack(videoTrack).catch(e => console.error("Replace video track failed:", e));
                            } else if (!videoSender && videoTrack) {
                                // CASE B: Add Stream (New Video) - Use Manager/SimplePeer API to ensure signaling
                                console.log('[WebRTC] Adding new stream (video) for peer', peerId);
                                peerManagerRef.current?.addStream(peerId, userStream);
                                // Note: addStream adds all tracks from stream.
                                // If we assume stream has both audio/video, this covers audio too.
                                return; // Done for this peer
                            }
                            
                            // Check for Audio Sender (only if we didn't do addStream above)
                            const audioSender = senders.find(s => s.track?.kind === 'audio');
                            if (audioSender && audioTrack) {
                                console.log('[WebRTC] Replacing audio track for peer', peerId);
                                audioSender.replaceTrack(audioTrack).catch(e => console.error("Replace audio track failed:", e));
                            } else if (!audioSender && audioTrack) {
                                // If we have audio but no video sender (and no video track to trigger addStream above)
                                // We should probably addStream here too.
                                console.log('[WebRTC] Adding new stream (audio) for peer', peerId);
                                peerManagerRef.current?.addStream(peerId, userStream);
                            }
                        } else {
                           // Fallback if PC not accessible (shouldn't happen with simple-peer)
                           peerManagerRef.current?.addStream(peerId, userStream);
                        }
                    } catch (err) {
                        console.error('[WebRTC] Error replacing tracks:', err);
                    }
                } else {
                    // Stream removed (or raw getUserMedia stopped it)
                    // We might want to removeStream? 
                    // But usually we just stop tracks. simple-peer doesn't automatically remove stream on track stop.
                }
            }
        });
    }, [userStream]);

    // Enterprise: Speaking Detection
    useEffect(() => {
        if (userStream && effectiveUserId && !isInLobby && micOn) {
            // Initialize speaking detector if not already created
            if (!speakingDetectorRef.current) {
                speakingDetectorRef.current = new SpeakingDetector();
            }

            // Start detecting speaking
            if (userStream.getAudioTracks().length > 0) {
                speakingDetectorRef.current.start(userStream, (isSpeaking) => {
                console.log('[SpeakingDetector] Speaking state changed:', isSpeaking);
                
                // Broadcast speaking state via WebSocket
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({
                        type: 'participant_speaking',
                        is_speaking: isSpeaking
                    }));
                }

                // Update local presence state
                setPresenceParticipants(prev => prev.map(p =>
                    p.user_id === effectiveUserId
                        ? { ...p, is_speaking: isSpeaking }
                        : p
                ));
            });
            } // Close if block

            console.log('[SpeakingDetector] Started for local user');
        } else {
            // Stop detecting if no stream or mic is off
            if (speakingDetectorRef.current) {
                speakingDetectorRef.current.stop();
                console.log('[SpeakingDetector] Stopped');
            }
        }

        // Cleanup on unmount
        return () => {
            if (speakingDetectorRef.current) {
                speakingDetectorRef.current.stop();
            }
        };
    }, [userStream, effectiveUserId, isInLobby, micOn, socket]);

    // Attach Screen Stream to Ref
    useEffect(() => {
        if (screenRef.current && screenStream) {
            screenRef.current.srcObject = screenStream;
        }
    }, [screenStream, isSharing]);

    // Attach Remote Screen Stream to Ref
    useEffect(() => {
        if (remoteScreenRef.current && remoteScreenStream) {
            console.log('[Video] Attaching remote screen stream to video element', remoteScreenStream);
            remoteScreenRef.current.srcObject = remoteScreenStream;
            remoteScreenRef.current.play().catch(err => {
                console.error('[Video] Failed to play remote screen:', err);
            });
        } else {
            console.log('[Video] Remote screen ref or stream missing:', {
                hasRef: !!remoteScreenRef.current,
                hasStream: !!remoteScreenStream
            });
        }
    }, [remoteScreenStream]);

    const handleJoin = () => {
        setIsInLobby(false);
        
        // Optimistic Update: Ensure local participant state matches Lobby selection
        // This prevents the "Hardware Sync" hooks from reverting our state to the (stale) DB default
        if (effectiveUserId) {
            setParticipants(prev => {
                return prev.map(p => 
                    p.id === effectiveUserId 
                    ? { ...p, isMuted: !micOn, isVideoOn: videoOn, status: 'In Meeting' }
                    : p
                );
            });
            
            // Also update Enterprise Presence
            setPresenceParticipants(prev => {
                 const exists = prev.some(p => p.user_id === effectiveUserId);
                 if (exists) {
                     return prev.map(p => 
                        p.user_id === effectiveUserId
                        ? { ...p, is_audio_on: micOn, is_video_on: videoOn, presence: 'connected' }
                        : p
                     );
                 } else {
                     // Optimistically add self if missing
                     // This ensures we are visible in the grid immediately
                     return [...prev, {
                         user_id: effectiveUserId,
                         // Use user details if available, else placeholders
                         name: user?.name || (participants.find(p => p.id === effectiveUserId)?.name) || 'Me',
                         role: (participants.find(p => p.id === effectiveUserId)?.role as any) || 'participant',
                         presence: 'connected',
                         is_audio_on: micOn,
                         is_video_on: videoOn,
                         is_speaking: false,
                         is_hand_raised: false,
                         avatar_color: 'bg-indigo-500', // Default, will be updated by server
                         joined_at: new Date().toISOString()
                     } as ParticipantPresence];
                 }
            });
        }
        
        // Sync initial presence state with backend
        if (socket && socket.readyState === WebSocket.OPEN && effectiveUserId) {
            socket.send(JSON.stringify({
                type: 'presence_update',
                updates: {
                    is_video_on: videoOn,
                    is_audio_on: micOn
                }
            }));
        }
    };

    const handleLeave = () => {
        router.push("/dashboard");
    };

    if (meetingLoading || userLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Joining meeting...</p>
                </div>
            </div>
        );
    }

    if (!meetingData && !isInLobby && meetingId !== 'new') {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Meeting not found</h2>
                    <p className="text-slate-500 mb-4">The meeting code "{meetingId}" seems to be invalid or expired.</p>
                    <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
                </div>
            </div>
        );
    }

    if (isInLobby) {
        return (
            <div className="h-screen bg-slate-50 flex flex-col items-center p-6 relative overflow-hidden font-sans">
                {/* Top Header (Centered) */}
                <div className="z-10 w-full max-w-2xl text-center mb-6 pt-8 flex flex-col items-center">
                    <div className="mb-2 transform scale-125">
                        <Logo showText={false} />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-500 mb-6 tracking-wide uppercase">Life Meeting</h3>

                    <div className="w-full max-w-md relative">
                        <label className="absolute -top-3 left-0 text-xs font-semibold text-slate-400 uppercase tracking-wider">Meeting topic</label>
                        <input
                            type="text"
                            defaultValue={params.id === 'new' ? "Project Sync" : "Project Sync"}
                            className="text-2xl font-bold text-slate-800 text-center bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-indigo-600 focus:outline-none transition-all w-full pb-1 placeholder:text-slate-300"
                            placeholder="Type a meeting topic..."
                        />
                    </div>
                </div>

                {/* Lobby Main Content */}
                <div className="z-10 bg-white rounded-lg shadow-xl w-full max-w-5xl flex flex-col md:flex-row h-auto md:h-[550px] border border-slate-200 overflow-hidden">

                    {/* Left: Video Preview */}
                    <div className="flex-[1.6] bg-slate-900 relative flex flex-col items-center justify-center overflow-hidden">
                        {/* Video Element */}
                        <div className="w-full h-full relative group">
                            {videoOn ? (
                                <div className={`w-full h-full relative transition-all duration-300 ${filterMode === 'blur' ? 'blur-none' : ''}`}>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        muted
                                        playsInline
                                        className={`w-full h-full object-cover transform scale-x-[-1] transition-all duration-500 ${filterMode === 'blur' ? 'blur-md scale-110' : ''}`}
                                    />
                                    {filterMode === 'image' && (
                                        <div className="absolute inset-0 z-[-1] bg-cover bg-center transition-all duration-300" style={{ backgroundImage: `url(${backgroundImage})` }} />
                                    )}
                                </div>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-white">
                                    <div className="relative mb-3 opacity-60">
                                        <Camera className="w-10 h-10 text-slate-400" />
                                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                                            <div className="w-3 h-3 bg-slate-400 rounded-full border-2 border-white"></div>
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-slate-600">Your camera is turned off</p>
                                </div>
                            )}

                            {/* Bottom Controls Bar (Inside Video) */}
                            <div className="absolute bottom-0 left-0 right-0 h-14 bg-white border-t border-slate-200 flex items-center justify-between px-6 z-20">
                                <div className="flex items-center gap-4">
                                    {/* Camera Power Toggle */}
                                    <button
                                        onClick={() => setVideoOn(!videoOn)}
                                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${videoOn ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                        title={videoOn ? "Turn camera off" : "Turn camera on"}
                                    >
                                        {videoOn ? <Video className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                                    </button>

                                    <div className="h-6 w-px bg-slate-200" />

                                    {/* Background Blur Toggle */}
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowBackgroundPanel(true)}>
                                        <Switch
                                            checked={filterMode !== 'none'}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setFilterMode('blur');
                                                    setShowBackgroundPanel(true);
                                                } else {
                                                    setFilterMode('none');
                                                }
                                            }}
                                            className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-slate-300"
                                        />
                                        <span className="text-sm font-medium text-slate-600 ml-1 hover:text-indigo-600 transition-colors">Background</span>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Audio Settings */}
                    <div className="flex-1 bg-white p-6 md:p-8 flex flex-col border-l border-slate-200 text-left relative transition-all overflow-hidden">
                        <div className="flex flex-col h-full animate-in slide-in-from-left fade-in duration-300">
                            <div className="space-y-6 flex-1 overflow-y-auto pr-2">

                                {/* Computer Audio Option */}
                                <div
                                    className={`cursor-pointer transition-all ${audioMode === 'computer' ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                                    onClick={() => setAudioMode('computer')}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${audioMode === 'computer' ? 'border-indigo-600' : 'border-slate-300'}`}>
                                            {audioMode === 'computer' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>}
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-sm font-bold text-slate-900 block mb-2">Computer audio</span>

                                            {/* Device Settings - Only visible when active */}
                                            {audioMode === 'computer' && (
                                                <div className="space-y-5 pl-1 animate-in slide-in-from-top-2 fade-in duration-200">
                                                    {/* Mic Settings */}
                                                    <div className="flex items-center gap-3">
                                                        <Mic className="w-4 h-4 text-slate-500 shrink-0" />
                                                        <div className="flex-1 relative">
                                                            <select className="w-full text-sm text-slate-700 font-medium bg-transparent border-none p-0 focus:ring-0 cursor-pointer hover:text-indigo-600 truncate pr-6 appearance-none">
                                                                {audioInputs.length > 0 ? (
                                                                    audioInputs.map((device, i) => (
                                                                        <option key={i} value={device.deviceId}>{device.label || `Microphone ${i + 1}`}</option>
                                                                    ))
                                                                ) : (
                                                                    <option>Default Microphone</option>
                                                                )}
                                                            </select>
                                                        </div>

                                                        {/* Visualizer Mini */}
                                                        {micOn && (
                                                            <div className="flex gap-0.5 items-end h-3 mx-2">
                                                                {[1, 2, 3].map(i => (
                                                                    <div key={i} className="w-0.5 bg-indigo-500 rounded-full" style={{ height: `${Math.max(20, Math.min(100, audioLevel * 2))}%`, opacity: 0.7 + (i % 2) * 0.2 }}></div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <Switch
                                                            checked={micOn}
                                                            onCheckedChange={setMicOn}
                                                            className="scale-90 data-[state=checked]:bg-indigo-600 shrink-0"
                                                        />
                                                    </div>

                                                    {/* Speaker Settings */}
                                                    <div className="flex items-center gap-3">
                                                        <Volume2 className="w-4 h-4 text-slate-500 shrink-0" />
                                                        <div className="flex-1">
                                                            <select className="w-full text-sm text-slate-700 font-medium bg-transparent border-none p-0 focus:ring-0 cursor-pointer hover:text-indigo-600 truncate pr-6 appearance-none">
                                                                {audioOutputs.length > 0 ? (
                                                                    audioOutputs.map((device, i) => (
                                                                        <option key={i} value={device.deviceId}>{device.label || `Speaker ${i + 1}`}</option>
                                                                    ))
                                                                ) : (
                                                                    <option>Default Speaker</option>
                                                                )}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Phone Audio */}
                                <div
                                    className={`flex items-center gap-3 cursor-pointer transition-all ${audioMode === 'phone' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                                    onClick={() => setAudioMode('phone')}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${audioMode === 'phone' ? 'border-indigo-600' : 'border-slate-300'}`}>
                                        {audioMode === 'phone' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">Phone audio</span>
                                </div>

                                {/* Room Audio */}
                                <div
                                    className={`flex items-center gap-3 cursor-pointer transition-all ${audioMode === 'room' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                                    onClick={() => setAudioMode('room')}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${audioMode === 'room' ? 'border-indigo-600' : 'border-slate-300'}`}>
                                        {audioMode === 'room' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">Room audio</span>
                                </div>

                                {/* Don't use audio */}
                                <div
                                    className={`flex items-center gap-3 cursor-pointer transition-all ${audioMode === 'none' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                                    onClick={() => setAudioMode('none')}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${audioMode === 'none' ? 'border-indigo-600' : 'border-slate-300'}`}>
                                        {audioMode === 'none' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">Don't use audio</span>
                                </div>
                            </div>



                            {/* Footer Buttons */}
                            <div className="mt-auto flex justify-end gap-3 pt-6 border-t border-slate-100">
                                <Button variant="ghost" className="mr-auto text-slate-600 hover:bg-slate-50 gap-2" onClick={() => setShowScheduleModal(true)}>
                                    <Calendar className="w-4 h-4" />
                                    Schedule for later
                                </Button>
                                <Button variant="outline" className="h-10 px-6 text-slate-600 border-slate-300 bg-white hover:bg-slate-50 font-medium rounded-md" onClick={handleLeave}>
                                    Cancel
                                </Button>
                                <Button className="h-10 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm transition-all rounded-md" onClick={handleJoin}>
                                    Join now
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>


                <ScheduleMeetingModal open={showScheduleModal} onOpenChange={setShowScheduleModal} />

                <div className="mt-8 text-xs text-slate-400">
                    © 2026 Life Meeting Technologies. All rights reserved.
                </div>

                {/* Sidebar Drawer for Background Settings */}
                {
                    showBackgroundPanel && (
                        <div className="absolute right-0 top-0 bottom-0 w-[360px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
                            {/* Header */}
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-900">Background settings</h2>
                                <button onClick={() => setShowBackgroundPanel(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                            </div>

                            {/* Options */}
                            <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
                                <div className="grid grid-cols-2 gap-3">
                                    {/* None Option */}
                                    <button
                                        onClick={() => { setFilterMode('none'); }}
                                        className={`group relative aspect-video rounded-lg border-2 overflow-hidden hover:border-indigo-600 transition-all ${filterMode === 'none' ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200'}`}
                                    >
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 text-slate-500">
                                            <div className="w-8 h-8 rounded-full border-2 border-slate-400 flex items-center justify-center mb-2">
                                                <div className="w-0.5 h-full bg-slate-400 rotate-45 transform origin-center absolute"></div>
                                            </div>
                                            <span className="text-xs font-semibold">None</span>
                                        </div>
                                    </button>

                                    {/* Blur Option */}
                                    <button
                                        onClick={() => { setFilterMode('blur'); }}
                                        className={`group relative aspect-video rounded-lg border-2 overflow-hidden hover:border-indigo-600 transition-all ${filterMode === 'blur' ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200'}`}
                                    >
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100">
                                            <div className="w-full h-full absolute inset-0 bg-[url('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200')] bg-cover bg-center blur-sm opacity-50" />
                                            <div className="relative z-10 flex flex-col items-center">
                                                <Filter className="w-6 h-6 text-slate-700 mb-1" />
                                                <span className="text-xs font-semibold text-slate-700">Blur</span>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Image Options */}
                                    {BACKGROUND_OPTIONS.map((bg, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { setFilterMode('image'); setBackgroundImage(bg.url); }}
                                            className={`group relative aspect-video rounded-lg border-2 overflow-hidden hover:border-indigo-600 transition-all ${filterMode === 'image' && backgroundImage === bg.url ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200'}`}
                                        >
                                            <img src={bg.url} alt={bg.name} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                                            {filterMode === 'image' && backgroundImage === bg.url && (
                                                <div className="absolute inset-0 bg-indigo-900/10 flex items-center justify-center">
                                                    <div className="bg-white rounded-full p-1 shadow-sm">
                                                        <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    ))}

                                    {/* Add New Placeholder */}
                                    <button className="group relative aspect-video rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center text-slate-500 hover:text-indigo-600">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-white flex items-center justify-center mb-2 transition-colors">
                                            <span className="text-xl font-light">+</span>
                                        </div>
                                        <span className="text-xs font-medium">Add new</span>
                                    </button>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-5 border-t border-slate-100 bg-slate-50">
                                <Button className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold" onClick={() => setShowBackgroundPanel(false)}>
                                    Apply and join
                                </Button>
                            </div>
                        </div>
                    )
                }
            </div >
        );
    }



    // ACTUAL MEETING ROOM
    return (
        <div className="h-screen bg-[#F5F5F5] flex flex-col relative overflow-hidden font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
            {/* Top Navigation Bar - Minimal Light Mode */}
            <header className="bg-white border-b border-slate-200 h-[64px] flex items-center justify-between px-4 shadow-sm z-50">
                {/* Left: Branding & Info */}
                <div className="flex items-center gap-4 min-w-[200px]">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm relative group cursor-pointer" onClick={() => setShowMeetingInfo(!showMeetingInfo)}>
                        <Shield className="w-5 h-5 stroke-[1.5]" />

                        {/* Meeting Info Popover */}
                        {showMeetingInfo && (
                            <div className="absolute top-full mt-2 left-0 bg-white border border-slate-200 shadow-xl rounded-xl w-80 z-50 p-4 animate-in fade-in zoom-in-95 duration-200 cursor-default" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-slate-900">Meeting details</h3>
                                    <button onClick={() => setShowMeetingInfo(false)} className="ml-auto p-1 hover:bg-slate-100 rounded-full"><X className="w-4 h-4 text-slate-500" /></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Joining Info</label>
                                        <div className="text-sm text-slate-700 break-all mb-2">https://life-meeting.com/meeting/{params.id || 'new'}</div>
                                        <button onClick={copyMeetingLink} className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-md transition-colors w-full justify-center border border-indigo-100">
                                            {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                            {copySuccess ? 'Copied!' : 'Copy joining info'}
                                        </button>
                                    </div>
                                    <div className="pt-3 border-t border-slate-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm text-slate-600">Meeting ID</span>
                                            <span className="font-mono text-sm font-medium bg-slate-100 px-2 py-0.5 rounded">{params.id || 'new-meeting'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Time Elapsed</span>
                        <span className="text-sm font-bold text-slate-700 tabular-nums font-mono">{formatTime(elapsedSeconds)}</span>
                    </div>
                </div>

                {/* Center: Main Controls */}
                <div className="flex items-center gap-2">
                    {/* Mic */}
                    <button
                        onClick={toggleMic}
                        className={`p-2.5 rounded-md transition-all ${!micOn ? 'bg-red-50 text-red-600 border border-red-100' : 'hover:bg-slate-100 text-slate-700'}`}
                        title={micOn ? "Mute Microphone" : "Unmute Microphone"}
                    >
                        {micOn ? <div className="flex flex-col items-center gap-0.5"><Mic className="w-5 h-5 stroke-[1.5]" /><span className="text-[10px] font-medium hidden md:block">Mic</span></div> : <div className="flex flex-col items-center gap-0.5"><MicOff className="w-5 h-5 stroke-[1.5]" /><span className="text-[10px] font-medium hidden md:block">Unmute</span></div>}
                    </button>

                    {/* Camera */}
                    <button
                        onClick={toggleVideo}
                        className={`p-2.5 rounded-md transition-all ${!videoOn ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'hover:bg-slate-100 text-slate-700'}`}
                        title={videoOn ? "Turn Off Camera" : "Turn On Camera"}
                    >
                        {videoOn ? <div className="flex flex-col items-center gap-0.5"><Camera className="w-5 h-5 stroke-[1.5]" /><span className="text-[10px] font-medium hidden md:block">Cam</span></div> : <div className="flex flex-col items-center gap-0.5"><VideoOff className="w-5 h-5 stroke-[1.5]" /><span className="text-[10px] font-medium hidden md:block">Cam Off</span></div>}
                    </button>

                    <div className="w-px h-8 bg-slate-200 mx-1 hidden md:block"></div>

                    {/* Share Button (Enterprise) */}
                    <button
                        onClick={toggleScreenShare}
                        className={`p-2.5 rounded-md transition-all ${isScreenSharing ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'hover:bg-slate-100 text-slate-700'} ${meetingData?.settings?.screen_share_locked && !['host', 'co-host'].includes(participants.find(p => p.id === effectiveUserId)?.role || '') ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={meetingData?.settings?.screen_share_locked ? "Screen Share Locked" : (isScreenSharing ? "Stop Sharing" : "Share Screen")}
                        disabled={meetingData?.settings?.screen_share_locked && !['host', 'co-host'].includes(participants.find(p => p.id === effectiveUserId)?.role || '')}
                    >
                        <div className="flex flex-col items-center gap-0.5">
                            {isScreenSharing ? <X className="w-5 h-5 stroke-[1.5]" /> : <MonitorUp className="w-5 h-5 stroke-[1.5]" />}
                            <span className="text-[10px] font-medium hidden md:block">{isScreenSharing ? 'Stop' : 'Share'}</span>
                        </div>
                    </button>
                    {/* Share Menu removed for simplicity - defaulting to Screen Share */}

                    {/* React */}
                    <div className="relative group">
                        {showReactionMenu && (
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white border border-slate-200 p-2 rounded-full flex gap-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                                {['❤️', '👍', '👏', '🔥', '😂', '😮', '🎉'].map(emoji => (
                                    <button
                                        key={emoji}
                                        onClick={() => { triggerReaction(emoji); setShowReactionMenu(false); }}
                                        className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-slate-100 rounded-full transition-transform hover:scale-125 active:scale-95"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                        <button
                            onClick={() => setShowReactionMenu(!showReactionMenu)}
                            className={`p-2.5 rounded-md transition-all ${showReactionMenu ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-100 text-slate-700'}`}
                            title="Reactions"
                        >
                            <div className="flex flex-col items-center gap-0.5">
                                <Smile className="w-5 h-5 stroke-[1.5]" />
                                <span className="text-[10px] font-medium hidden md:block">React</span>
                            </div>
                        </button>
                    </div>

                    {/* Raise Hand */}
                    <button
                        onClick={toggleRaiseHand}
                        className={`p-2.5 rounded-md transition-all ${isHandRaised ? 'bg-yellow-50 text-yellow-600 border border-yellow-200' : 'hover:bg-slate-100 text-slate-700'}`}
                        title={isHandRaised ? "Lower Hand" : "Raise Hand"}
                    >
                        <div className="flex flex-col items-center gap-0.5">
                            <Hand className={`w-5 h-5 stroke-[1.5] ${isHandRaised ? 'fill-current' : ''}`} />
                            <span className="text-[10px] font-medium hidden md:block">{isHandRaised ? 'Lower' : 'Raise'}</span>
                        </div>
                    </button>

                    {/* View Menu */}
                    <div className="relative group">
                        {showViewMenu && (
                            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-xl rounded-xl w-64 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-1">
                                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Layouts</div>
                                    <button onClick={() => { setViewMode('gallery'); setShowViewMenu(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${viewMode === 'gallery' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                                        <Grid className="w-4 h-4" /> Gallery
                                        {viewMode === 'gallery' && <span className="ml-auto text-indigo-600">✓</span>}
                                    </button>
                                    <button onClick={() => { setViewMode('speaker'); setShowViewMenu(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${viewMode === 'speaker' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                                        <User className="w-4 h-4" /> Speaker
                                        {viewMode === 'speaker' && <span className="ml-auto text-indigo-600">✓</span>}
                                    </button>
                                    <button onClick={() => { setViewMode('together'); setShowViewMenu(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${viewMode === 'together' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                                        <Users2 className="w-4 h-4" /> Together Mode
                                        {viewMode === 'together' && <span className="ml-auto text-indigo-600">✓</span>}
                                    </button>
                                </div>
                                <div className="h-px bg-slate-100 my-1" />
                                <div className="p-1">
                                    <button onClick={toggleFullscreen} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                        <Maximize className="w-4 h-4" /> {isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}
                                    </button>
                                    <button onClick={() => setHideMe(!hideMe)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                        <EyeOff className="w-4 h-4" /> {hideMe ? 'Show me' : 'Hide me'}
                                    </button>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setShowViewMenu(!showViewMenu)}
                            className={`p-2.5 rounded-md transition-all ${showViewMenu ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'hover:bg-slate-100 text-slate-700'}`}
                            title="View Options"
                        >
                            <div className="flex flex-col items-center gap-0.5">
                                <LayoutDashboard className="w-5 h-5 stroke-[1.5]" />
                                <span className="text-[10px] font-medium hidden md:block">View</span>
                            </div>
                        </button>
                    </div>

                    {/* More Menu */}
                    <div className="relative group">
                        {showMoreMenu && (
                            <div className="absolute top-full mt-2 right-0 bg-white border border-slate-200 shadow-xl rounded-xl w-72 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-1">
                                    <button onClick={() => { setIsRecording(!isRecording); setShowMoreMenu(false); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors ${isRecording ? 'bg-red-50 text-red-600' : 'text-slate-700 hover:bg-slate-50'}`}>
                                        <Disc className={`w-5 h-5 ${isRecording ? 'fill-current animate-pulse' : ''}`} />
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium">{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
                                            <span className="text-xs opacity-70">Record meeting content</span>
                                        </div>
                                    </button>
                                    <button onClick={() => { setAreCaptionsOn(!areCaptionsOn); setShowMoreMenu(false); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors ${areCaptionsOn ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'}`}>
                                        <Captions className="w-5 h-5" />
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium">Turn {areCaptionsOn ? 'off' : 'on'} live captions</span>
                                            <span className="text-xs opacity-70">English (US)</span>
                                        </div>
                                    </button>
                                    
                                    {/* DEBUG: Mock Data Generator */}
                                    <button 
                                        onClick={() => {
                                            const mocks = Array.from({ length: 25 }).map((_, i) => ({
                                                id: `mock-${Date.now()}-${i}`,
                                                name: `Mock User ${i + 1}`,
                                                role: 'guest',
                                                status: 'In Meeting',
                                                isMuted: true,
                                                isVideoOn: Math.random() > 0.5, // Random video state
                                                avatarColor: ['bg-red-100 text-red-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700'][Math.floor(Math.random() * 3)],
                                                joined_at: new Date().toISOString(),
                                                permissions: {
                                                    canUnmute: true, canShareVideo: true, canShareScreen: true, canChat: true, canUseReactions: true
                                                }
                                            }));
                                            setParticipants(prev => [...prev, ...mocks] as any);
                                            setShowMoreMenu(false);
                                            toast.success("Added 25 mock participants");
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
                                    >
                                        <Users2 className="w-5 h-5 text-indigo-600" />
                                        <div className="flex flex-col items-start">
                                            <span className="font-medium text-indigo-700">Simulate 25 Participants</span>
                                            <span className="text-xs opacity-70">Debug Tool</span>
                                        </div>
                                    </button>
                                </div>
                                <div className="h-px bg-slate-100 my-1" />
                                <div className="p-1">
                                    <button onClick={() => { setShowBackgroundPanel(true); setShowMoreMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                        <Filter className="w-5 h-5" /> Background effects
                                    </button>
                                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                                        <Settings className="w-5 h-5" /> Device settings
                                    </button>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setShowMoreMenu(!showMoreMenu)}
                            className={`p-2.5 rounded-md transition-all ${showMoreMenu ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-100 text-slate-700'}`}
                            title="More Options"
                        >
                            <div className="flex flex-col items-center gap-0.5">
                                <MoreHorizontal className="w-5 h-5 stroke-[1.5]" />
                                <span className="text-[10px] font-medium hidden md:block">More</span>
                            </div>
                        </button>
                    </div>
                </div>


                {/* Right: Actions */}
                <div className="flex items-center gap-2 min-w-[200px] justify-end">
                    {/* Panel Toggles */}
                    <div className="bg-slate-100 p-1 rounded-lg flex gap-1 mr-2">
                        <button
                            onClick={() => setActivePanel(activePanel === 'chat' ? 'none' : 'chat')}
                            className={`p-2 rounded-md transition-all relative ${activePanel === 'chat' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            title="Chat"
                        >
                            <MessageSquare className="w-4 h-4" />
                            {unreadChatCount > 0 && (
                                <span className="absolute -top-1 -right-0.5 min-w-[12px] h-3 bg-red-600 rounded-full text-[8px] font-bold text-white flex items-center justify-center border border-white shadow-sm pointer-events-none px-0.5">
                                    {unreadChatCount > 9 ? '9+' : unreadChatCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActivePanel(activePanel === 'people' ? 'none' : 'people')}
                            className={`p-2 rounded-md transition-all ${activePanel === 'people' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            title="People"
                        >
                            <Users className="w-4 h-4" />
                        </button>
                        
                        {/* Reaction Picker */}
                        <div className="relative">
                            <ReactionPicker
                                onSelect={sendReaction}
                                disabled={!reactionPolicy.allow_reactions}
                            />
                        </div>
                    </div>

                    <div className="relative group flex items-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-red-500/20 flex items-center gap-2">
                                    <PhoneOff className="w-4 h-4" />
                                    <span className="text-sm font-semibold">{meetingData?.host_id === user?.id ? 'End' : 'Leave'}</span>
                                    <ChevronDown className="w-4 h-4 opacity-80" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-1">
                                {meetingData?.host_id === user?.id ? (
                                    <>
                                        {/* Screen Recording Controls */}
                                        {isScreenSharing && (
                                            <>
                                                <DropdownMenuItem 
                                                    className="cursor-pointer gap-2 py-2.5" 
                                                    onClick={toggleScreenRecording}
                                                >
                                                    {isRecordingScreen ? (
                                                        <>
                                                            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                                                            Stop Recording ({Math.floor(recordingDuration / 1000)}s)
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-4 h-4 rounded-full border-2 border-slate-400" />
                                                            Record Screen Share
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                            </>
                                        )}
                                        
                                        {/* Quality Presets */}
                                        {isScreenSharing && (
                                            <>
                                                <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">Quality</div>
                                                <DropdownMenuItem onClick={() => changeQualityPreset(QualityPreset.HIGH)}>
                                                    {qualityPreset === QualityPreset.HIGH && '✓ '}High (1080p @ 30fps)
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => changeQualityPreset(QualityPreset.MEDIUM)}>
                                                    {qualityPreset === QualityPreset.MEDIUM && '✓ '}Medium (1080p @ 24fps)
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => changeQualityPreset(QualityPreset.LOW)}>
                                                    {qualityPreset === QualityPreset.LOW && '✓ '}Low (720p @ 15fps)
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => changeQualityPreset(QualityPreset.AUTO)}>
                                                    {qualityPreset === QualityPreset.AUTO && '✓ '}Auto (Adaptive)
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                            </>
                                        )}
                                        
                                        <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer gap-2 py-2.5 font-medium" onClick={handleEndMeeting}>
                                            <LogOut className="w-4 h-4" /> End meeting for all
                                        </DropdownMenuItem>
                                        <div className="h-px bg-slate-100 my-1" />
                                        <DropdownMenuItem className="text-slate-700 cursor-pointer gap-2 py-2.5" onClick={handleLeave}>
                                            <DoorOpen className="w-4 h-4" /> Leave meeting
                                        </DropdownMenuItem>
                                    </>
                                ) : (
                                    <DropdownMenuItem className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer gap-2 py-2.5 font-medium" onClick={handleLeave}>
                                        <DoorOpen className="w-4 h-4" /> Leave meeting
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {showLeaveMenu && (
                            <div className="absolute top-full mt-2 right-0 bg-white border border-slate-200 shadow-xl rounded-xl w-56 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col p-1">
                                <button
                                    onClick={handleLeave}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors rounded-lg text-left"
                                >
                                    <div className="p-1.5 bg-slate-100 rounded-full text-slate-600"><ArrowLeft className="w-4 h-4" /></div>
                                    Leave meeting
                                </button>
                                 {participants.find(p => p.id === '1')?.role === 'host' && (
                                    <button
                                        onClick={handleLeave}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors rounded-lg text-left"
                                    >
                                        <div className="p-1.5 bg-red-100 rounded-full text-red-600"><X className="w-4 h-4" /></div>
                                        End meeting for all
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Stage + Side Panel Container */}
            <div className="flex-1 flex overflow-hidden relative">

                {/* Main Content Area */}
                <main
                    className={`flex-1 flex flex-col items-center justify-center p-4 bg-[#1a1a1a] transition-all duration-75 relative overflow-hidden`}
                    style={{ marginRight: activePanel !== 'none' ? `${panelWidth}px` : '0px' }}
                >

                    {/* DYNAMIC VIDEO STAGE */}
                    <div className={`relative w-full h-full flex items-center justify-center transition-all duration-500`}>

                        {/* SCREEN SHARE / CONTENT VIEW */}
                        {isSharing && (
                            <div className="w-full h-full flex items-center justify-center p-4">
                                <div className="w-full h-full bg-slate-900 rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-200 group animate-in fade-in zoom-in-95 duration-500 relative flex items-center justify-center border-2 border-indigo-500">
                                    {sharingMode === 'screen' ? (
                                        (screenStream || remoteScreenStream) ? (
                                            <video
                                                ref={isScreenSharing ? screenRef : remoteScreenRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                                                    <div className="max-w-md text-center space-y-4 p-8">
                                                        <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center mb-4 mx-auto animate-pulse">
                                                            <MonitorUp className="w-12 h-12 text-indigo-400" />
                                                        </div>
                                                        <h3 className="text-2xl font-semibold">
                                                            {participants.find(p => p.id === activePresenterId)?.name || 'Presenter'} is presenting
                                                        </h3>
                                                        <p className="text-slate-400 text-base">
                                                            Establishing connection...
                                                        </p>
                                                    </div>
                                                </div>
                                        )
                                    ) : (
                                        /* Mock Whiteboard */
                                        <div className="w-full h-full bg-white flex flex-col items-center justify-center relative">
                                            <div className="absolute top-4 left-4 flex gap-2 bg-slate-100 p-2 rounded-lg shadow-sm">
                                                {['black', 'red', 'blue', 'green'].map(c => (
                                                    <div key={c} className={`w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform`} style={{ backgroundColor: c }}></div>
                                                ))}
                                            </div>
                                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Whiteboard</h3>
                                            <p className="text-slate-500">Collaborative canvas (Preview)</p>
                                            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(#ccc_1px,transparent_1px)] [background-size:16px_16px]"></div>
                                        </div>
                                    )}



                                    {/* Presenter Overlay (Draggable) - Only show if I am sharing? Or always? Design says presenter overlay is usually local preview. If watching remote, we see their stream which might include them or not. Let's keep it for local video preview always if video is on. */}
                                    {videoOn && (
                                        <div
                                            className={`absolute w-48 aspect-video bg-black rounded-lg overflow-hidden shadow-2xl border border-white/20 cursor-move transition-shadow hover:ring-2 hover:ring-indigo-500 z-50`}
                                            style={{
                                                left: videoPosition.x,
                                                top: videoPosition.y,
                                                cursor: isVideoDragging ? 'grabbing' : 'grab',
                                                transform: 'none',
                                            }}
                                            onMouseDown={(e) => {
                                                setIsVideoDragging(true);
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                                            }}
                                        >
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                muted
                                                playsInline
                                                className={`w-full h-full object-cover transform scale-x-[-1] pointer-events-none`}
                                            />
                                        </div>
                                    )}

                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2">
                                        <Share className="w-4 h-4" />
                                        {activePresenterId === effectiveUserId 
                                            ? (sharingMode === 'screen' ? 'You are sharing your screen' : 'Whiteboard Session Active')
                                            : `Viewing ${participants.find(p => p.id === activePresenterId)?.name || 'Presenter'}'s Screen`
                                        }
                                        {activePresenterId === effectiveUserId && (
                                            <button onClick={stopScreenShare} className="ml-2 hover:bg-white/20 p-0.5 rounded-full"><X className="w-4 h-4" /></button>
                                        )}
                                    </div>
                                </div>
                            </div>

                        )}

                        {/* ================== ENTERPRISE VIDEO GRID ================== */}
                                {!isSharing && viewMode !== 'together' && gridParticipants.length > 0 && effectiveUserId && (
                                    <div className="w-full h-full flex flex-col relative">
                                            {/* Render Grid */}
                                            <VideoGrid
                                                participants={gridParticipants}
                                                videoStreams={videoStreams}
                                                localUserId={effectiveUserId || ''}
                                                pinnedUserIds={pinnedUserIds}
                                                spotlightedUserIds={spotlightedUserIds}
                                                onPinParticipant={(id) => {
                                                    // Toggle pin logic
                                                    setPinnedUserIds(prev =>
                                                        prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
                                                    );
                                                }}
                                                meetingId={meetingId}
                                                currentUserRole={user?.role?.toLowerCase() || 'guest'} // Pass role
                                            />
                                    
                                        {/* Floating Reactions Overlay */}
                                        <div className="absolute inset-0 pointer-events-none z-50">
                                            {reactions.map(reaction => (
                                                <FloatingReaction
                                                    key={reaction.id}
                                                    emoji={reaction.reaction}
                                                    userName={reaction.user_name}
                                                    userId={reaction.user_id}
                                                    onComplete={() => {
                                                        setReactions(prev => prev.filter(r => r.id !== reaction.id));
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                        {/* Empty State - No Participants Yet */}
                        {!isSharing && viewMode !== 'together' && presenceParticipants.length === 0 && (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center space-y-4">
                                    <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center mx-auto">
                                        <Users2 className="w-12 h-12 text-slate-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-slate-700">Waiting for participants...</h3>
                                        <p className="text-slate-500">Others will appear here when they join</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SPEAKER VIEW (Replaced by VideoGrid) */}

                        {/* GALLERY VIEW (Replaced by VideoGrid) */}

                        {/* TOGETHER MODE */}
                        {viewMode === 'together' && !isSharing && (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-slate-900 to-black rounded-xl overflow-hidden shadow-2xl relative flex items-end justify-center pb-20 px-10">
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                <div className="text-white/30 text-4xl font-bold absolute top-10 w-full text-center">Auditorium Mode</div>
                                {/* Seats */}
                                <div className="flex -space-x-4 items-end justify-center pb-10">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-slate-700 border-4 border-white/10 relative overflow-hidden shadow-2xl transform hover:-translate-y-4 transition-transform duration-300">
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                                            <img src={`https://i.pravatar.cc/150?img=${10 + i}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>



                </main>

                {/* Right Side Panel (Chat / People) - Light Theme */}
                {
                    activePanel !== 'none' && (
                        <div
                            ref={sidebarRef}
                            style={{ width: `${panelWidth}px` }}
                            className="absolute right-0 top-0 bottom-0 bg-white border-l border-slate-200 shadow-2xl z-40 flex flex-col"
                        >
                            {/* Resize Handle */}
                            <div
                                onMouseDown={startResizing}
                                className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/50 hover:w-2 -ml-1 z-50 transition-all flex flex-col justify-center items-center group opacity-0 hover:opacity-100"
                            >
                                {/* Grip Indicator */}
                                <div className="h-8 w-1 bg-white/50 rounded-full mb-1 group-hover:bg-white transition-colors" />
                            </div>

                            {/* Panel Header */}
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center text-slate-900">
                                <h3 className="font-semibold text-sm">{activePanel === 'chat' ? 'Meeting Chat' : 'Participants'}</h3>
                                <button onClick={() => setActivePanel('none')} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Panel Content: Chat */}
                            {/* Panel Content: Chat */}
                            {activePanel === 'chat' && (
                                <ChatPanel
                                    socket={socket}
                                    lastMessage={lastMessage}
                                    meetingId={meetingId}
                                    currentUser={{
                                        id: effectiveUserId,
                                        name: user?.full_name || (participants.find(p => p.id === effectiveUserId)?.name) || "Guest",
                                        role: participants.find(p => p.id === effectiveUserId)?.role || 'guest'
                                    }}
                                    participants={participants.map(p => ({ id: p.id, name: p.name, role: p.role }))}
                                    onClose={() => setActivePanel('none')}
                                    canChat={
                                        (participants.find(p => p.id === effectiveUserId)?.permissions.canChat ?? true) &&
                                        (!meetingData?.settings?.is_chat_locked || meetingData?.host_id === effectiveUserId || participants.find(p => p.id === effectiveUserId)?.role === 'co-host')
                                    }
                                    isChatLocked={!!meetingData?.settings?.is_chat_locked}
                                    messages={messages}
                                    onReaction={() => {}}
                                    onDeleteMessage={() => {}}
                                />
                            )}

                            {/* Panel Content: People */}
                            {activePanel === 'people' && (
                                <div className="flex-1 flex flex-col bg-slate-50/30">
                                    {/* Invite Section */}
                                    <div className="p-4 bg-white border-b border-slate-100">
                                        <div className="relative mb-3">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search participants"
                                                value={participantSearch}
                                                onChange={(e) => setParticipantSearch(e.target.value)}
                                                className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-md text-sm focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
                                            />
                                        </div>
                                        {meetingData?.host_id === user?.id && (
                                            <button onClick={copyMeetingLink} className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 py-2 rounded-md transition-colors">
                                                <LinkIcon className="w-4 h-4" />
                                                Share invite
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
                                        {/* Waiting Room Section */}
                                        {waitingParticipants.length > 0 && (meetingData?.host_id === effectiveUserId) && (
                                            <div className="space-y-3 pb-4 border-b border-amber-100">
                                                <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest pl-1 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                                    Waiting Room ({waitingParticipants.length})
                                                </h4>
                                                <div className="flex flex-col gap-2">
                                                    {waitingParticipants.map(participant => (
                                                        <div key={participant.id} className="flex items-center justify-between p-3 bg-amber-50/50 rounded-lg border border-amber-100 hover:bg-amber-50 transition-colors">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${participant.avatarColor || "bg-gray-200"} grayscale opacity-70`}>
                                                                    {participant.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <span className="text-sm font-medium text-slate-700">{participant.name}</span>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handleParticipantAction('admit_participant', participant.id)}
                                                                className="h-8 text-xs border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                                                            >
                                                                Admit
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* In Meeting Section */}
                                        {inMeeting.length > 0 && (
                                            <div className="space-y-3">
                                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">In this meeting ({inMeeting.length})</h4>

                                                <div className="flex flex-col gap-1">
                                                    {inMeeting.map(participant => (
                                                        <ParticipantItem
                                                            key={participant.id}
                                                            participant={participant}
                                                            isHost={meetingData?.host_id === effectiveUserId}
                                                            isMe={participant.id === effectiveUserId}
                                                            onAction={handleParticipantAction}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Suggestions Section with Toggle */}
                                        {suggestions.length > 0 && (meetingData?.host_id === effectiveUserId) && (
                                            <div className="space-y-3 pt-2 border-t border-slate-200/60">
                                                <button
                                                    onClick={() => setShowSuggestions(!showSuggestions)}
                                                    className="flex items-center gap-2 w-full text-left group"
                                                >
                                                    <div className={`p-1 rounded hover:bg-slate-200 text-slate-400 transition-transform duration-200 ${showSuggestions ? 'rotate-90' : ''}`}>
                                                        <ChevronRight className="w-3 h-3" />
                                                    </div>
                                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-slate-700 transition-colors">
                                                        Suggestions ({suggestions.length})
                                                    </h4>
                                                </button>

                                                {showSuggestions && (
                                                    <div className="space-y-1 pl-2">
                                                        {suggestions.map(p => (
                                                            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all group">
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${p.avatarColor.replace('bg-', 'border-').replace('100', '200')} ${p.avatarColor} opacity-75 grayscale group-hover:grayscale-0 transition-all`}>
                                                                        {p.name.substring(0, 2).toUpperCase()}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-sm font-medium text-slate-900 truncate">{p.name}</div>
                                                                        <div className="text-xs text-slate-500">{p.status}</div>
                                                                    </div>
                                                                    <Button size="sm" variant="outline" className="h-7 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                                                                        Invite
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {meetingData?.host_id === effectiveUserId && (
                                        <div className="p-4 border-t border-slate-200 bg-white">
                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleParticipantAction('mute_all', 'all')}>
                                                    Mute All
                                                </Button>
                                                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => handleParticipantAction('stop_all_video', 'all')}>
                                                    Stop Videos
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline" size="sm" className="flex-1 text-xs data-[state=open]:bg-slate-100">
                                                            More Actions
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56">
                                                        <DropdownMenuItem onClick={() => setMuteOnEntry(!muteOnEntry)}>
                                                            {muteOnEntry && <Check className="w-4 h-4 mr-2" />}
                                                            <span className={muteOnEntry ? "" : "pl-6"}>Mute Participants on Entry</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={toggleAudioLock}>
                                                            {!meetingData?.settings?.audio_locked && <Check className="w-4 h-4 mr-2" />}
                                                            <span className={!meetingData?.settings?.audio_locked ? "" : "pl-6"}>Allow Participants to Unmute</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={toggleVideoLock}>
                                                            {!meetingData?.settings?.video_locked && <Check className="w-4 h-4 mr-2" />}
                                                            <span className={!meetingData?.settings?.video_locked ? "" : "pl-6"}>Allow Participants to Start Video</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={toggleScreenShareLock}>
                                                            {!meetingData?.settings?.screen_share_locked && <Check className="w-4 h-4 mr-2" />}
                                                            <span className={!meetingData?.settings?.screen_share_locked ? "" : "pl-6"}>Allow Screen Sharing</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setAllowRename(!allowRename)}>
                                                            {allowRename && <Check className="w-4 h-4 mr-2" />}
                                                            <span className={allowRename ? "" : "pl-6"}>Allow Participants to Rename</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={toggleMeetingLock}>
                                                            {isMeetingLocked ? <Check className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2 text-slate-400" />}
                                                            <span className={isMeetingLocked ? "" : "pl-0"}>{isMeetingLocked ? "Unlock Meeting" : "Lock Meeting"}</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Footer Actions */}
                            {/* Footer Actions - Only show for non-chat panels (e.g. Participants) if desired, or remove entirely. User asked to remove from Chat. */}
                            {activePanel !== 'chat' && (
                                <div className="p-4 border-t border-slate-200 bg-white">
                                    <div className="py-1">
                                        {meetingData?.host_id === user?.id && (
                                            <button
                                                onClick={handleEndMeeting}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                            >
                                                <Disc className="w-4 h-4" />
                                                End meeting for all
                                            </button>
                                        )}
                                        <button
                                            onClick={handleLeave}
                                            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                        >
                                            <PhoneOff className="w-4 h-4" />
                                            Leave meeting
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
            </div>
        </div>
    );
}
