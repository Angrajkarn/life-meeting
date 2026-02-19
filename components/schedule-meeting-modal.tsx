"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Calendar, 
    Clock, 
    CheckCircle2, 
    Copy, 
    Link as LinkIcon, 
    Share2, 
    Check, 
    Mail, 
    Linkedin, 
    Twitter, 
    MessageCircle,
    Globe,
    Repeat,
    Users,
    X,
    Settings2,
    Lock
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { format, addHours, startOfHour } from "date-fns";
import { api } from "@/lib/api";

interface ScheduleMeetingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingMeeting?: any; // Added for edit mode
    onSuccess?: () => void; // Added to trigger refresh
}

const COMMON_TIMEZONES = [
    { label: "UTC (Coordinated Universal Time)", value: "UTC" },
    { label: "America/New_York (EST/EDT)", value: "America/New_York" },
    { label: "America/Los_Angeles (PST/PDT)", value: "America/Los_Angeles" },
    { label: "Europe/London (GMT/BST)", value: "Europe/London" },
    { label: "Asia/Kolkata (IST)", value: "Asia/Kolkata" },
    { label: "Asia/Singapore (SGT)", value: "Asia/Singapore" },
    { label: "Australia/Sydney (AEST/AEDT)", value: "Australia/Sydney" },
];

