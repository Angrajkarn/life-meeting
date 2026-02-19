import { Mic, MicOff, Video, VideoOff, MoreHorizontal, Hand, Shield, Lock, Unlock, Monitor, UserMinus, DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface ParticipantItemProps {
    participant: any;
    isHost: boolean;
    isMe: boolean;
    onAction: (action: string, targetId: string, value?: any) => void;
}

export function ParticipantItem({ participant, isHost, isMe, onAction }: ParticipantItemProps) {
    // Permission Checks
    const showHostControls = isHost && !isMe;
    const permissions = participant.permissions || {
        canUnmute: true,
        canShareVideo: true,
        canShareScreen: true,
        canChat: true,
        canUseReactions: true
    };

    return (
        <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg group transition-colors">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${participant.avatarColor || "bg-gray-200"}`}>
                    {participant.name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">{participant.name} {isMe && "(You)"}</p>
                        {participant.role === 'host' && <Badge variant="secondary" className="text-[10px] h-4 px-1">Host</Badge>}
                        {participant.role === 'co-host' && <Badge variant="outline" className="text-[10px] h-4 px-1">Co-Host</Badge>}
                    </div>
                    <p className="text-xs text-slate-500">{participant.jobTitle || "Participant"}</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Status Indicators (Always Visible) */}
                {participant.isHandRaised && <Hand className="w-4 h-4 text-yellow-500 animate-pulse" />}

                {/* Padlock indicators for Locked states */}
                {!permissions.canUnmute && <Lock className="w-3 h-3 text-red-400" />}

                {participant.isMuted ? (
                    <MicOff className="w-4 h-4 text-red-500" />
                ) : (
                    <Mic className="w-4 h-4 text-green-500" />
                )}

                {!participant.isVideoOn && (
                    <div className="relative">
                        <VideoOff className="w-4 h-4 text-slate-400" />
                        {!permissions.canShareVideo && (
                            <div className="absolute -top-1 -right-1 bg-white rounded-full">
                                <Lock className="w-2.5 h-2.5 text-red-500" />
                            </div>
                        )}
                    </div>
                )}

                {/* Host Controls Menu */}
                {showHostControls && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="left" align="start" sideOffset={5} className="w-56 z-50">
                            <DropdownMenuLabel>Manage Participant</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            {/* AUDIO CONTROLS */}
                            <DropdownMenuGroup>
                                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground uppercase tracking-widest px-2 py-1">Audio</DropdownMenuLabel>
                                {participant.isMuted ? (
                                    <DropdownMenuItem onClick={() => onAction('ask_to_unmute', participant.id)}>
                                        <Mic className="w-4 h-4 mr-2" /> Ask to Unmute
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem onClick={() => onAction('mute_participant', participant.id)}>
                                        <MicOff className="w-4 h-4 mr-2 text-red-500" /> Mute Participant
                                    </DropdownMenuItem>
                                )}

                                {permissions.canUnmute ? (
                                    <DropdownMenuItem onClick={() => onAction('lock_mic', participant.id)}>
                                        <Lock className="w-4 h-4 mr-2" /> Lock Mic
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem onClick={() => onAction('unlock_mic', participant.id)}>
                                        <Unlock className="w-4 h-4 mr-2" /> Unlock Mic
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />

                            {/* VIDEO CONTROLS */}
                            <DropdownMenuGroup>
                                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground uppercase tracking-widest px-2 py-1">Video</DropdownMenuLabel>
                                {participant.isVideoOn && (
                                    <DropdownMenuItem onClick={() => onAction('stop_video', participant.id)}>
                                        <VideoOff className="w-4 h-4 mr-2 text-red-500" /> Stop Video
                                    </DropdownMenuItem>
                                )}
                                {permissions.canShareVideo ? (
                                    <DropdownMenuItem onClick={() => onAction('lock_camera', participant.id)}>
                                        <Lock className="w-4 h-4 mr-2" /> Lock Camera
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem onClick={() => onAction('unlock_camera', participant.id)}>
                                        <Unlock className="w-4 h-4 mr-2" /> Unlock Camera
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />

                            {/* COMMUNICATION */}
                            <DropdownMenuGroup>
                                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground uppercase tracking-widest px-2 py-1">Communication</DropdownMenuLabel>

                                {permissions.canChat ? (
                                    <DropdownMenuItem onClick={() => onAction('lock_chat', participant.id)}>
                                        <Lock className="w-4 h-4 mr-2" /> Disable Chat
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem onClick={() => onAction('unlock_chat', participant.id)}>
                                        <Unlock className="w-4 h-4 mr-2" /> Enable Chat
                                    </DropdownMenuItem>
                                )}

                                {permissions.canShareScreen ? (
                                    <DropdownMenuItem onClick={() => onAction('lock_screen_share', participant.id)}>
                                        <Monitor className="w-4 h-4 mr-2" /> Block Screen Share
                                    </DropdownMenuItem>
                                ) : (
                                    <DropdownMenuItem onClick={() => onAction('unlock_screen_share', participant.id)}>
                                        <Unlock className="w-4 h-4 mr-2" /> Allow Screen Share
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />

                            {/* ROLES */}
                            <DropdownMenuGroup>
                                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground uppercase tracking-widest px-2 py-1">Roles</DropdownMenuLabel>
                                {participant.role !== 'co-host' && (
                                    <DropdownMenuItem onClick={() => onAction('promote_host', participant.id)}>
                                        <Shield className="w-4 h-4 mr-2 text-indigo-600" /> Make Co-Host
                                    </DropdownMenuItem>
                                )}
                                {participant.role === 'co-host' && (
                                    <DropdownMenuItem onClick={() => onAction('demote_host', participant.id)}>
                                        <UserMinus className="w-4 h-4 mr-2" /> Remove Co-Host
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />

                            {/* MODERATION */}
                            <DropdownMenuGroup>
                                <DropdownMenuItem className="text-amber-600 focus:text-amber-700 focus:bg-amber-50" onClick={() => onAction('send_to_waiting_room', participant.id)}>
                                    <DoorOpen className="w-4 h-4 mr-2" /> Send to Waiting Room
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => onAction('remove_participant', participant.id)}>
                                    <UserMinus className="w-4 h-4 mr-2" /> Remove from Meeting
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
}
