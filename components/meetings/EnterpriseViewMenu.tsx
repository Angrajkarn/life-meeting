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
} from "@/components/ui/dropdown-menu";
import {
    LayoutDashboard, Grid, User, Users2, Maximize, EyeOff, Eye, Presentation,
    Sparkles, Settings2, MonitorUp, Zap, Shield, Lock, LockOpen, Crown,
    ListVideo, Focus, Cpu
} from "lucide-react";
import { toast } from "sonner";

export type ViewModeType = 'gallery' | 'speaker' | 'together' | 'stage' | 'focus' | 'ai';

interface EnterpriseViewMenuProps {
    role: 'host' | 'co-host' | 'presenter' | 'guest';
    planTier: 'FREE' | 'PRO' | 'ENTERPRISE';
    viewMode: ViewModeType;
    isFullscreen: boolean;
    showSelfView: boolean;
    isLayoutLocked?: boolean;
    maxGallerySize?: number;
    onSetMaxGallerySize?: (size: number) => void;
    onSetViewMode: (mode: ViewModeType) => void;
    onToggleFullscreen: () => void;
    onToggleSelfView: () => void;
    onToggleLayoutLock?: () => void;
    showDiagnosticsOverlay?: boolean;
    onToggleDiagnostics?: () => void;
}

