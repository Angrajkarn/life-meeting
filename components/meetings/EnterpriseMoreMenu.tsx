import React, { useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuShortcut
} from "@/components/ui/dropdown-menu";
import {
    MoreHorizontal, Disc, Captions, Settings, Filter, Users2, Shield,
    Lock, FileText, MonitorUp, Languages, Activity, AlertTriangle,
    Crown, Wand2, Download, History, LockOpen
} from "lucide-react";
import { toast } from "sonner";

interface EnterpriseMoreMenuProps {
    role: 'host' | 'co-host' | 'presenter' | 'guest';
    planTier: 'FREE' | 'PRO' | 'ENTERPRISE';
    
    // Feature States
    isRecording: boolean;
    areCaptionsOn: boolean;
    isMeetingLocked?: boolean;
    
    // Action Callbacks
    onToggleRecording: () => void;
    onToggleCaptions: () => void;
    onOpenBackgroundPanel: () => void;
    onOpenSettings: () => void;
    onSimulateParticipants: () => void;
    onToggleMeetingLock?: () => void;
}

export function EnterpriseMoreMenu({
    role,
    planTier,
    isRecording,
    areCaptionsOn,
    isMeetingLocked,
    onToggleRecording,
    onToggleCaptions,
    onOpenBackgroundPanel,
    onOpenSettings,
    onSimulateParticipants,
    onToggleMeetingLock
}: EnterpriseMoreMenuProps) {
    
    const [isOpen, setIsOpen] = useState(false);
    
    // Helpers for Feature Gating
    const isHost = role === 'host' || role === 'co-host';
    const isEnterprise = planTier === 'ENTERPRISE';
    
    const handleUpgradeClick = (featureName: string) => {
        toast.custom((t) => (
            <div className="flex flex-col gap-2">
                <span className="font-bold">Upgrade Required</span>
                <span className="text-sm">"{featureName}" requires an Enterprise plan.</span>
                <button 
                    onClick={() => toast.dismiss(t as string | number)} 
                    className="mt-2 bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold w-fit"
                >
                    Upgrade Now
                </button>
            </div>
        ), { duration: 5000, icon: '💎' });
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    className={`p-2.5 rounded-md transition-all ${isOpen ? 'bg-slate-100 text-slate-900 shadow-inner' : 'hover:bg-slate-100 text-slate-700'}`}
                    title="More Options"
                >
                    <div className="flex flex-col items-center gap-0.5">
                        <MoreHorizontal className="w-5 h-5 stroke-[1.5]" />
                        <span className="text-[10px] font-medium hidden md:block">More</span>
                    </div>
                </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-72 mt-2 p-2 rounded-xl shadow-2xl border-slate-200" sideOffset={8}>
                
                {/* 1. Recording & Compliance */}
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1">
                        Recording & Notes
                    </DropdownMenuLabel>
                    
                    <DropdownMenuItem 
                        onClick={(e) => {
                            if (!isHost && !isEnterprise) {
                                e.preventDefault();
                                handleUpgradeClick("Recording");
                            } else {
                                onToggleRecording();
                            }
                        }}
                        className={`cursor-pointer flex items-center gap-3 py-2.5 px-2.5 rounded-lg ${isRecording ? 'text-red-600 focus:text-red-700 bg-red-50 focus:bg-red-100' : ''}`}
                    >
                        <Disc className={`w-4 h-4 ${isRecording ? 'fill-current animate-pulse' : ''}`} />
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm">{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
                        </div>
                        {(!isHost && planTier === 'FREE') && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                        onClick={(e) => { e.preventDefault(); handleUpgradeClick("AI Meeting Summary"); }}
                        className="cursor-pointer flex items-center gap-3 py-2 px-2.5 opacity-80"
                    >
                        <Wand2 className="w-4 h-4 text-indigo-500" />
                        <span className="font-medium text-sm">Generate AI Summary</span>
                        {!isEnterprise && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator className="my-2 bg-slate-100" />
                
                {/* 2. Accessibility & Language */}
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1">
                        Accessibility
                    </DropdownMenuLabel>
                    
                    <DropdownMenuItem onClick={onToggleCaptions} className="cursor-pointer flex items-center gap-3 py-2 px-2.5">
                        <Captions className="w-4 h-4" />
                        <span className="font-medium text-sm">{areCaptionsOn ? 'Turn off' : 'Turn on'} live captions</span>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="cursor-pointer flex items-center gap-3 py-2 px-2.5">
                            <Languages className="w-4 h-4" />
                            <span className="font-medium text-sm">Spoken Language</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-48">
                            <DropdownMenuItem className="cursor-pointer">English (US)</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">Spanish (ES)</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">French (FR)</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-indigo-600 font-medium cursor-pointer" onClick={(e) => { e.preventDefault(); handleUpgradeClick("Live Translation"); }}>
                                Live Translation <Crown className="w-3 h-3 ml-auto" />
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="my-2 bg-slate-100" />

                {/* 3. Media & Effects */}
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1">
                        Media & Settings
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={onOpenBackgroundPanel} className="cursor-pointer flex items-center gap-3 py-2 px-2.5">
                        <Filter className="w-4 h-4" />
                        <span className="font-medium text-sm">Background Effects</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onOpenSettings} className="cursor-pointer flex items-center gap-3 py-2 px-2.5">
                        <Settings className="w-4 h-4" />
                        <span className="font-medium text-sm">Device Settings</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                {/* 4. Enterprise Admin (Host Only) */}
                {isHost && (
                    <>
                        <DropdownMenuSeparator className="my-2 bg-slate-100" />
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest px-2 pb-1 flex items-center gap-1.5">
                                <Shield className="w-3 h-3" /> Host Controls
                            </DropdownMenuLabel>
                            
                            <DropdownMenuItem onClick={onToggleMeetingLock} className="cursor-pointer flex items-center gap-3 py-2 px-2.5 text-slate-700">
                                {isMeetingLocked ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                <span className="font-medium text-sm">{isMeetingLocked ? 'Unlock Meeting' : 'Lock Meeting'}</span>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                                onClick={(e) => { e.preventDefault(); handleUpgradeClick("Audit Logs"); }}
                                className="cursor-pointer flex items-center gap-3 py-2 px-2.5"
                            >
                                <History className="w-4 h-4" />
                                <span className="font-medium text-sm">View Audit Logs</span>
                                {!isEnterprise && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </>
                )}

                {/* 5. Diagnostics (Visible in Dev/Mock) */}
                <DropdownMenuSeparator className="my-2 bg-slate-100" />
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1">
                        Diagnostics
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={onSimulateParticipants} className="cursor-pointer flex items-center gap-3 py-2 px-2.5 text-slate-500 hover:text-slate-800">
                        <Users2 className="w-4 h-4" />
                        <span className="font-medium text-sm">Add 25 Mock Users</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer flex items-center gap-3 py-2 px-2.5 text-slate-500 hover:text-slate-800">
                        <Activity className="w-4 h-4" />
                        <span className="font-medium text-sm">Call Statistics</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
