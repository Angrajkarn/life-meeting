"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Trash2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import { useSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    priority: string;
    link?: string;
}

export function NotificationCenter({ userId }: { userId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const { data: notifications, mutate: refreshNotifications } = useSWR<Notification[]>(
        userId ? '/notifications?limit=20' : null,
        api.get
    );

    const unreadCount = notifications?.filter(n => !n.is_read).length || 0;
    const { lastMessage } = useSocket("dashboard", userId || "guest");

    useEffect(() => {
        if (lastMessage?.type === "notification:new") {
            const audio = new Audio('/sounds/notification.mp3'); // Assuming sound exists or will fail silently
            audio.play().catch(() => {});
            
            toast(lastMessage.data.title, {
                description: lastMessage.data.message,
            });
            refreshNotifications();
        }
    }, [lastMessage, refreshNotifications]);

    const markAsRead = async (id: string) => {
        // Optimistic update
        mutate(
            '/notifications?limit=20',
            (current: Notification[] | undefined) => current?.map(n => 
                n.id === id ? { ...n, is_read: true } : n
            ),
            false
        );

        try {
            await api.patch(`/notifications/${id}/read`, {});
        } catch (error) {
            console.error("Failed to mark read", error);
            refreshNotifications();
        }
    };

    const markAllRead = async () => {
        mutate(
            '/notifications?limit=20',
            (current: Notification[] | undefined) => current?.map(n => ({ ...n, is_read: true })),
            false
        );

        try {
            await api.post('/notifications/mark-all-read', {});
            toast.success("All notifications marked as read");
        } catch (error) {
            toast.error("Failed to mark all as read");
            refreshNotifications();
        }
    };

    const getIcon = (type: string) => {
        // Simple icon logic for now
        return <Bell className="h-4 w-4" />;
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-900">
                    <Bell className={cn("h-5 w-5", unreadCount > 0 && "text-slate-900")} />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white translate-x-1/2 -translate-y-1/2 transform scale-100 transition-transform" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0 mr-4" align="end">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            onClick={markAllRead}
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[400px]">
                    <div className="flex flex-col">
                        {!notifications || notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <div 
                                    key={notif.id}
                                    className={cn(
                                        "p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group relative",
                                        !notif.is_read && "bg-indigo-50/30 hover:bg-indigo-50/50"
                                    )}
                                    onClick={() => markAsRead(notif.id)}
                                >
                                    <div className="flex gap-3 items-start">
                                        <div className={cn(
                                            "mt-1 h-2 w-2 rounded-full shrink-0",
                                            !notif.is_read ? "bg-indigo-500" : "bg-transparent"
                                        )} />
                                        <div className="space-y-1 flex-1">
                                            <p className={cn("text-sm text-slate-900", !notif.is_read && "font-semibold")}>
                                                {notif.title}
                                            </p>
                                            <p className="text-xs text-slate-500 line-clamp-2">
                                                {notif.message}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium pt-1">
                                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