export function EnterpriseViewMenu({
    role,
    planTier,
    viewMode,
    isFullscreen,
    showSelfView,
    isLayoutLocked,
    maxGallerySize,
    onSetMaxGallerySize,
    onSetViewMode,
    onToggleFullscreen,
    onToggleSelfView,
    onToggleLayoutLock,
    showDiagnosticsOverlay = false,
    onToggleDiagnostics
}: EnterpriseViewMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    const isHost = role === 'host' || role === 'co-host';
    const isEnterprise = planTier === 'ENTERPRISE';

    const handleUpgradeClick = (featureName: string) => {
        toast.custom((t) => (
            <div className="flex flex-col gap-2">
                <span className="font-bold">Upgrade Required</span>
                <span className="text-sm">"{featureName}" requires an Enterprise plan.</span>
                <button 
                    onClick={() => toast.dismiss(t)} 
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
                    className={`p-2.5 rounded-md transition-all ${isOpen ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-inner' : 'hover:bg-slate-100 text-slate-700'}`}
                    title="View Options"
                >
                    <div className="flex flex-col items-center gap-0.5">
                        <LayoutDashboard className="w-5 h-5 stroke-[1.5]" />
                        <span className="text-[10px] font-medium hidden md:block">View</span>
                    </div>
                </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="start" className="w-72 mt-2 p-2 rounded-xl shadow-2xl border-slate-200" sideOffset={8}>
                
                {/* 1. Layout Modes */}
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1">
                        Layout
                    </DropdownMenuLabel>
                    
                    <DropdownMenuItem onClick={() => onSetViewMode('gallery')} className={`cursor-pointer flex items-center gap-3 py-2 px-2.5 rounded-lg ${viewMode === 'gallery' ? 'bg-indigo-50 text-indigo-700 font-medium' : ''}`}>
                        <Grid className="w-4 h-4" /> Gallery
                        {viewMode === 'gallery' && <span className="ml-auto text-indigo-600">✓</span>}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => onSetViewMode('speaker')} className={`cursor-pointer flex items-center gap-3 py-2 px-2.5 rounded-lg ${viewMode === 'speaker' ? 'bg-indigo-50 text-indigo-700 font-medium' : ''}`}>
                        <User className="w-4 h-4" /> Speaker
                        {viewMode === 'speaker' && <span className="ml-auto text-indigo-600">✓</span>}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => onSetViewMode('together')} className={`cursor-pointer flex items-center gap-3 py-2 px-2.5 rounded-lg ${viewMode === 'together' ? 'bg-indigo-50 text-indigo-700 font-medium' : ''}`}>
                        <Users2 className="w-4 h-4" /> Together Mode
                        {viewMode === 'together' && <span className="ml-auto text-indigo-600">✓</span>}
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                        onClick={(e) => {
                            if (!isEnterprise) { e.preventDefault(); handleUpgradeClick("Stage Mode"); }
                            else onSetViewMode('stage');
                        }}
                        className={`cursor-pointer flex items-center gap-3 py-2 px-2.5 rounded-lg ${viewMode === 'stage' ? 'bg-indigo-50 text-indigo-700 font-medium' : ''}`}
                    >
                        <Presentation className="w-4 h-4 text-indigo-500" /> Stage Mode
                        {!isEnterprise && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
                        {isEnterprise && viewMode === 'stage' && <span className="ml-auto text-indigo-600">✓</span>}
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                        onClick={(e) => {
                            if (!isEnterprise) { e.preventDefault(); handleUpgradeClick("AI Smart Layout"); }
                            else onSetViewMode('ai');
                        }}
                        className={`cursor-pointer flex items-center gap-3 py-2 px-2.5 rounded-lg ${viewMode === 'ai' ? 'bg-purple-50 text-purple-700 font-medium' : ''}`}
                    >
                        <Sparkles className="w-4 h-4 text-purple-500" /> AI Smart Layout
                        {!isEnterprise && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
                        {isEnterprise && viewMode === 'ai' && <span className="ml-auto text-purple-600">✓</span>}
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator className="my-2 bg-slate-100" />
                
                {/* 2. Gallery Controls */}
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1">
                        Gallery Settings
                    </DropdownMenuLabel>
                    
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="cursor-pointer flex items-center gap-3 py-2 px-2.5">
                            <ListVideo className="w-4 h-4" /> Max Gallery Size
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-48">
                            <DropdownMenuItem className="cursor-pointer">9 Tiles (3x3)</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">16 Tiles (4x4)</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">25 Tiles (5x5)</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">49 Tiles (7x7)</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-indigo-600 font-medium cursor-pointer" onClick={(e) => { e.preventDefault(); handleUpgradeClick("Large Meeting Gallery"); }}>
                                100 Tiles <Crown className="w-3 h-3 ml-auto" />
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="my-2 bg-slate-100" />

                {/* 3. Content Controls */}
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pb-1">
                        Content Focus
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={onToggleSelfView} className="cursor-pointer flex items-center gap-3 py-2 px-2.5">
                        {showSelfView ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span className="font-medium text-sm">{showSelfView ? 'Hide self view' : 'Show self view'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onToggleFullscreen} className="cursor-pointer flex items-center gap-3 py-2 px-2.5">
                        <Maximize className="w-4 h-4" /> 
                        <span className="font-medium text-sm">{isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer flex items-center gap-3 py-2 px-2.5 text-slate-600">
                        <Focus className="w-4 h-4" /> Hide non-video participants
                    </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="my-2 bg-slate-100" />

                {/* 4. Performance Flags */}
                <DropdownMenuGroup>
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="cursor-pointer flex items-center gap-3 py-2 px-2.5">
                            <Zap className="w-4 h-4 text-emerald-500" /> Performance
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-48">
                            <DropdownMenuLabel className="text-[10px] uppercase text-slate-400">Rendering Mode</DropdownMenuLabel>
                            <DropdownMenuItem className="cursor-pointer font-medium text-emerald-600">
                                <Zap className="w-3 h-3 mr-2" /> GPU Accelerated 
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-slate-600">
                                <Cpu className="w-3 h-3 mr-2" /> CPU Safe Mode
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={onToggleDiagnostics} className="cursor-pointer text-slate-700 flex items-center justify-between">
                                Diagnostics Overlay
                                {showDiagnosticsOverlay && <span className="text-emerald-500 font-bold ml-2">✓</span>}
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuGroup>

                {/* 5. Enterprise Host Controls */}
                {isHost && (
                    <>
                        <DropdownMenuSeparator className="my-2 bg-slate-100" />
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest px-2 pb-1 flex items-center gap-1.5">
                                <Shield className="w-3 h-3" /> Host Layout Controls
                            </DropdownMenuLabel>
                            
                            <DropdownMenuItem onClick={onToggleLayoutLock} className="cursor-pointer flex items-center gap-3 py-2 px-2.5 text-slate-700">
                                {isLayoutLocked ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                <span className="font-medium text-sm">{isLayoutLocked ? 'Unlock Layout for All' : 'Lock Layout for All'}</span>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                                onClick={(e) => { e.preventDefault(); handleUpgradeClick("Custom Layout Editor"); }}
                                className="cursor-pointer flex items-center gap-3 py-2 px-2.5 text-slate-700"
                            >
                                <Settings2 className="w-4 h-4" /> Custom Layout Editor
                                {!isEnterprise && <Crown className="w-3 h-3 ml-auto text-amber-500" />}
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
