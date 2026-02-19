"use client";

import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { 
    Search, UserPlus, MoreVertical, Mail, Video, Phone, 
    AtSign, Shield, Zap, Globe, Filter, X 
} from "lucide-react";
import { Montserrat } from "next/font/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
    Dialog, DialogContent, DialogHeader, 
    DialogTitle, DialogTrigger, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { 
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
    DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { useSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/api";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["700", "800", "900"] });

export default function TeamPage() {
    const { data: currentUser } = useSWR("/users/me", fetcher);
    const { data: users, error, mutate } = useSWR("/users/", fetcher);
    const [searchQuery, setSearchQuery] = useState("");
    const [localPresence, setLocalPresence] = useState<Record<string, string>>({});
    const [inviteEmail, setInviteEmail] = useState("");
    const [isInviting, setIsInviting] = useState(false);

    // Socket Integration
    const { lastMessage } = useSocket("dashboard", currentUser?.id || "guest");

    useEffect(() => {
        if (!lastMessage) return;
        
        const { type, data } = lastMessage;
        
        if (type === "chat:presence") {
            setLocalPresence(prev => ({ ...prev, [data.user_id]: data.status }));
        } else if (type === "team:member_joined" || type === "team:member_updated" || type === "team:member_removed") {
            // Trigger SWR re-fetch for list changes
            mutate();
        }
    }, [lastMessage, mutate]);

    // Initial presence sync (could also fetch a bulk presence map)
    useEffect(() => {
        if (users) {
            const initial: Record<string, string> = {};
            users.forEach((u: any) => {
                if (u.status) initial[u.id] = u.status;
            });
            setLocalPresence(prev => ({ ...initial, ...prev }));
        }
    }, [users]);

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter((u: any) => 
            u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [users, searchQuery]);

    const getStatusConfig = (uid: string) => {
        const status = localPresence[uid] || "offline";
        switch (status) {
            case "available":
            case "online": 
                return { color: "bg-emerald-500", label: "Available", ping: true };
            case "busy":
            case "dnd": 
                return { color: "bg-red-500", label: "Busy", ping: false };
            case "away":
            case "brb": 
                return { color: "bg-amber-500", label: "Away", ping: false };
            default: 
                return { color: "bg-slate-300", label: "Offline", ping: false };
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail) return;
        setIsInviting(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://127.0.0.1:8000/invitations/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ email: inviteEmail })
            });
            
            if (res.ok) {
                const data = await res.json();
                setInviteEmail("");
                alert(data.message || "Invitation sent successfully");
            } else {
                const errorData = await res.json();
                alert(errorData.detail || "Failed to send invitation");
            }
        } catch (err) {
            console.error("Invitation error:", err);
            alert("A connection error occurred. Please try again.");
        } finally {
            setIsInviting(false);
        }
    };

    const handleRoleUpdate = async (userId: string, role: string) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://127.0.0.1:8000/users/${userId}/role`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ role })
            });
            if (res.ok) mutate();
        } catch (err) {
            console.error("Role update error:", err);
        }
    };

    const handleRevokeAccess = async (userId: string) => {
        if (!confirm("Are you sure you want to revoke this user's access?")) return;
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://127.0.0.1:8000/users/${userId}/access`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (res.ok) mutate();
        } catch (err) {
            console.error("Revoke access error:", err);
        }
    };

    if (error) return (
        <div className="h-[60vh] flex flex-col items-center justify-center text-slate-500">
            <Zap className="w-12 h-12 mb-4 text-red-400 opacity-20" />
            <p className="font-bold">Failed to load team data</p>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Enterprise Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-4">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                        <Globe className="w-3 h-3" /> Global Workspace
                    </div>
                    <h1 className={cn(montserrat.className, "text-5xl font-black text-slate-900 tracking-tight")}>
                        Team Members
                    </h1>
                    <p className="text-xl text-slate-500 font-medium max-w-2xl leading-relaxed">
                        Orchestrate your high-performance team operations and manage enterprise access.
                    </p>
                </div>
                
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-100 font-black text-lg transition-all hover:scale-[1.02] active:scale-95 group">
                            <UserPlus className="mr-3 h-5 w-5 group-hover:rotate-12 transition-transform" />
                            Invite Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md rounded-[2rem] border-slate-200 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className={cn(montserrat.className, "text-2xl font-black")}>Invite Collaborator</DialogTitle>
                            <DialogDescription className="font-medium text-slate-500 mt-2">
                                Send an enterprise workspace invitation to a new team member.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                                <div className="relative group">
                                    <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <Input 
                                        placeholder="colleague@company.com" 
                                        className="h-12 pl-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/40 font-medium"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="sm:justify-start">
                            <Button 
                                className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-xl font-bold gap-2"
                                onClick={handleInvite}
                                disabled={isInviting}
                            >
                                {isInviting ? "Sending..." : "Create Invitation"}
                                {!isInviting && <Zap className="w-4 h-4 fill-amber-400 text-amber-400" />}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filter Hub */}
            <div className="bg-white/40 backdrop-blur-xl p-4 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/20 flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                        placeholder="Filter by name, email, or role..."
                        className="h-14 pl-12 bg-white/50 border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/40 text-lg font-medium transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery("")}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    )}
                </div>
                <Button variant="outline" className="h-14 px-6 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 gap-2 font-bold whitespace-nowrap">
                    <Filter className="w-5 h-5" /> All Departments
                </Button>
            </div>

            {/* Live Member Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {!users ? (
                    Array(8).fill(0).map((_, i) => (
                        <div key={i} className="h-96 bg-slate-50 animate-pulse rounded-[2.5rem] border border-slate-100" />
                    ))
                ) : filteredUsers.map((member: any) => {
                    const status = getStatusConfig(member.id);
                    return (
                        <div key={member.id} className="group bg-white rounded-[2.5rem] border border-slate-200/60 shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:shadow-indigo-100/50 hover:border-indigo-200/50 transition-all duration-500 overflow-hidden flex flex-col items-center p-8 relative">
                            {/* Card Background Decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/30 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-100/40 transition-colors" />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="absolute top-6 right-6 h-10 w-10 text-slate-400 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-slate-50">
                                        <MoreVertical className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-2xl border-slate-100 shadow-xl">
                                    <DropdownMenuItem 
                                        onClick={() => handleRoleUpdate(member.id, "admin")}
                                        className="p-3 gap-3 font-medium cursor-pointer rounded-xl"
                                    >
                                        <Shield className="w-4 h-4 text-slate-400" /> Grant Admin Access
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                        onClick={() => handleRevokeAccess(member.id)}
                                        className="p-3 gap-3 font-medium text-red-600 cursor-pointer rounded-xl hover:bg-red-50 focus:bg-red-50"
                                    >
                                        <X className="w-4 h-4" /> Revoke Access
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Avatar className="h-32 w-32 border-[6px] border-white shadow-2xl relative z-10">
                                    <AvatarImage src={member.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`} />
                                    <AvatarFallback className="bg-slate-100 text-slate-400 font-bold text-2xl">
                                        {member.full_name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                
                                {/* Status Indicator */}
                                <div className={cn(
                                    "absolute bottom-2 right-2 h-7 w-7 rounded-full border-4 border-white z-20 shadow-lg",
                                    status.color
                                )}>
                                    {status.ping && (
                                        <span className="absolute inset-0 rounded-full bg-inherit animate-ping opacity-40" />
                                    )}
                                </div>
                            </div>

                            <div className="text-center space-y-2 mb-8 flex-1">
                                <h3 className={cn(montserrat.className, "text-2xl font-black text-slate-900 tracking-tight leading-none")}>
                                    {member.full_name}
                                </h3>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">{member.department || member.role || "Member"}</p>
                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <span className={cn("inline-block w-1.5 h-1.5 rounded-full", status.color)} />
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{status.label}</p>
                                </div>
                            </div>

                             <div className="grid grid-cols-3 gap-3 w-full">
                                <Button 
                                    variant="outline" 
                                    onClick={() => window.location.href = `mailto:${member.email}`}
                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 transition-all shadow-sm"
                                >
                                    <Mail className="h-5 w-5" />
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => window.location.href = `/dashboard/meetings?invite=${member.id}`}
                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 hover:bg-emerald-50 hover:border-emerald-100 hover:text-emerald-600 transition-all shadow-sm"
                                >
                                    <Video className="h-5 w-5" />
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => member.phone && (window.location.href = `tel:${member.phone}`)}
                                    disabled={!member.phone}
                                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 hover:bg-amber-50 hover:border-amber-100 hover:text-amber-600 transition-all shadow-sm disabled:opacity-30"
                                >
                                    <Phone className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>
                    );
                })}

                {/* Performance CTA Card */}
                <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200 flex flex-col justify-between group overflow-hidden relative">
                    <Zap className="absolute bottom-0 right-0 w-64 h-64 text-white/5 -mb-20 -mr-20 group-hover:scale-110 transition-transform duration-700" />
                    <div className="relative z-10">
                        <div className="h-14 w-14 bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center mb-8">
                            <Zap className="w-8 h-8 fill-amber-400 text-amber-400" />
                        </div>
                        <h3 className={cn(montserrat.className, "text-3xl font-black leading-tight mb-4")}>
                            Fuel Team<br />Collaboration
                        </h3>
                        <p className="text-indigo-100/60 font-medium leading-relaxed">
                            Unlock advanced AI metrics and automated activity tracking for your entire organization.
                        </p>
                    </div>
                    <Button className="w-full h-14 bg-white text-indigo-900 hover:bg-indigo-50 rounded-2xl font-black text-lg relative z-10 shadow-xl shadow-indigo-950/20">
                        Upgrade Workspace
                    </Button>
                </div>
            </div>
        </div>
    );
}
