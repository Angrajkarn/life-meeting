"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Calendar, Video, Clock, Users, Settings, Plus, LogOut, VideoIcon, CalendarPlus, Keyboard, MessageSquare, Hash, ChevronDown, ChevronRight, Circle } from "lucide-react";
import { Montserrat } from "next/font/google";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/api";
import { useSocket } from "@/lib/socket";
import { ScheduleMeetingModal } from "@/components/schedule-meeting-modal";
import { Logo } from "@/components/logo";

const montserrat = Montserrat({ weight: "600", subsets: ["latin"] });

const routes = [
    {
        label: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
        color: "text-sky-500",
    },
    {
        label: "Upcoming",
        icon: Calendar,
        href: "/dashboard/upcoming",
        color: "text-violet-500",
    },
    {
        label: "Chat",
        icon: MessageSquare,
        href: "/dashboard/chat",
        color: "text-pink-700",
    },
    {
        label: "History",
        icon: Clock,
        href: "/dashboard/history",
        color: "text-orange-700",
    },
    {
        label: "Team",
        icon: Users,
        href: "/dashboard/team",
        color: "text-emerald-500",
    },
    {
        label: "Settings",
        icon: Settings,
        href: "/dashboard/settings",
    },
];

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { mutate } = useSWRConfig();
    const [isScheduling, setIsScheduling] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [joinId, setJoinId] = useState("");
    const [isJoining, setIsJoining] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        chat: true,
        teams: true,
        dms: true,
        meetings: true
    });

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const { data: user } = useSWR('/users/me', fetcher);
    const { data: channels } = useSWR('/chat/channels', fetcher);
    const { data: presenceData } = useSWR('/chat/presence', fetcher); 
    const [localPresence, setLocalPresence] = useState<Record<string, string>>({});

    // Sync SWR presence to local
    useEffect(() => {
        if (presenceData) setLocalPresence(presenceData);
    }, [presenceData]);

    // WebSocket Integration
    const { lastMessage } = useSocket("dashboard", user?.id || "guest");

    useEffect(() => {
        if (lastMessage?.type === "chat:presence") {
            const { user_id, status } = lastMessage.data;
            setLocalPresence(prev => ({ ...prev, [user_id]: status }));
        } else if (lastMessage?.type === "chat:status_message") {
            mutate('/users/me');
            mutate('/chat/presence');
        }
    }, [lastMessage, mutate]);

    const getPresenceColor = (uid: string) => {
        const status = localPresence[uid] || "offline";
        switch (status) {
            case "available":
            case "online": return "text-emerald-500 fill-emerald-500";
            case "busy":
            case "dnd": return "text-red-500 fill-red-500";
            case "away":
            case "brb": return "text-amber-500 fill-amber-500";
            default: return "text-slate-400 fill-slate-400";
        }
    };

    const handleStartInstant = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/meetings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: "Instant Meeting",
                    type: "instant",
                    startTime: new Date(),
                }),
            });

            if (res.ok) {
                const meeting = await res.json();
                await mutate('/api/meetings');
                router.push(`/meeting/${meeting.id}?join=1`);
            }
        } catch (error) {
            console.error("Failed to start meeting", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cn("pb-12 min-h-screen border-r bg-white space-y-4 py-4 flex flex-col h-full", className)}>
            <div className="px-3 py-2 flex-1">
                <Link href="/dashboard" className="flex items-center pl-3 mb-14">
                    <Logo showText={true} />
                </Link>

                <div className="px-3 mb-8">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]">
                                <Plus className="mr-2 h-5 w-5" />
                                New Meeting
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-60" sideOffset={10}>
                            <DropdownMenuLabel>Create Meeting</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleStartInstant} disabled={isLoading} className="cursor-pointer py-3">
                                <VideoIcon className="mr-3 h-5 w-5 text-indigo-500" />
                                <span>Start an instant meeting</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setIsScheduling(true)} className="cursor-pointer py-3">
                                <CalendarPlus className="mr-3 h-5 w-5 text-indigo-500" />
                                <span>Schedule for later</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setIsJoining(true)} className="cursor-pointer py-3">
                                <Keyboard className="mr-3 h-5 w-5 text-slate-500" />
                                <span>Join via ID...</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Schedule Dialog */}
                    <ScheduleMeetingModal open={isScheduling} onOpenChange={setIsScheduling} />

                    {/* Join ID Dialog */}
                    <Dialog open={isJoining} onOpenChange={setIsJoining}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Join Meeting</DialogTitle>
                                <DialogDescription>
                                    Enter the meeting ID or code to join.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="joinId" className="text-right">ID</Label>
                                    <Input
                                        id="joinId"
                                        value={joinId}
                                        onChange={(e) => setJoinId(e.target.value)}
                                        placeholder="abc-123-xyz"
                                        className="col-span-3"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => router.push(`/meeting/${joinId}?join=1`)} disabled={!joinId}>
                                    Join Now
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="px-3">
                    <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-slate-400 uppercase">Menu</h2>
                    <div className="space-y-1">
                        {routes.slice(0, 2).map((route) => (
                            <Link key={route.href} href={route.href}>
                                <div className={cn(
                                    "flex items-center flex-1 w-full px-3 py-2 rounded-lg transition-all group cursor-pointer",
                                    pathname === route.href ? "bg-slate-100 text-indigo-600 font-medium" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                )}>
                                    <route.icon className={cn("h-4 w-4 mr-3", route.color)} />
                                    <span className="text-sm">{route.label}</span>
                                </div>
                            </Link>
                        ))}

                        {routes.slice(2).map((route) => (
                            <Link key={route.href} href={route.href}>
                                <div className={cn(
                                    "flex items-center flex-1 w-full px-3 py-2 rounded-lg transition-all group cursor-pointer",
                                    pathname === route.href ? "bg-slate-100 text-indigo-600 font-medium" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                )}>
                                    <route.icon className={cn("h-4 w-4 mr-3", route.color)} />
                                    <span className="text-sm">{route.label}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

            </div>

        </div>
    );
}
