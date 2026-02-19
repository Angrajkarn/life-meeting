"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
    Filter,
    MoreHorizontal,
    Video,
    SquarePen,
    ChevronDown,
    ChevronRight,
    Search,
    Pin,
    Trash2,
    BellOff,
    Clock,
    X,
    UserPlus,
    MessageSquare,
    Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/api";
import { useSocket } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { mutate } from "swr";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: user } = useSWR('/users/me', fetcher);
    const { data: channels } = useSWR('/chat/channels', fetcher);
    const { data: presence } = useSWR('/chat/presence', fetcher);
    const [searchQuery, setSearchQuery] = useState("");
    const [isInviting, setIsInviting] = useState(false);
    const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [isSendingInvite, setIsSendingInvite] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState("");
    const { data: allUsers } = useSWR(isNewMessageModalOpen ? '/users' : null, fetcher);
    const [expandedSections, setExpandedSections] = useState({
        recent: true,
        contacts: false
    });
    const [isMeetNowModalOpen, setIsMeetNowModalOpen] = useState(false);
    const [meetingName, setMeetingName] = useState("");
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'pinned' | 'muted'>('all');
    const [isStartingMeeting, setIsStartingMeeting] = useState(false);

    const toggleSection = (section: 'recent' | 'contacts') => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Presence State Management
    const [localPresence, setLocalPresence] = useState<Record<string, string>>({});
    
    // Merge SWR presence into local state
    useEffect(() => {
        if (presence) {
            setLocalPresence(prev => ({ ...presence, ...prev }));
        }
    }, [presence]);

    // WebSocket Presence Hub
    const { lastMessage } = useSocket("dashboard", user?.id);

    useEffect(() => {
        if (lastMessage?.type === "chat:presence") {
            const { user_id, status } = lastMessage.data;
            setLocalPresence(prev => ({
                ...prev,
                [user_id]: status
            }));
        } else if (lastMessage?.type === "chat:status_message") {
            // Re-fetch channels or users to get updated status messages
            mutate('/chat/channels');
            mutate('/users');
        }
    }, [lastMessage]);

    const getPresenceColor = (uid: string) => {
        const status = localPresence[uid] || "offline";
        switch (status) {
            case "available":
            case "online": return "bg-emerald-500";
            case "busy":
            case "dnd": return "bg-red-500";
            case "away":
            case "brb": return "bg-amber-500";
            default: return "bg-slate-400";
        }
    };

    const filteredChannels = channels?.filter((c: any) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
            c.name?.toLowerCase().includes(query) ||
            c.last_message?.toLowerCase().includes(query)
        );

        if (!matchesSearch) return false;

        if (activeFilter === 'unread') return c.unread_users?.includes(user?.id);
        if (activeFilter === 'pinned') return c.pinned_users?.includes(user?.id);
        if (activeFilter === 'muted') return c.muted_users?.includes(user?.id);

        return true;
    }) || [];

    const handleStartMeetNow = async () => {
        if (!meetingName.trim()) {
            toast.error("Please enter a meeting name");
            return;
        }
        setIsStartingMeeting(true);
        try {
            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later
            
            const res = await api.post('/meetings', {
                title: meetingName,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                type: 'video',
                settings: {
                    waiting_room: false,
                    mute_on_entry: false,
                    allow_guest_join: true
                }
            });
            
            toast.success("Meeting started!");
            setIsMeetNowModalOpen(false);
            setMeetingName("");
            
            // Navigate to meeting lobby or room
            window.location.href = `/meeting/${res.id}`;
        } catch (err: any) {
            toast.error(err.message || "Failed to start meeting");
        } finally {
            setIsStartingMeeting(false);
        }
    };

    const handleGetMeetingLink = async () => {
        if (!meetingName.trim()) {
            toast.error("Please enter a meeting name");
            return;
        }
        setIsStartingMeeting(true);
        try {
            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
            
            const res = await api.post('/meetings', {
                title: meetingName,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                type: 'video',
                settings: {
                    waiting_room: false,
                    mute_on_entry: false,
                    allow_guest_join: true
                }
            });
            
            const meetingLink = `${window.location.origin}/meeting/${res.id}`;
            await navigator.clipboard.writeText(meetingLink);
            toast.success("Meeting link copied to clipboard!");
            setIsMeetNowModalOpen(false);
            setMeetingName("");
        } catch (err: any) {
            toast.error(err.message || "Failed to create meeting link");
        } finally {
            setIsStartingMeeting(false);
        }
    };

    const highlightText = (text: string, query: string) => {
        if (!query || !text) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) => 
                    part.toLowerCase() === query.toLowerCase() ? (
                        <span key={i} className="bg-indigo-100 text-indigo-700 rounded-sm px-0.5">{part}</span>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    const handleInvite = async () => {
        if (!inviteEmail) return;
        setIsSendingInvite(true);
        try {
            await api.post('/chat/invite', { email: inviteEmail });
            toast.success("Invitation sent to " + inviteEmail);
            setInviteEmail("");
            setIsInviting(false);
        } catch (err) {
            toast.error("Failed to send invitation");
        } finally {
            setIsSendingInvite(false);
        }
    };

    const handleChannelAction = async (channelId: string, action: 'pin' | 'mute' | 'unread') => {
        try {
            await api.post(`/chat/channels/${channelId}/${action}`, {});
            toast.success(`Channel status updated`);
            mutate('/chat/channels');
        } catch (err) {
            toast.error(`Failed to update channel status`);
        }
    };

    const handleDeleteChannel = async (channelId: string) => {
        if (!confirm("Are you sure you want to delete this conversation? This will delete all messages for everyone.")) return;
        try {
            await api.delete(`/chat/channels/${channelId}`);
            toast.success("Conversation deleted");
            mutate('/chat/channels');
        } catch (err) {
            toast.error("Failed to delete conversation");
        }
    };

    return (
        <div className="flex h-full overflow-hidden bg-white">
            {/* SECONDARY SIDEBAR: CHAT HUB */}
            <div className="w-[350px] border-r border-slate-200 flex flex-col bg-slate-50/30">
                {/* HUB HEADER */}
                <div className="p-4 border-b border-slate-100 bg-white shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Chat</h1>
                        <div className="flex items-center gap-1">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className={cn(
                                        "h-8 w-8 transition-colors",
                                        activeFilter !== 'all' ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600"
                                    )}>
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-2 rounded-2xl shadow-2xl border-slate-200 bg-white" align="end" sideOffset={8}>
                                    <div className="flex flex-col gap-1">
                                        <p className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50/50 rounded-lg mb-1">Filter Chats</p>
                                        {[
                                            { id: 'all', label: 'All Messages' },
                                            { id: 'unread', label: 'Unread' },
                                            { id: 'pinned', label: 'Pinned' },
                                            { id: 'muted', label: 'Muted' }
                                        ].map((filter) => (
                                            <button
                                                key={filter.id}
                                                onClick={() => setActiveFilter(filter.id as any)}
                                                className={cn(
                                                    "flex items-center w-full px-2 py-2 text-xs font-medium rounded-xl transition-all",
                                                    activeFilter === filter.id 
                                                        ? "bg-indigo-50 text-indigo-600" 
                                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                )}
                                            >
                                                {filter.label}
                                                {activeFilter === filter.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                                            </button>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <Dialog open={isMeetNowModalOpen} onOpenChange={setIsMeetNowModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600">
                                        <Video className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[400px] p-0 border-none overflow-hidden rounded-3xl shadow-2xl">
                                    <DialogHeader className="sr-only">
                                        <DialogTitle>Meet Now</DialogTitle>
                                        <DialogDescription>Start a quick video meeting</DialogDescription>
                                    </DialogHeader>
                                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 text-white">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h2 className="text-2xl font-black tracking-tight">Meet Now</h2>
                                                <p className="text-indigo-100/80 text-sm mt-1">Start a quick video meeting</p>
                                            </div>
                                            <div className="h-12 w-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                                <Video className="h-6 w-6" />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-200/60 ml-1">Meeting Name</label>
                                                <Input 
                                                    placeholder="e.g. Quick Catch-up"
                                                    value={meetingName}
                                                    onChange={(e) => setMeetingName(e.target.value)}
                                                    className="bg-white/10 border-white/10 text-white placeholder:text-white/40 h-12 rounded-xl focus:ring-offset-0 focus:ring-white/20 text-lg transition-all"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleStartMeetNow()}
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Button 
                                                    onClick={handleGetMeetingLink}
                                                    disabled={isStartingMeeting}
                                                    variant="secondary"
                                                    className="w-full h-12 bg-white/10 hover:bg-white/20 border-white/20 text-white rounded-xl font-bold transition-all"
                                                >
                                                    Get a link to share
                                                </Button>
                                                <Button 
                                                    onClick={handleStartMeetNow} 
                                                    disabled={isStartingMeeting}
                                                    className="w-full h-14 bg-white text-indigo-600 hover:bg-indigo-50 rounded-2xl font-black text-lg shadow-xl shadow-indigo-900/20 active:scale-95 transition-all"
                                                >
                                                    {isStartingMeeting ? "Creating..." : "Start Meeting"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 flex items-center gap-3">
                                        <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm">
                                            <Filter className="h-4 w-4" />
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">No schedule needed. Join instantly.</p>
                                    </div>
                                </DialogContent>
                            </Dialog>

                            <Dialog open={isNewMessageModalOpen} onOpenChange={setIsNewMessageModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-indigo-600">
                                        <SquarePen className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle className="text-xl font-bold">New Message</DialogTitle>
                                        <DialogDescription className="text-slate-500">
                                            Start a conversation with anyone in your workspace.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4 space-y-4">
                                        <div className="relative group">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500" />
                                            <Input 
                                                placeholder="Type a name or email" 
                                                value={userSearchQuery}
                                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                                className="pl-9 h-11 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-indigo-500"
                                            />
                                        </div>
                                        <ScrollArea className="h-[250px] pr-4">
                                            <div className="space-y-1">
                                                {allUsers?.filter((u: any) => 
                                                    u.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                                    u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
                                                ).map((u: any) => (
                                                    <div 
                                                        key={u.id} 
                                                        className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                                                        onClick={async () => {
                                                            try {
                                                                const res = await api.post('/chat/channels', {
                                                                    name: u.full_name,
                                                                    type: 'dm',
                                                                    members: [user.id, u.id]
                                                                });
                                                                setIsNewMessageModalOpen(false);
                                                                // Navigate to new channel
                                                                window.location.href = `/dashboard/chat/${res.id}`;
                                                            } catch (err) {
                                                                toast.error("Failed to start conversation");
                                                            }
                                                        }}
                                                    >
                                                        <div className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-slate-600 transition-colors group-hover:bg-indigo-100 group-hover:text-indigo-600">
                                                            {u.full_name?.[0]?.toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-slate-900 truncate">{u.full_name}</p>
                                                            <p className="text-xs text-slate-500 truncate">{u.email}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                    
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <Input 
                            placeholder="Search chats" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-8 bg-slate-100 border-none h-9 text-sm focus-visible:ring-1 focus-visible:ring-indigo-500 transition-all rounded-lg"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                </div>

                {/* SCROLLABLE LIST */}
                <ScrollArea className="flex-1">
                    <div className="py-2">
                        {/* RECENT SECTION */}
                        <div className="mb-2">
                            <div 
                                className="flex items-center px-4 py-1.5 cursor-pointer group transition-colors"
                                onClick={() => toggleSection('recent')}
                            >
                                {expandedSections.recent ? <ChevronDown className="h-3.5 w-3.5 text-slate-400 mr-1" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400 mr-1" />}
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Recent</span>
                            </div>

                            {expandedSections.recent && (
                                <div className="mt-1">
                                    {filteredChannels.map((channel: any) => {
                                        const isActive = pathname === `/dashboard/chat/${channel.id}`;
                                        
                                        // Robustly find the OTHER user ID in a DM
                                        let otherUserId = null;
                                        if (channel.type === 'dm' && user?.id) {
                                            otherUserId = channel.members.find((m: string) => m !== user.id);
                                        } else if (channel.type === 'dm') {
                                            // Fallback if user profile not yet loaded - look for any member that isn't null
                                            // This is a temporary guest state until SWR resolves 'user'
                                            otherUserId = channel.members.find((m: string) => m !== null);
                                        }
                                        
                                        return (
                                            <Link key={channel.id} href={`/dashboard/chat/${channel.id}`}>
                                                <div className={cn(
                                                    "px-3 py-3 flex items-start gap-3 transition-all relative cursor-pointer group/item",
                                                    isActive 
                                                        ? "bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] z-10 before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:bg-indigo-600 before:rounded-r-md" 
                                                        : "hover:bg-white/50"
                                                )}>
                                                    {/* AVATAR WITH PRESENCE */}
                                                    <div className="relative shrink-0">
                                                        <div className={cn(
                                                            "h-11 w-11 rounded-xl flex items-center justify-center text-lg font-semibold text-white",
                                                            isActive ? "bg-indigo-600" : "bg-slate-300"
                                                        )}>
                                                            {channel.name?.[0]?.toUpperCase() || "C"}
                                                        </div>
                                                        <div className={cn(
                                                            "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-50",
                                                            getPresenceColor(otherUserId)
                                                        )} />
                                                    </div>

                                                    {/* MESSAGE PREVIEW */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-0.5">
                                                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                                <span className={cn(
                                                                    "text-[14px] font-semibold truncate",
                                                                    isActive ? "text-slate-900" : "text-slate-700"
                                                                )}>
                                                                    {channel.type === 'dm' 
                                                                        ? highlightText(channel.member_details?.find((m: any) => m.id !== user?.id)?.full_name || channel.name, searchQuery)
                                                                        : highlightText(channel.name || "Unnamed Chat", searchQuery)}
                                                                </span>
                                                                {channel.pinned_users?.includes(user?.id) && <Pin className="h-2.5 w-2.5 text-indigo-500 fill-indigo-500 shrink-0" />}
                                                                {channel.muted_users?.includes(user?.id) && <BellOff className="h-2.5 w-2.5 text-slate-400 shrink-0" />}
                                                            </div>

                                                            <div className="flex items-center gap-1 shrink-0 ml-2 group-hover/item:opacity-0 transition-opacity duration-200">
                                                                {channel.unread_users?.includes(user?.id) && (
                                                                    <div className="h-2 w-2 rounded-full bg-indigo-600 mr-1" />
                                                                )}
                                                                {channel.type === 'dm' ? (
                                                                    localPresence[otherUserId || ""] === "online" 
                                                                        ? <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Online</span>
                                                                        : <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                                            {channel.last_message_at 
                                                                                ? formatDistanceToNow(new Date(channel.last_message_at), { addSuffix: true }) 
                                                                                : (channel.created_at ? formatDistanceToNow(new Date(channel.created_at), { addSuffix: true }) : "12m ago")}
                                                                          </span>
                                                                ) : (
                                                                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                                        {channel.last_message_at 
                                                                            ? formatDistanceToNow(new Date(channel.last_message_at), { addSuffix: true }) 
                                                                            : (channel.created_at ? formatDistanceToNow(new Date(channel.created_at), { addSuffix: true }) : "12m ago")}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-[12px] text-slate-500 truncate italic pr-6 flex-1">
                                                                {channel.last_message ? highlightText(channel.last_message, searchQuery) : "Draft"}
                                                            </p>
                                                            
                                                            {/* HOVER ACTIONS (3-DOT MENU) */}
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-all z-20">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                                                                        <button className="h-7 w-7 rounded-lg bg-white/80 backdrop-blur-sm border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all hover:scale-110">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="w-48 rounded-2xl shadow-xl border-slate-100 p-1.5 animate-in fade-in zoom-in-95 duration-200">
                                                                        <DropdownMenuLabel className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400">Manage Chat</DropdownMenuLabel>
                                                                        <DropdownMenuItem 
                                                                            className="rounded-xl py-2 px-2.5 gap-2.5 focus:bg-indigo-50 focus:text-indigo-600 cursor-pointer"
                                                                            onClick={(e) => { e.preventDefault(); handleChannelAction(channel.id, 'pin'); }}
                                                                        >
                                                                            <Pin className={cn("h-3.5 w-3.5", channel.pinned_users?.includes(user?.id) && "fill-current")} /> {channel.pinned_users?.includes(user?.id) ? "Unpin Chat" : "Pin Chat"}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem 
                                                                            className="rounded-xl py-2 px-2.5 gap-2.5 focus:bg-indigo-50 focus:text-indigo-600 cursor-pointer"
                                                                            onClick={(e) => { e.preventDefault(); handleChannelAction(channel.id, 'unread'); }}
                                                                        >
                                                                            <Clock className="h-3.5 w-3.5" /> {channel.unread_users?.includes(user?.id) ? "Mark as Read" : "Mark as Unread"}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem 
                                                                            className="rounded-xl py-2 px-2.5 gap-2.5 focus:bg-indigo-50 focus:text-indigo-600 cursor-pointer"
                                                                            onClick={(e) => { e.preventDefault(); handleChannelAction(channel.id, 'mute'); }}
                                                                        >
                                                                            <BellOff className={cn("h-3.5 w-3.5", channel.muted_users?.includes(user?.id) && "fill-current")} /> {channel.muted_users?.includes(user?.id) ? "Unmute Notifications" : "Mute Notifications"}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator className="my-1 bg-slate-50" />
                                                                        <DropdownMenuItem 
                                                                            className="rounded-xl py-2 px-2.5 gap-2.5 text-red-500 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                                                                            onClick={(e) => { e.preventDefault(); handleDeleteChannel(channel.id); }}
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" /> Delete Chat
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                    {filteredChannels.length === 0 && (
                                        <div className="px-8 py-10 text-center">
                                            <p className="text-xs text-slate-400">No recent conversations found</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* CONTACTS / ALL USERS SECTION */}
                        <div className="mb-2">
                            <div 
                                className="flex items-center px-4 py-1.5 cursor-pointer group transition-colors"
                                onClick={() => toggleSection('contacts')}
                            >
                                {expandedSections.contacts ? <ChevronDown className="h-3.5 w-3.5 text-slate-400 mr-1" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400 mr-1" />}
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Workspace Members</span>
                            </div>

                            {expandedSections.contacts && (
                                <div className="mt-1 pb-4">
                                    {allUsers?.map((u: any) => (
                                        <div 
                                            key={u.id}
                                            className="px-4 py-2 flex items-center gap-3 hover:bg-white/50 cursor-pointer transition-all animate-in fade-in slide-in-from-left-2 duration-300"
                                            onClick={async () => {
                                                try {
                                                    const res = await api.post('/chat/channels', {
                                                        name: u.full_name,
                                                        type: 'dm',
                                                        members: [user.id, u.id]
                                                    });
                                                    window.location.href = `/dashboard/chat/${res.id}`;
                                                } catch (err) {
                                                    toast.error("Failed to start conversation");
                                                }
                                            }}
                                        >
                                            <div className="relative shrink-0">
                                                <div className="h-9 w-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">
                                                    {u.full_name?.[0]?.toUpperCase()}
                                                </div>
                                                <div className={cn(
                                                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-50",
                                                    getPresenceColor(u.id)
                                                )} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] font-semibold text-slate-700 truncate">{u.full_name}</p>
                                                <p className="text-[10px] text-slate-400 truncate tracking-tight">{u.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!allUsers || allUsers.length === 0) && (
                                        <div className="px-8 py-4 text-center">
                                            <p className="text-[10px] text-slate-400 italic">No other members found</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                {/* HUB FOOTER */}
                <div className="p-4 border-t border-slate-100 bg-white">
                    <Dialog open={isInviting} onOpenChange={setIsInviting}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-50 py-5">
                                <UserPlus className="h-4 w-4 mr-2.5 text-indigo-500" />
                                Invite to Workspace
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">Invite a Teammate</DialogTitle>
                                <DialogDescription className="text-slate-500">
                                    Send an invitation to join your workspace and start collaborating.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                                    <Input 
                                        placeholder="colleague@example.com" 
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="h-11 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button 
                                    onClick={handleInvite} 
                                    disabled={isSendingInvite || !inviteEmail}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 rounded-xl shadow-lg shadow-indigo-100"
                                >
                                    {isSendingInvite ? "Sending..." : "Send Invitation"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* MAIN CHAT AREA */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                {children}
            </div>
        </div>
    );
}
