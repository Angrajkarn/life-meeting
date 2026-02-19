"use client";

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
    Accessibility,
    Eye,
    Type,
    Zap,
    MessageSquare,
    Keyboard,
    Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api } from "@/lib/api";

export function AccessibilitySettings() {
    const { preferences, updatePreference } = useUserPreferences();
    const { accessibility } = preferences;

    const handleUpdate = async (key: string, value: any) => {
        // Optimistic update for nested object
        const newAccessibility = { ...accessibility, [key]: value };
        updatePreference("accessibility", newAccessibility);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Accessibility className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Accessibility</h2>
                        <p className="text-sm text-slate-500">Customize your experience to meet your specific needs.</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    {/* Vision */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="w-5 h-5" />
                                Vision
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>High Contrast Mode</Label>
                                    <p className="text-xs text-slate-500">Increase contrast for better visibility.</p>
                                </div>
                                <Switch 
                                    checked={accessibility.high_contrast}
                                    onCheckedChange={(checked) => handleUpdate("high_contrast", checked)}
                                />
                            </div>
                            
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="flex justify-between">
                                    <Label>Text Size Scaling</Label>
                                    <span className="text-sm font-mono text-slate-500">
                                        {(accessibility.font_scale * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <Slider 
                                    value={[accessibility.font_scale]}
                                    min={0.8}
                                    max={2.0}
                                    step={0.1}
                                    onValueChange={(val) => handleUpdate("font_scale", val[0])}
                                    className="w-full"
                                />
                                <div 
                                    className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                                    style={{ fontSize: `${accessibility.font_scale}rem` }}
                                >
                                    <p className="font-medium text-slate-900">The quick brown fox jumps over the lazy dog.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-[1fr_200px] items-center gap-4 pt-4 border-t border-slate-100">
                                <Label>Color Blindness Mode</Label>
                                <Select 
                                    value={accessibility.color_blindness_mode} 
                                    onValueChange={(val) => handleUpdate("color_blindness_mode", val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        <SelectItem value="protanopia">Red-Blind (Protanopia)</SelectItem>
                                        <SelectItem value="deuteranopia">Green-Blind (Deuteranopia)</SelectItem>
                                        <SelectItem value="tritanopia">Blue-Blind (Tritanopia)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Hearing */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                Hearing
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Live Captions</Label>
                                    <p className="text-xs text-slate-500">Automatically show captions in meetings.</p>
                                </div>
                                <Switch 
                                    checked={accessibility.captions_enabled}
                                    onCheckedChange={(checked) => handleUpdate("captions_enabled", checked)}
                                />
                            </div>

                             <div className="grid grid-cols-[1fr_200px] items-center gap-4 pt-4 border-t border-slate-100">
                                <Label>Caption Language</Label>
                                <Select 
                                    value={accessibility.caption_language} 
                                    onValueChange={(val) => handleUpdate("caption_language", val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="auto">Auto-Detect</SelectItem>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="es">Spanish</SelectItem>
                                        <SelectItem value="fr">French</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Interaction */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Keyboard className="w-5 h-5" />
                                Interaction
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Reduce Motion</Label>
                                    <p className="text-xs text-slate-500">Minimize animations and movement.</p>
                                </div>
                                <Switch 
                                    checked={accessibility.reduced_motion}
                                    onCheckedChange={(checked) => handleUpdate("reduced_motion", checked)}
                                />
                            </div>

                             <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <div className="space-y-0.5">
                                    <Label>Screen Reader Optimization</Label>
                                    <p className="text-xs text-slate-500">Simplify UI structure for screen readers.</p>
                                </div>
                                <Switch 
                                    checked={accessibility.screen_reader_optimized}
                                    onCheckedChange={(checked) => handleUpdate("screen_reader_optimized", checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}
