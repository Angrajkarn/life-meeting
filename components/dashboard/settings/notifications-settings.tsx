"use client";

import { useUserPreferences } from "@/components/providers/user-preferences-provider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Bell, MessageSquare, Calendar, Mail, Moon, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function NotificationSettings() {
    const { preferences, updatePreference } = useUserPreferences();
    const { notifications } = preferences;

    // Helper to update nested notification settings
    const updatenotify = (section: keyof typeof notifications, key: string, value: any) => {
        const currentSection = notifications[section] as any;
        // Handle direct values or nested objects
        if (typeof currentSection === 'object' && currentSection !== null && !Array.isArray(currentSection)) {
             updatePreference("notifications", {
                ...notifications,
                [section]: {
                    ...currentSection,
                    [key]: value
                }
            });
        } else {
             updatePreference("notifications", {
                ...notifications,
                [section]: value
            });
        }
    };

    // Special helper for DND schedule which is deeper
    const updateDnd = (key: string, value: any) => {
        updatePreference("notifications", {
            ...notifications,
            dnd_schedule: {
                ...notifications.dnd_schedule,
                [key]: value
            }
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* EMAIL SECTION */}
            <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
                <div className="flex gap-4">
                    <Mail className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                    <div className="space-y-6 w-full">
                        <div className="space-y-1">
                            <h3 className="font-bold text-slate-900">Email</h3>
                            <p className="text-xs text-slate-400">Choose how often you want to receive emails about missed activity.</p>
                        </div>
                        
                        <RadioGroup 
                            value={notifications.email_frequency} 
                            onValueChange={(val) => updatePreference("notifications", { ...notifications, email_frequency: val })}
                            className="space-y-3"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="immediate" id="email-immediate" />
                                <Label htmlFor="email-immediate" className="font-medium">As soon as possible</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="daily" id="email-daily" />
                                <Label htmlFor="email-daily" className="font-medium">Once a day (Daily Digest)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="off" id="email-off" />
                                <Label htmlFor="email-off" className="font-medium">Off</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
            </section>

             {/* APPEARANCE / SOUND */}
             <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
                <div className="flex gap-4">
                    <Volume2 className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                    <div className="space-y-6 w-full">
                        <h3 className="font-bold text-slate-900">Appearance and Sound</h3>
                        
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                             <div className="space-y-0.5">
                                <h4 className="font-bold text-sm text-slate-900">Play sound for notifications</h4>
                                <p className="text-xs text-slate-500">Hear a sound when a new notification arrives</p>
                            </div>
                            <Switch 
                                checked={notifications.sound_enabled}
                                onCheckedChange={(checked) => updatePreference("notifications", { ...notifications, sound_enabled: checked })}
                                className="data-[state=checked]:bg-indigo-600"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                             <div className="space-y-0.5">
                                <h4 className="font-bold text-sm text-slate-900">Show message preview</h4>
                                <p className="text-xs text-slate-500">Show a preview of the message in the notification toast</p>
                            </div>
                            <Switch 
                                checked={notifications.show_previews}
                                onCheckedChange={(checked) => updatePreference("notifications", { ...notifications, show_previews: checked })}
                                className="data-[state=checked]:bg-indigo-600"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* CHAT SECTION */}
            <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
                <div className="flex gap-4">
                    <MessageSquare className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                    <div className="space-y-6 w-full">
                        <h3 className="font-bold text-slate-900">Chat</h3>
                        <div className="space-y-4">
                            {[
                                { key: 'chat', label: 'Chat messages', desc: 'Notify me when I receive a chat message' },
                                { key: 'mentions', label: 'Mentions (@)', desc: 'Notify me when I am mentioned' },
                                { key: 'reactions', label: 'Reactions', desc: 'Notify me when someone reacts to my message' }
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                    <div className="space-y-0.5">
                                        <h4 className="font-medium text-sm text-slate-900">{item.label}</h4>
                                        <p className="text-xs text-slate-500">{item.desc}</p>
                                    </div>
                                    <Switch 
                                        checked={notifications.messages[item.key as keyof typeof notifications.messages]}
                                        onCheckedChange={(checked) => updatenotify('messages', item.key, checked)}
                                        className="data-[state=checked]:bg-indigo-600"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* MEETINGS SECTION */}
            <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
                <div className="flex gap-4">
                    <Calendar className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                    <div className="space-y-6 w-full">
                        <h3 className="font-bold text-slate-900">Meetings</h3>
                        <div className="space-y-4">
                             {[
                                { key: 'start_alert', label: 'Meeting start', desc: 'Notify me when a meeting starts' },
                                { key: 'chat_in_meeting', label: 'Meeting chat', desc: 'Notify me of chats during meetings I am attending' },
                                { key: 'recording_ready', label: 'Recording ready', desc: 'Notify me when a meeting recording is ready' }
                            ].map((item) => (
                                <div key={item.key} className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                                    <div className="space-y-0.5">
                                        <h4 className="font-medium text-sm text-slate-900">{item.label}</h4>
                                        <p className="text-xs text-slate-500">{item.desc}</p>
                                    </div>
                                    <Switch 
                                        checked={notifications.meetings[item.key as keyof typeof notifications.meetings]}
                                        onCheckedChange={(checked) => updatenotify('meetings', item.key, checked)}
                                        className="data-[state=checked]:bg-indigo-600"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

             {/* DO NOT DISTURB */}
             <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
                <div className="flex gap-4">
                    <Moon className="w-5 h-5 text-slate-400 shrink-0 mt-1" />
                    <div className="space-y-6 w-full">
                        <div className="flex justify-between items-start">
                             <div className="space-y-1">
                                <h3 className="font-bold text-slate-900">Quiet Hours</h3>
                                <p className="text-xs text-slate-400">Automatically mute notifications during specific hours.</p>
                            </div>
                            <Switch 
                                checked={notifications.dnd_schedule.enabled}
                                onCheckedChange={(checked) => updateDnd('enabled', checked)}
                                className="data-[state=checked]:bg-indigo-600"
                            />
                        </div>
                        
                        {notifications.dnd_schedule.enabled && (
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-2">
                                    <Label>Start Time</Label>
                                    <Select 
                                        value={notifications.dnd_schedule.start_time}
                                        onValueChange={(val) => updateDnd('start_time', val)}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Array.from({length: 24}).map((_, i) => (
                                                <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                                                    {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i-12}:00 PM`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>End Time</Label>
                                    <Select 
                                         value={notifications.dnd_schedule.end_time}
                                         onValueChange={(val) => updateDnd('end_time', val)}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Array.from({length: 24}).map((_, i) => (
                                                <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                                                    {i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i-12}:00 PM`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2 pt-2">
                                   <p className="text-xs text-slate-500">
                                       Active on: Mon, Tue, Wed, Thu, Fri
                                   </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
