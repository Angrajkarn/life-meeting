"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { 
    Search, Bell, Lock, User, Volume2, Monitor, Camera, Mic, 
    Moon, Sun, Laptop, Check, CreditCard, Zap, ShieldCheck, 
    Globe, Smartphone, Key, AlertCircle, ExternalLink, 
    Settings, Languages, Clock, Languages as TranslationIcon,
    Palette, Eye, Headphones, Users, HelpCircle, Info, ChevronRight,
    Type, Accessibility as AccessibilityIcon, Filter, X,
    Loader2, CloudCheck, Cloud, CornerDownLeft, MessageSquare, List
} from "lucide-react";
import { Montserrat } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { useSocket } from "@/lib/socket";
import { toast } from "sonner";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["700", "800", "900"] });

import { useUserPreferences } from "@/components/providers/user-preferences-provider";
import { NotificationSettings } from "@/components/dashboard/settings/notifications-settings";
import { AccountsAndOrgsSettings } from "@/components/dashboard/settings/accounts-orgs-settings";
import { PrivacySettings } from "@/components/dashboard/settings/privacy-settings";
import { AccessibilitySettings } from "@/components/dashboard/settings/accessibility-settings";
import { PeopleSettings } from "@/components/dashboard/settings/people-settings";
import { PlansSettings } from "@/components/dashboard/settings/plans-settings";
import { AboutSettings } from "@/components/dashboard/settings/about-settings";

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("general");
    const [searchQuery, setSearchQuery] = useState("");
    
    // Use Global Context
    const { preferences, updatePreference, saveStatus } = useUserPreferences();
    
    // A/V Preview State
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

    const menuItems = [
        { id: "general", label: "General", icon: Settings },
        { id: "appearance", label: "Appearance", icon: Palette },
        { id: "notifications", label: "Notifications & activity", icon: Bell },
        { id: "accounts", label: "Accounts and orgs", icon: Lock },
        { id: "privacy", label: "Privacy", icon: ShieldCheck },
        { id: "accessibility", label: "Accessibility", icon: AccessibilityIcon },
        { id: "devices", label: "Devices", icon: Volume2 },
        { id: "people", label: "People", icon: Users },
        { id: "plans", label: "Plans and upgrades", icon: Zap },
        { id: "about", label: "About", icon: Info },
    ];

    const filteredMenu = useMemo(() => {
        return menuItems.filter(item => 
            item.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    // Media logic (A/V Preview)
    useEffect(() => {
        if (activeTab === 'devices') {
            const startMedia = async () => {
                try {
                    const devList = await navigator.mediaDevices.enumerateDevices();
                    setDevices(devList);
                    
                    const constraints: MediaStreamConstraints = { audio: true, video: true };
                    if (preferences?.devices?.last_camera_id) {
                        constraints.video = { deviceId: { exact: preferences.devices.last_camera_id } };
                    }
                    if (preferences?.devices?.last_mic_id) {
                        constraints.audio = { deviceId: { exact: preferences.devices.last_mic_id } };
                    }

                    let newStream;
                    try {
                        newStream = await navigator.mediaDevices.getUserMedia(constraints);
                    } catch (e) {
                         console.warn("Preferred device failed, falling back", e);
                         newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    }
                    
                    setStream(newStream);
                    if (videoRef.current) videoRef.current.srcObject = newStream;
                    
                    const audioContext = new AudioContext();
                    const source = audioContext.createMediaStreamSource(newStream);
                    const analyser = audioContext.createAnalyser();
                    analyser.fftSize = 256;
                    source.connect(analyser);
                    const dataArray = new Uint8Array(analyser.frequencyBinCount);
                    const updateLevel = () => {
                        analyser.getByteFrequencyData(dataArray);
                        const avg = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
                        setAudioLevel(avg);
                        requestAnimationFrame(updateLevel);
                    };
                    updateLevel();
                } catch (err) { console.error(err); }
            };
            startMedia();
        } else if (stream) {
            stream.getTracks().forEach(t => t.stop());
            setStream(null);
        }
        return () => stream?.getTracks().forEach(t => t.stop());
    }, [activeTab]);

    return (
        <div className="h-full bg-[#f5f5f5] overflow-hidden flex flex-col md:flex-row">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col md:flex-row">
                {/* Sidebar Navigation */}
                <aside className="w-[300px] border-r border-slate-200 bg-[#f5f5f5] p-6 flex flex-col h-full shrink-0">
                    <h1 className={cn(montserrat.className, "text-2xl font-black text-slate-900 mb-6 tracking-tight")}>
                        Settings
                    </h1>
                    
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder="Find in Settings (Ctrl+Alt+F)" 
                            className="pl-10 h-10 bg-white border-slate-200 rounded-lg text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <TabsList className="bg-transparent p-0 flex flex-col h-auto justify-start space-y-0.5 overflow-y-auto flex-1 custom-scrollbar">
                        {filteredMenu.map(item => (
                            <TabsTrigger
                                key={item.id}
                                value={item.id}
                                className="w-full justify-start px-3 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm text-slate-600 hover:bg-slate-200/50 transition-all font-medium text-sm gap-3 group"
                            >
                                <item.icon className={cn("w-4 h-4 transition-colors", activeTab === item.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
                                {item.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                </aside>

                {/* Main Content Area */}
                <main className="flex-1 bg-white overflow-y-auto p-10 custom-scrollbar relative">
                    {/* Floating Save Status */}
                    <div className="absolute top-8 right-10 flex items-center gap-2">
                        {saveStatus === 'saving' && (
                            <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Saving...
                            </div>
                        )}
                        {saveStatus === 'saved' && (
                            <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                                <CloudCheck className="h-3 w-3" />
                                Saved
                            </div>
                        )}
                        {saveStatus === 'idle' && (
                            <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
                                <Cloud className="h-3 w-3" />
                                Up to date
                            </div>
                        )}
                    </div>

                    <div className="max-w-[800px] mx-auto">
                        <header className="mb-10">
                            <h2 className={cn(montserrat.className, "text-3xl font-black text-slate-900 capitalize tracking-tight")}>
                                {menuItems.find(m => m.id === activeTab)?.label}
                            </h2>
                        </header>

                        {/* GENERAL TAB */}
                        <TabsContent value="general" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                            <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
                                <div className="flex gap-4">
                                    <Monitor className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                                    <div className="space-y-4 w-full">
                                        <h3 className="font-bold text-slate-900">Meeting</h3>
                                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <Switch 
                                                checked={preferences.confirm_on_leave}
                                                onCheckedChange={(checked) => updatePreference("confirm_on_leave", checked)}
                                                className="data-[state=checked]:bg-indigo-600"
                                            />
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-semibold text-slate-700">Ask me to confirm when I leave a meeting</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
                                <div className="flex gap-4">
                                    <Languages className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                                    <div className="space-y-6 w-full">
                                        <div className="space-y-1">
                                            <h3 className="font-bold text-slate-900">Language and regional formats</h3>
                                            <p className="text-xs text-slate-400">Restart Life Meeting to apply language and regional format settings</p>
                                        </div>

                                        <div className="grid grid-cols-[1fr_240px] items-center gap-8 border-b border-slate-100 pb-6">
                                            <Label className="text-sm font-medium text-slate-600">App language</Label>
                                            <Select 
                                                value={preferences.app_language} 
                                                onValueChange={(val) => updatePreference("app_language", val)}
                                            >
                                                <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-lg">
                                                    <SelectValue placeholder="Select Language" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-200">
                                                    <SelectItem value="en-us">English (United States)</SelectItem>
                                                    <SelectItem value="hi">Hindi (India)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-[1fr_240px] items-center gap-8 border-b border-slate-100 pb-6">
                                            <Label className="text-sm font-medium text-slate-600">Date format</Label>
                                            <Select 
                                                value={preferences.date_format} 
                                                onValueChange={(val) => updatePreference("date_format", val)}
                                            >
                                                <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-lg">
                                                    <SelectValue placeholder="Select Format" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-200">
                                                    <SelectItem value="mdy">1/31/2026</SelectItem>
                                                    <SelectItem value="dmy">31/1/2026</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-[1fr_240px] items-center gap-8">
                                            <Label className="text-sm font-medium text-slate-600">Time format</Label>
                                            <Select 
                                                value={preferences.time_format} 
                                                onValueChange={(val) => updatePreference("time_format", val)}
                                            >
                                                <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-lg">
                                                    <SelectValue placeholder="Select Format" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl border-slate-200">
                                                    <SelectItem value="12">1:01 AM - 11:59 PM</SelectItem>
                                                    <SelectItem value="24">00:00 - 23:59</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
                                <div className="flex gap-4">
                                    <TranslationIcon className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                                    <div className="space-y-6 w-full">
                                        <h3 className="font-bold text-slate-900">Translation</h3>
                                        
                                        <div className="grid grid-cols-[1fr_240px] items-center gap-8 border-b border-slate-100 pb-6">
                                            <Label className="text-sm font-medium text-slate-600">Translate messages into this language</Label>
                                            <Select 
                                                value={preferences.translate_to} 
                                                onValueChange={(val) => updatePreference("translate_to", val)}
                                            >
                                                <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-lg">
                                                    <SelectValue placeholder="Language" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="en">English</SelectItem>
                                                    <SelectItem value="hi">Hindi</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-[1fr_240px] items-center gap-8 border-b border-slate-100 pb-6">
                                            <Label className="text-sm font-medium text-slate-600">How to handle messages in other languages</Label>
                                            <Select 
                                                value={preferences.translation_handling} 
                                                onValueChange={(val) => updatePreference("translation_handling", val)}
                                            >
                                                <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-lg">
                                                    <SelectValue placeholder="Action" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="ask">Ask me before translating</SelectItem>
                                                    <SelectItem value="auto">Translate automatically</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid grid-cols-[1fr_240px] items-center gap-8">
                                            <Label className="text-sm font-medium text-slate-600">Never translate messages in these languages</Label>
                                            <Select defaultValue="add">
                                                <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-lg">
                                                    <SelectValue placeholder="Add another language" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="add">Add another language</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
                                <div className="flex gap-4">
                                    <Type className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                                    <div className="space-y-4 w-full">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-slate-900">Editor spellcheck</h3>
                                                <p className="text-xs text-slate-400 max-w-[500px]">Customize Editor to check for spelling and grammar improvements in up to three languages. If you'd like to include a different language or remove an old one, select Manage spellcheck languages.</p>
                                            </div>
                                            <Button variant="outline" className="font-bold rounded-lg border-slate-200">Manage</Button>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
                                <div className="flex gap-4">
                                    <CornerDownLeft className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                                    <div className="space-y-4 w-full">
                                        <div className="flex justify-between items-center">
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-slate-900">Use Enter or Spacebar to show content</h3>
                                                <p className="text-xs text-slate-400">Press Enter or Spacebar to open an item in a list (like @mentions, chats, or channels) and view its content.</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-400">{preferences.open_item_on_enter ? "On" : "Off"}</span>
                                                <Switch 
                                                    checked={preferences.open_item_on_enter}
                                                    onCheckedChange={(checked) => updatePreference("open_item_on_enter", checked)}
                                                    className="data-[state=checked]:bg-indigo-600" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
                                <div className="flex gap-4">
                                    <MessageSquare className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                                    <div className="space-y-4 w-full">
                                        <div className="flex justify-between items-center">
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-slate-900">Suggested replies</h3>
                                                <p className="text-xs text-slate-400">Show suggested replies in chat</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-400">{preferences.suggested_replies ? "On" : "Off"}</span>
                                                <Switch 
                                                    checked={preferences.suggested_replies}
                                                    onCheckedChange={(checked) => updatePreference("suggested_replies", checked)}
                                                    className="data-[state=checked]:bg-indigo-600" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </TabsContent>

                        {/* APPEARANCE TAB */}
                        <TabsContent value="appearance" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                             <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-8 shadow-sm">
                                <div className="space-y-6">
                                    <h3 className="font-bold text-slate-900">Themes</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { id: 'light', label: 'Light', bg: 'bg-white', text: 'text-slate-900', border: 'border-slate-200' },
                                            { id: 'dark', label: 'Dark', bg: 'bg-[#1f1f1f]', text: 'text-white', border: 'border-[#333]' },
                                            { id: 'system', label: 'System', bg: 'bg-slate-100', text: 'text-slate-900', border: 'border-slate-200' },
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => updatePreference('theme', t.id)}
                                                className={cn(
                                                    "flex flex-col gap-4 group text-left",
                                                    preferences.theme === t.id && "scale-[1.02]"
                                                )}
                                            >
                                                <div className={cn(
                                                    "aspect-video w-full rounded-xl border-4 transition-all overflow-hidden flex flex-col p-2",
                                                    t.bg, t.border,
                                                    preferences.theme === t.id ? "border-indigo-600 ring-4 ring-indigo-50" : "hover:border-slate-300"
                                                )}>
                                                    <div className={cn("h-2 w-12 rounded-full mb-1", t.id === 'dark' ? 'bg-slate-700' : 'bg-slate-200')} />
                                                    <div className={cn("h-4 w-full rounded-sm mb-1", t.id === 'dark' ? 'bg-slate-800' : 'bg-slate-100')} />
                                                    <div className={cn("h-4 w-4/5 rounded-sm", t.id === 'dark' ? 'bg-slate-800' : 'bg-slate-100')} />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={cn(
                                                        "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                                                        preferences.theme === t.id ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                                                    )}>
                                                        {preferences.theme === t.id && <Check className="w-2.5 h-2.5 text-white" />}
                                                    </span>
                                                    <span className="text-sm font-bold text-slate-700">{t.label}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Separator className="bg-slate-100" />

                                <div className="space-y-6">
                                    <h3 className="font-bold text-slate-900">Density</h3>
                                    <div className="flex gap-4 p-1 bg-slate-50 rounded-xl w-fit border border-slate-100">
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => updatePreference('density', 'comfy')}
                                            className={cn("h-10 px-6 rounded-lg font-bold transition-all", preferences.density === 'comfy' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:bg-slate-200/50")}
                                        >
                                            Comfy
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => updatePreference('density', 'compact')}
                                            className={cn("h-10 px-6 rounded-lg font-bold transition-all", preferences.density === 'compact' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:bg-slate-200/50")}
                                        >
                                            Compact
                                        </Button>
                                    </div>
                                </div>

                                <Separator className="bg-slate-100" />

                                <div className="space-y-6">
                                    <h3 className="font-bold text-slate-900">Accessibility</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="space-y-0.5">
                                                <h4 className="font-bold text-sm text-slate-900">High contrast</h4>
                                                <p className="text-xs text-slate-500">Turn on high contrast mode</p>
                                            </div>
                                            <Switch 
                                                checked={preferences.high_contrast}
                                                onCheckedChange={(checked) => updatePreference("high_contrast", checked)}
                                                className="data-[state=checked]:bg-indigo-600"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="space-y-0.5">
                                                <h4 className="font-bold text-sm text-slate-900">Reduce animation</h4>
                                                <p className="text-xs text-slate-500">Turn off animations in the app</p>
                                            </div>
                                            <Switch 
                                                checked={preferences.reduce_motion}
                                                onCheckedChange={(checked) => updatePreference("reduce_motion", checked)}
                                                className="data-[state=checked]:bg-indigo-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </TabsContent>

                        {/* DEVICES TAB */}
                        <TabsContent value="devices" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                             <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-8 shadow-sm text-center">
                                    <div className="max-w-md mx-auto space-y-6">
                                        
                                        {/* Camera Selection */}
                                        <div className="space-y-1.5 text-left">
                                            <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Camera</Label>
                                            <Select defaultValue="default">
                                                <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="default">Integrated Camera</SelectItem>
                                                    {devices.filter(d => d.kind === 'videoinput' && d.deviceId).map((d, i) => (
                                                        <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${i+1}`}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="aspect-video bg-slate-950 rounded-2xl border-8 border-slate-50 shadow-2xl relative overflow-hidden group">
                                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                                        <div className="absolute top-4 right-4 h-3 w-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-left transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                            <p className="text-white font-bold text-sm flex items-center gap-2">
                                                <Camera className="w-4 h-4" /> Integrated Camera Pro
                                            </p>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900">Life Meeting Studio</h3>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">Ensure you look and sound perfect before your next high-stakes presentation.</p>
                                </div>

                                <Separator className="bg-slate-100" />

                                <div className="grid md:grid-cols-2 gap-10 text-left">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 rounded-lg">
                                                <Headphones className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <h4 className="font-bold text-slate-900">Audio devices</h4>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Speaker</Label>
                                                <Select defaultValue="default">
                                                    <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="default">System Default Speaker</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-black uppercase tracking-wider text-slate-400">Microphone</Label>
                                                <Select defaultValue="default">
                                                    <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl">
                                                        <SelectItem value="default">Digital Mic (High Definition)</SelectItem>
                                                        {devices.filter(d => d.kind === 'audioinput' && d.deviceId).map((d, i) => (
                                                            <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${i+1}`}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-indigo-500 transition-all duration-75"
                                                        style={{ width: `${Math.min(100, (audioLevel / 255) * 200)}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 mono">LVL {Math.round((audioLevel / 255) * 100)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 rounded-lg">
                                                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <h4 className="font-bold text-slate-900">Noise suppression</h4>
                                        </div>
                                        <div className="space-y-4">
                                            <p className="text-sm text-slate-500 font-medium">Auto-suppress background sounds for clearer communication.</p>
                                            <Select defaultValue="auto">
                                                <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-xl font-bold">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl font-medium">
                                                    <SelectItem value="auto">Auto (Default)</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="low">Low</SelectItem>
                                                    <SelectItem value="off">Off</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </TabsContent>

                        <TabsContent value="notifications" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                             <NotificationSettings />
                        </TabsContent>

                        <TabsContent value="accounts" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                             <AccountsAndOrgsSettings />
                        </TabsContent>

                        <TabsContent value="privacy" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                             <PrivacySettings />
                        </TabsContent>

                        <TabsContent value="accessibility" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                             <AccessibilitySettings />
                        </TabsContent>

                        <TabsContent value="people" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                             <PeopleSettings />
                        </TabsContent>

                        <TabsContent value="plans" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                             <PlansSettings />
                        </TabsContent>
                        
                        <TabsContent value="about" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                             <AboutSettings />
                        </TabsContent>
                    </div>
                </main>
            </Tabs>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