export function ScheduleMeetingModal({ open, onOpenChange, editingMeeting, onSuccess }: ScheduleMeetingModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [createdMeeting, setCreatedMeeting] = useState<any>(null);

    // Form State
    const [topic, setTopic] = useState("");
    const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [time, setTime] = useState(format(addHours(startOfHour(new Date()), 1), "HH:mm"));
    const [duration, setDuration] = useState("60");
    const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [recurrence, setRecurrence] = useState("none");
    const [attendeeEmail, setAttendeeEmail] = useState("");
    const [attendees, setAttendees] = useState<string[]>([]);
    
    // Meeting Settings
    const [settings, setSettings] = useState({
        waiting_room: false,
        mute_on_entry: true,
        allow_guest_join: true,
        camera_on_entry: false,
        visibility: "private"
    });

    // Pre-populate if editing
    useEffect(() => {
        if (editingMeeting && open) {
            setTopic(editingMeeting.title);
            const start = new Date(editingMeeting.start_time);
            const end = new Date(editingMeeting.end_time);
            setDate(format(start, "yyyy-MM-dd"));
            setTime(format(start, "HH:mm"));
            
            const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
            setDuration(durationMinutes.toString());
            
            if (editingMeeting.timezone) setTimezone(editingMeeting.timezone);
            if (editingMeeting.settings) setSettings({ ...settings, ...editingMeeting.settings });
            if (editingMeeting.attendees) {
                setAttendees(editingMeeting.attendees.map((a: any) => a.user_id));
            }
        } else if (!open) {
            // Reset on close if needed
        }
    }, [editingMeeting, open]);

    const addAttendee = () => {
        if (attendeeEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(attendeeEmail)) {
            if (!attendees.includes(attendeeEmail)) {
                setAttendees([...attendees, attendeeEmail]);
            }
            setAttendeeEmail("");
        } else {
            toast.error("Please enter a valid email address");
        }
    };

    const removeAttendee = (email: string) => {
        setAttendees(attendees.filter(a => a !== email));
    };

    const handleSave = async () => {
        if (!topic) {
            toast.error("Please enter a topic");
            return;
        }

        setIsLoading(true);
        try {
            const startDateTime = new Date(`${date}T${time}`);
            const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60000);

            const payload = {
                title: topic,
                description: "",
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                timezone: timezone,
                settings: settings,
                attendees: attendees.map(email => ({ user_id: email, role: "participant" })),
                recurrence: recurrence !== "none" ? { pattern: recurrence, interval: 1 } : null
            };

            let data;
            if (editingMeeting) {
                data = await api.patch(`/meetings/${editingMeeting.id}`, payload);
                toast.success("Meeting updated successfully");
                onSuccess?.();
                onOpenChange(false);
            } else {
                data = await api.post("/meetings/", payload);
                setCreatedMeeting(data);
                setIsSuccess(true);
                toast.success("Meeting scheduled successfully");
                onSuccess?.();
            }
        } catch (error) {
            console.error("Meeting save error:", error);
            toast.error(editingMeeting ? "Failed to update meeting" : "Failed to schedule meeting");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!createdMeeting) return;
        const link = `${window.location.origin}/meeting/${createdMeeting.code}`;
        navigator.clipboard.writeText(link);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast.success("Link copied to clipboard");
    };

    const resetForm = () => {
        setIsSuccess(false);
        setTopic("");
        setAttendees([]);
        setCreatedMeeting(null);
        setIsLoading(false);
    };

    const meetingLink = createdMeeting ? `${window.location.origin}/meeting/${createdMeeting.code}` : "";

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) resetForm();
            onOpenChange(val);
        }}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white rounded-2xl shadow-2xl border-0">
                {!isSuccess ? (
                    <div className="flex flex-col max-h-[90vh]">
                        <DialogHeader className="p-6 pb-2 border-b border-slate-50">
                            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                                {editingMeeting ? "Edit Meeting" : "Schedule Meeting"}
                            </DialogTitle>
                            <p className="text-sm text-slate-500 font-medium mt-1">
                                {editingMeeting ? "Update your enterprise collaboration session details." : "Configure your enterprise collaboration session."}
                            </p>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {/* Topic Section */}
                            <div className="space-y-2">
                                <Label htmlFor="topic" className="text-sm font-bold text-slate-700">Topic</Label>
                                <Input 
                                    id="topic" 
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. Q1 Quarterly Strategy Review" 
                                    className="h-12 text-lg border-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-xl" 
                                />
                            </div>

                            {/* Time & Date Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700">Date</Label>
                                    <div className="relative">
                                        <Input 
                                            type="date" 
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="h-11 pl-10 border-slate-200 rounded-xl" 
                                        />
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700">Time</Label>
                                    <div className="relative">
                                        <Input 
                                            type="time" 
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className="h-11 pl-10 border-slate-200 rounded-xl" 
                                        />
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Duration & Timezone */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700">Duration</Label>
                                    <Select value={duration} onValueChange={setDuration}>
                                        <SelectTrigger className="h-11 border-slate-200 rounded-xl">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="15">15 minutes</SelectItem>
                                            <SelectItem value="30">30 minutes</SelectItem>
                                            <SelectItem value="45">45 minutes</SelectItem>
                                            <SelectItem value="60">1 hour</SelectItem>
                                            <SelectItem value="90">1.5 hours</SelectItem>
                                            <SelectItem value="120">2 hours</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700">Timezone</Label>
                                    <Select value={timezone} onValueChange={setTimezone}>
                                        <SelectTrigger className="h-11 border-slate-200 rounded-xl">
                                            <div className="flex items-center gap-2 truncate">
                                                <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <SelectValue />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {COMMON_TIMEZONES.map(tz => (
                                                <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Recurrence */}
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700">Recurrence</Label>
                                <Select value={recurrence} onValueChange={setRecurrence}>
                                    <SelectTrigger className="h-11 border-slate-200 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <Repeat className="w-3.5 h-3.5 text-slate-400" />
                                            <SelectValue />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Does not repeat</SelectItem>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Attendees Section */}
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-slate-700">Attendees</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input 
                                            placeholder="Add participant by email..." 
                                            value={attendeeEmail}
                                            onChange={(e) => setAttendeeEmail(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addAttendee()}
                                            className="h-11 pl-10 border-slate-200 rounded-xl"
                                        />
                                    </div>
                                    <Button type="button" onClick={addAttendee} variant="outline" className="h-11 rounded-xl border-slate-200">
                                        Add
                                    </Button>
                                </div>
                                
                                {attendees.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {attendees.map(email => (
                                            <div key={email} className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">
                                                {email}
                                                <button onClick={() => removeAttendee(email)} className="hover:text-red-500 transition-colors">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Meeting Settings */}
                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-2 mb-4">
                                    <Settings2 className="w-4 h-4 text-indigo-500" />
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Security & Preferences</h4>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-bold">Waiting Room</Label>
                                            <p className="text-xs text-slate-500">Hold participants before host join</p>
                                        </div>
                                        <Switch 
                                            checked={settings.waiting_room}
                                            onCheckedChange={(val) => setSettings({...settings, waiting_room: val})}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-bold">Mute on Entry</Label>
                                            <p className="text-xs text-slate-500">Automatic microphone mute</p>
                                        </div>
                                        <Switch 
                                            checked={settings.mute_on_entry}
                                            onCheckedChange={(val) => setSettings({...settings, mute_on_entry: val})}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-bold">Visibility</Label>
                                            <p className="text-xs text-slate-500">{settings.visibility === 'private' ? 'Only invitees' : 'Domain-wide'}</p>
                                        </div>
                                        <Select 
                                            value={settings.visibility} 
                                            onValueChange={(val) => setSettings({...settings, visibility: val})}
                                        >
                                            <SelectTrigger className="h-8 w-24 border-slate-200 text-xs font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="private">Private</SelectItem>
                                                <SelectItem value="org">Org-wide</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-bold">Camera on Entry</Label>
                                            <p className="text-xs text-slate-500">Enable video by default</p>
                                        </div>
                                        <Switch 
                                            checked={settings.camera_on_entry}
                                            onCheckedChange={(val) => setSettings({...settings, camera_on_entry: val})}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="p-6 pt-4 bg-slate-50 flex flex-row gap-3 justify-end border-t border-slate-100">
                            <DialogClose asChild>
                                <Button variant="ghost" className="text-slate-500 hover:text-slate-700 font-bold">Cancel</Button>
                            </DialogClose>
                            <Button
                                onClick={handleSave}
                                disabled={isLoading}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xl shadow-indigo-100 min-w-[140px] h-11 rounded-xl"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>{editingMeeting ? "Updating..." : "Scheduling..."}</span>
                                    </div>
                                ) : (
                                    editingMeeting ? "Update Meeting" : "Schedule Meeting"
                                )}
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <div className="flex flex-col p-8 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-sm animate-in zoom-in-50 duration-500">
                                <CheckCircle2 className="w-10 h-10 stroke-[3]" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Meeting Confirmed!</h3>
                            <p className="text-slate-500 font-medium mt-1 max-w-[300px]">
                                Your meeting has been scheduled and synchronized with our presence engine.
                            </p>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 mb-8 space-y-4 shadow-inner">
                            <div>
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-2 block">Meeting Access Link</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            <LinkIcon className="w-4 h-4" />
                                        </div>
                                        <Input
                                            readOnly
                                            value={meetingLink}
                                            className="pl-9 h-12 bg-white border-slate-200 text-slate-600 font-medium rounded-xl select-all"
                                        />
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="shrink-0 h-12 w-12 bg-white border-slate-200 hover:bg-slate-50 rounded-xl"
                                        onClick={handleCopy}
                                    >
                                        {isCopied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 text-slate-500" />}
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-slate-100/50">
                                <div className="flex items-center gap-2">
                                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-xs font-bold text-slate-600">Meeting Code:</span>
                                    <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{createdMeeting?.code}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase text-slate-400 px-2" onClick={handleCopy}>
                                    Copy Code
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Button 
                                variant="outline" 
                                className="w-full h-12 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50" 
                                onClick={() => {
                                    resetForm();
                                    onOpenChange(false);
                                }}
                            >
                                Close
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xl shadow-indigo-100 rounded-xl gap-2">
                                        <Share2 className="w-4 h-4" />
                                        Share Invite
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 rounded-xl border-slate-100 shadow-2xl">
                                    <DropdownMenuLabel className="font-black text-slate-400 text-[10px] uppercase">One-Click Sharing</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="py-2.5 font-bold gap-3" onClick={() => window.open(`mailto:?subject=Meeting Invitation: ${topic}&body=Join the meeting here: ${meetingLink}`)}>
                                        <Mail className="w-4 h-4 text-rose-500" />
                                        <span>Email Invitation</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="py-2.5 font-bold gap-3" onClick={() => window.open(`https://wa.me/?text=Meeting Invitation: ${topic}. Join here: ${meetingLink}`)}>
                                        <MessageCircle className="w-4 h-4 text-emerald-500" />
                                        <span>WhatsApp Message</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="py-2.5 font-bold gap-3" onClick={handleCopy}>
                                        <Copy className="w-4 h-4 text-indigo-500" />
                                        <span>Copy Link to Clipboard</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div >
                )}
            </DialogContent>

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
        </Dialog>
    );
}
