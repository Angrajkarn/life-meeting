"use client";

import { useEffect, useState } from "react";
import { useUserPreferences } from "@/components/providers/user-preferences-provider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { 
    Shield, 
    Eye, 
    Video, 
    Download, 
    Trash2, 
    Lock,
    Activity
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface PrivacySettings {
    profile_visibility: "public" | "organization" | "none";
    show_online_status: boolean;
    allow_random_meeting_joins: boolean;
    collect_analytics: boolean;
    allow_recording: boolean;
    _enforced_recording?: "allow" | "deny";
    _enforced_camera?: boolean;
}

export function PrivacySettings() {
    const { preferences, updatePreference } = useUserPreferences();
    const [settings, setSettings] = useState<PrivacySettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch effective settings (merged with Org policies)
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await api.get("/privacy/effective-settings");
                setSettings(data);
            } catch (err) {
                console.error("Failed to fetch privacy settings", err);
                toast.error("Failed to load privacy settings");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleToggle = async (key: keyof PrivacySettings) => {
        if (!settings) return;
        
        const newValue = !settings[key as keyof PrivacySettings];
        const newSettings = { ...settings, [key]: newValue };
        
        setSettings(newSettings); // Optimistic update
        
        try {
            await api.patch("/privacy/settings", newSettings);
            toast.success("Privacy settings updated");
        } catch (err) {
            setSettings(settings); // Revert
            toast.error("Failed to update settings");
        }
    };

    const handleVisibilityChange = async (value: string) => {
        if (!settings) return;
        const newSettings = { ...settings, profile_visibility: value as any };
        setSettings(newSettings);
        
        try {
            await api.patch("/privacy/settings", newSettings);
            toast.success("Visibility updated");
        } catch (err) {
            setSettings(settings);
            toast.error("Failed to update visibility");
        }
    };

    const handleExportData = async () => {
        try {
            await api.post("/privacy/export-data", {});
            toast.success("Data export started. Check your email.");
        } catch (err) {
            toast.error("Failed to start data export");
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading privacy settings...</div>;
    if (!settings) return null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Shield className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Privacy & Visibility</h2>
                        <p className="text-sm text-slate-500">Manage how you appear to others and control your data.</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="w-5 h-5" />
                                Profile Visibility
                            </CardTitle>
                            <CardDescription>Control who can see your profile and status.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Who can see my profile?</Label>
                                <div className="flex gap-2">
                                    {(["public", "organization", "none"] as const).map((vis) => (
                                        <button
                                            key={vis}
                                            onClick={() => handleVisibilityChange(vis)}
                                            className={`px-3 py-1.5 text-sm rounded-md capitalize transition-colors ${
                                                settings.profile_visibility === vis
                                                    ? "bg-slate-900 text-white"
                                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            }`}
                                        >
                                            {vis}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Show Online Status</Label>
                                    <p className="text-xs text-slate-500">Let others know when you're active.</p>
                                </div>
                                <Switch 
                                    checked={settings.show_online_status}
                                    onCheckedChange={() => handleToggle("show_online_status")}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Video className="w-5 h-5" />
                                Meeting Privacy
                            </CardTitle>
                            <CardDescription>Controls for recordings and camera usage.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <Label>Allow Recording</Label>
                                        {settings._enforced_recording && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <Lock className="w-3 h-3 text-amber-500" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Enforced by Organization Policy ({settings._enforced_recording})</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {settings._enforced_recording === "deny" 
                                            ? "Your organization prohibits recording." 
                                            : "Allow others to record meetings you join."}
                                    </p>
                                </div>
                                <Switch 
                                    checked={settings.allow_recording}
                                    onCheckedChange={() => handleToggle("allow_recording")}
                                    disabled={!!settings._enforced_recording}
                                />
                            </div>
                            
                            {settings._enforced_camera && (
                                <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-md flex items-center gap-2">
                                    <Video className="w-4 h-4" />
                                    Your organization requires camera to be ON by default.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                Data & Analytics
                            </CardTitle>
                            <CardDescription>Manage your data usage and retention.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Collect Product Analytics</Label>
                                    <p className="text-xs text-slate-500">Help improve the app by sharing usage data.</p>
                                </div>
                                <Switch 
                                    checked={settings.collect_analytics}
                                    onCheckedChange={() => handleToggle("collect_analytics")}
                                />
                            </div>
                            
                            <div className="pt-4 border-t border-slate-100 flex gap-4">
                                <Button variant="outline" onClick={handleExportData}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export My Data
                                </Button>
                                <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Account
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}
