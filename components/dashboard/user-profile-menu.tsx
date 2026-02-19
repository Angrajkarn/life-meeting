"use client";

import { useState, useEffect } from "react";
import { 
    Check, 
    ChevronRight, 
    LogOut, 
    User, 
    ExternalLink, 
    Pencil,
    Circle,
    MinusCircle,
    Clock,
    XCircle,
    RotateCcw,
    Settings
} from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import useSWR from "swr";
import { fetcher, api } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
    { id: "available", label: "Available", icon: Circle, color: "text-emerald-500 fill-emerald-500", showCheck: true },
    { id: "busy", label: "Busy", icon: Circle, color: "text-red-500 fill-red-500" },
    { id: "dnd", label: "Do not disturb", icon: MinusCircle, color: "text-red-500", hasDash: true },
    { id: "brb", label: "Be right back", icon: Clock, color: "text-amber-500" },
    { id: "away", label: "Appear away", icon: Clock, color: "text-amber-500" },
    { id: "offline", label: "Appear offline", icon: XCircle, color: "text-slate-400" },
];

export function UserProfileMenu() {
    const router = useRouter();
    const { data: user, mutate } = useSWR('/users/me', fetcher);
    const [isEditingStatus, setIsEditingStatus] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        // Only set statusMessage if it's currently empty or we're not editing
        if (!isEditingStatus) {
            setStatusMessage(user?.status_message || "");
        }
    }, [user?.status_message, isEditingStatus]);

    const handleStatusChange = async (statusId: string) => {
        try {
            await api.put("/users/me/presence", { status: statusId });
            mutate({ ...user, status: statusId }, false);
            toast.success(`Status updated to ${statusId}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const handleSaveStatusMessage = async (msgOverride?: string) => {
        setIsUpdating(true);
        const finalMessage = msgOverride !== undefined ? msgOverride : statusMessage;
        try {
            await api.put("/users/me/status-message", { message: finalMessage });
            mutate({ ...user, status_message: finalMessage }, false);
            setIsEditingStatus(false);
            if (msgOverride === "") {
                toast.success("Status message cleared");
            } else {
                toast.success("Status message updated");
            }
        } catch (error) {
            toast.error("Failed to update status message");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleResetStatus = async () => {
        setIsUpdating(true);
        try {
            // Revert to available and clear message
            await Promise.all([
                api.put("/users/me/presence", { status: "available" }),
                api.put("/users/me/status-message", { message: "" })
            ]);
            mutate({ ...user, status: "available", status_message: "" }, false);
            setStatusMessage("");
            toast.success("Status reset to Available");
        } catch (error) {
            toast.error("Failed to reset status");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem("token");
        router.push("/auth/login");
        toast.success("Signed out successfully");
    };

    const currentStatus = STATUS_OPTIONS.find(s => s.id === user?.status) || STATUS_OPTIONS[0];

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="flex items-center gap-3 group outline-none">
                    <div className="relative">
                        <Avatar className="h-9 w-9 border border-slate-200 group-hover:border-indigo-200 transition-all">
                            <AvatarImage src={user?.avatar || "https://github.com/shadcn.png"} alt="Avatar" />
                            <AvatarFallback>{user?.full_name?.[0] || "U"}</AvatarFallback>
                        </Avatar>
                        <div className={cn(
                            "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white flex items-center justify-center shadow-sm",
                            currentStatus.color.replace("text-", "bg-").split(" ")[0]
                        )}>
                            {currentStatus.id === "available" && <Check className="h-2 w-2 text-white" />}
                            {currentStatus.id === "dnd" && <div className="h-0.5 w-1.5 bg-white rounded-full" />}
                            {(currentStatus.id === "away" || currentStatus.id === "brb") && <Clock className="h-2.5 w-2.5 text-white" />}
                            {currentStatus.id === "offline" && <XCircle className="h-2.5 w-2.5 text-white" />}
                        </div>
                    </div>
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 mr-4 mt-2 bg-white/95 backdrop-blur-md border-slate-200 shadow-2xl rounded-2xl overflow-hidden" align="end">
                {/* Header Section */}
                <div className="p-4 border-b border-slate-100/50">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PERSONAL</span>
                        <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-slate-500 hover:text-indigo-600 h-6 px-1 text-[10px] font-bold uppercase tracking-wider transition-colors">
                            Sign out
                        </Button>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="relative">
                            <Avatar className="h-16 w-16 border border-slate-100 shadow-inner">
                                <AvatarImage src={user?.avatar || "https://github.com/shadcn.png"} alt="Avatar" />
                                <AvatarFallback className="text-xl bg-slate-50 text-slate-700 font-bold">{user?.full_name?.substring(0, 2).toUpperCase() || "KK"}</AvatarFallback>
                            </Avatar>
                            <div className={cn(
                                "absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center shadow-sm",
                                currentStatus.color.replace("text-", "bg-").split(" ")[0]
                            )}>
                                {currentStatus.id === "available" && <Check className="h-3 w-3 text-white" />}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                            <h3 className="text-lg font-black text-slate-900 leading-none mb-1">{user?.full_name || "Karn Kumar"}</h3>
                            <p className="text-xs text-slate-500 truncate mb-2 font-medium">{user?.email || "user@example.com"}</p>
                            <Link href="/dashboard/settings" className="flex items-center text-[10px] text-slate-500 hover:text-indigo-600 font-bold uppercase tracking-wider transition-colors">
                                My Account <ExternalLink className="h-3 w-3 ml-1" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Main Menu Actions */}
                <div className="p-1.5 space-y-0.5">
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "h-5 w-5 rounded-full flex items-center justify-center",
                                        currentStatus.color.replace("text-", "bg-").split(" ")[0]
                                    )}>
                                        {currentStatus.id === "available" && <Check className="h-3 w-3 text-white" />}
                                        {currentStatus.id === "dnd" && <div className="h-0.5 w-2 bg-white rounded-full" />}
                                        {(currentStatus.id === "away" || currentStatus.id === "brb") && <Clock className="h-3 w-3 text-white" />}
                                        {currentStatus.id === "offline" && <XCircle className="h-3 w-3 text-white" />}
                                        {/* Busy is a solid dot, so we don't add anything inside */}
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">{currentStatus.label}</span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent side="left" align="start" className="w-56 p-1.5 bg-white/95 backdrop-blur-md border-slate-200 shadow-2xl rounded-2xl animate-in zoom-in-95 duration-200">
                            <div className="space-y-0.5">
                                {STATUS_OPTIONS.map((status) => (
                                    <button
                                        key={status.id}
                                        onClick={() => handleStatusChange(status.id)}
                                        className="w-full flex items-center justify-between p-2 px-3 hover:bg-slate-50 rounded-xl transition-colors text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "h-4 w-4 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
                                                status.color.replace("text-", "bg-").split(" ")[0]
                                            )}>
                                                {status.id === "available" && <Check className="h-2.5 w-2.5 text-white" />}
                                                {status.id === "dnd" && <div className="h-0.5 w-1.5 bg-white rounded-full" />}
                                                {(status.id === "away" || status.id === "brb") && <Clock className="h-2.5 w-2.5 text-white" />}
                                                {status.id === "offline" && <XCircle className="h-2.5 w-2.5 text-white" />}
                                                {/* Busy is a solid dot */}
                                            </div>
                                            <span className="text-xs font-bold text-slate-600">{status.label}</span>
                                        </div>
                                        {user?.status === status.id && <Check className="h-3.5 w-3.5 text-indigo-600 font-black" />}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="h-px bg-slate-100 my-1.5 mx-2" />
                            
                            <button 
                                onClick={handleResetStatus}
                                disabled={isUpdating}
                                className="w-full flex items-center gap-3 p-2 px-3 hover:bg-slate-50 rounded-xl transition-colors text-left group disabled:opacity-50"
                            >
                                <RotateCcw className={cn("h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors", isUpdating && "animate-spin")} />
                                <span className="text-xs font-bold text-slate-600">Reset status</span>
                            </button>
                            
                            <div className="h-px bg-slate-100 my-1.5 mx-2" />
 
                            <button 
                                onClick={() => router.push("/dashboard/settings")}
                                className="w-full flex items-center gap-3 p-2 px-3 hover:bg-slate-50 rounded-xl transition-colors text-left group"
                            >
                                <Settings className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                <span className="text-xs font-bold text-slate-600">Manage presence status</span>
                            </button>
                        </PopoverContent>
                    </Popover>

                    {/* Status Message */}
                    <div className="px-0.5">
                        {isEditingStatus ? (
                            <div className="p-2 space-y-2 bg-slate-50/50 rounded-xl border border-slate-100">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status message</span>
                                    {user?.status_message && (
                                        <button 
                                            onClick={() => handleSaveStatusMessage("")}
                                            className="text-[9px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>
                                <Input 
                                    value={statusMessage}
                                    onChange={(e) => setStatusMessage(e.target.value)}
                                    placeholder="Set status message"
                                    className="h-9 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 border-slate-200 rounded-lg placeholder:text-slate-300 transition-all"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveStatusMessage()}
                                />
                                <div className="flex items-center gap-2 justify-end">
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditingStatus(false)} className="h-7 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        Cancel
                                    </Button>
                                    <Button size="sm" onClick={() => handleSaveStatusMessage()} disabled={isUpdating} className="h-7 text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-lg uppercase tracking-wider shadow-md shadow-indigo-100">
                                        Done
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setIsEditingStatus(true)}
                                className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-all group"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <Pencil className="h-5 w-5 text-slate-400 shrink-0 group-hover:text-indigo-600 transition-colors" />
                                    <span className={cn(
                                        "text-sm truncate",
                                        user?.status_message ? "text-slate-700 font-semibold" : "text-slate-400 font-medium"
                                    )}>
                                        {user?.status_message || "Set status message"}
                                    </span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer Section */}
                <div className="p-3 bg-slate-50/10 border-t border-slate-100/50 flex items-center justify-center gap-4">
                    <Link href="/privacy" className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">PRIVACY</Link>
                    <div className="h-3 w-[1.5px] bg-slate-200" />
                    <Link href="/terms" className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">TERMS</Link>
                </div>
            </PopoverContent>
        </Popover>
    );
}
