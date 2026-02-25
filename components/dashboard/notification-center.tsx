"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Bell, Check, Video, Calendar, Users, AlertTriangle,
  Info, Zap, MessageSquare, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import { useSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import useSWR, { mutate as globalMutate } from "swr";
import { formatDistanceToNow, parseISO } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  priority: "low" | "normal" | "high" | "urgent";
  link?: string;
}

// ── Icon map by notification type ──────────────────────────────
function NotifIcon({ type, priority }: { type: string; priority: string }) {
  const base = "h-4 w-4 shrink-0";
  if (type.includes("meeting_created") || type.includes("meeting_invite"))
    return <Calendar className={cn(base, "text-indigo-500")} />;
  if (type.includes("meeting_started") || type.includes("join_now") || type.includes("live"))
    return <Video className={cn(base, "text-red-500")} />;
  if (type.includes("meeting_updated"))
    return <Clock className={cn(base, "text-amber-500")} />;
  if (type.includes("chat") || type.includes("message"))
    return <MessageSquare className={cn(base, "text-pink-500")} />;
  if (type.includes("team") || type.includes("user"))
    return <Users className={cn(base, "text-emerald-500")} />;
  if (priority === "urgent" || priority === "high")
    return <AlertTriangle className={cn(base, "text-red-500")} />;
  if (type.includes("system"))
    return <Zap className={cn(base, "text-violet-500")} />;
  return <Info className={cn(base, "text-slate-400")} />;
}

// ── Priority badge colour ────────────────────────────────────
const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-amber-500",
  normal: "bg-indigo-500",
  low: "bg-slate-300",
};

const SWR_KEY = '/notifications?limit=30';

export function NotificationCenter({ userId }: { userId?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const isValidUser = Boolean(
    userId && userId !== 'guest' && !userId.startsWith('guest_')
  );

  const { data: notifications, mutate: refreshNotifications } = useSWR<Notification[]>(
    isValidUser ? SWR_KEY : null,
    api.get,
    { refreshInterval: isOpen ? 15_000 : 60_000 }  // poll faster when panel is open
  );

  const unreadCount = notifications?.filter(n => !n.is_read).length ?? 0;
  const { lastMessage } = useSocket("dashboard", userId ?? "guest");

  // Real-time: incoming notification via WebSocket
  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === "notification:new") {
      // Optimistic prepend
      globalMutate(
        SWR_KEY,
        (cur: Notification[] = []) => [lastMessage.data, ...cur],
        false
      );
      // Play sound
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => {});
      } catch {}

      toast(lastMessage.data.title, {
        description: lastMessage.data.message,
        icon: <Bell className="w-4 h-4 text-indigo-500" />,
        duration: 5000,
      });
    }
  }, [lastMessage]);

  const markAsRead = useCallback(async (id: string) => {
    globalMutate(
      SWR_KEY,
      (cur: Notification[] = []) => cur.map(n => n.id === id ? { ...n, is_read: true } : n),
      false
    );
    try { await api.patch(`/notifications/${id}/read`, {}); }
    catch { refreshNotifications(); }
  }, [refreshNotifications]);

  const markAllRead = useCallback(async () => {
    globalMutate(
      SWR_KEY,
      (cur: Notification[] = []) => cur.map(n => ({ ...n, is_read: true })),
      false
    );
    try {
      await api.post('/notifications/mark-all-read', {});
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
      refreshNotifications();
    }
  }, [refreshNotifications]);

  const relativeTime = (iso: string) => {
    try { return formatDistanceToNow(parseISO(iso), { addSuffix: true }); }
    catch { return ""; }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-500 hover:text-slate-900"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className={cn("h-5 w-5 transition-colors", unreadCount > 0 && "text-slate-900")} />
          {unreadCount > 0 && (
            <span
              className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white animate-pulse"
              aria-hidden
            />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0 mr-4 shadow-2xl border-slate-200 rounded-2xl overflow-hidden" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-slate-900">Notifications</h4>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-black rounded-full px-1.5 py-0.5 leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold"
              onClick={markAllRead}
            >
              <Check className="w-3 h-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="h-[420px]">
          {!notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium">You're all caught up!</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-slate-100">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.is_read) markAsRead(notif.id);
                    if (notif.link) window.location.href = notif.link;
                  }}
                  className={cn(
                    "flex gap-3 px-4 py-3 cursor-pointer transition-colors group",
                    !notif.is_read ? "bg-indigo-50/40 hover:bg-indigo-50/70" : "hover:bg-slate-50"
                  )}
                >
                  {/* Icon circle */}
                  <div className={cn(
                    "mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    !notif.is_read ? "bg-white shadow-sm" : "bg-slate-100"
                  )}>
                    <NotifIcon type={notif.type} priority={notif.priority} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-start gap-2">
                      <p className={cn(
                        "text-sm leading-snug line-clamp-1",
                        !notif.is_read ? "font-semibold text-slate-900" : "text-slate-700"
                      )}>
                        {notif.title}
                      </p>
                      {/* Priority badge */}
                      {(notif.priority === "urgent" || notif.priority === "high") && (
                        <span className={cn(
                          "shrink-0 text-[9px] font-black uppercase px-1 py-0.5 rounded text-white leading-none mt-0.5",
                          notif.priority === "urgent" ? "bg-red-500" : "bg-amber-500"
                        )}>
                          {notif.priority}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {relativeTime(notif.created_at)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!notif.is_read && (
                    <div className={cn(
                      "mt-1.5 w-2 h-2 rounded-full shrink-0",
                      PRIORITY_DOT[notif.priority] ?? "bg-indigo-500"
                    )} />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications && notifications.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50/40 flex justify-between items-center">
            <span className="text-[10px] text-slate-400">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-slate-500 hover:text-slate-700"
              onClick={() => { setIsOpen(false); }}
            >
              Close
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
