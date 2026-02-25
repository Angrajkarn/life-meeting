"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Calendar, Clock, Users, Settings,
  Plus, VideoIcon, CalendarPlus, Keyboard, MessageSquare, LogOut
} from "lucide-react";
import { useState, useEffect } from "react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/api";
import { useSocket } from "@/lib/socket";
import { ScheduleMeetingModal } from "@/components/schedule-meeting-modal";
import { Logo } from "@/components/logo";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from "@/components/ui/tooltip";

const routes = [
  { label: "Dashboard",  icon: LayoutDashboard, href: "/dashboard",          color: "text-sky-500"     },
  { label: "Calendar",   icon: Calendar,         href: "/dashboard/calendar", color: "text-indigo-500"  },
  { label: "Upcoming",   icon: Clock,            href: "/dashboard/upcoming", color: "text-violet-500"  },
  { label: "Chat",       icon: MessageSquare,    href: "/dashboard/chat",     color: "text-pink-600"    },
  { label: "History",    icon: Clock,            href: "/dashboard/history",  color: "text-orange-500"  },
  { label: "Team",       icon: Users,            href: "/dashboard/team",     color: "text-emerald-500" },
  { label: "Settings",   icon: Settings,         href: "/dashboard/settings", color: "text-slate-500"   },
];

interface SidebarProps { className?: string; }

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const [expanded, setExpanded] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [joinId, setJoinId] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const { data: user } = useSWR('/users/me', fetcher);
  const { lastMessage } = useSocket("dashboard", user?.id || "guest");

  useEffect(() => {
    if (lastMessage?.type === "chat:status_message") {
      mutate('/users/me');
    }
  }, [lastMessage, mutate]);

  const handleStartInstant = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Instant Meeting", type: "instant", startTime: new Date() }),
      });
      if (res.ok) {
        const meeting = await res.json();
        await mutate('/api/meetings');
        router.push(`/meeting/${meeting.id}?join=1`);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  return (
    <TooltipProvider delayDuration={0}>
      {/* Sidebar — collapses to icon-only, expands on hover */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={cn(
          "flex flex-col h-screen border-r border-slate-200 bg-white transition-all duration-200 ease-in-out overflow-hidden z-30",
          expanded ? "w-56" : "w-[60px]",
          className
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-3.5 border-b border-slate-100 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <Logo showText={false} />
            {expanded && (
              <span className="font-black text-slate-900 text-sm truncate whitespace-nowrap">
                Life Meeting
              </span>
            )}
          </Link>
        </div>

        {/* New Meeting button */}
        <div className="px-3 pt-4 pb-2 shrink-0">
          {expanded ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs font-bold">
                  <Plus className="h-4 w-4 mr-1.5 shrink-0" /> New Meeting
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56" sideOffset={8}>
                <DropdownMenuLabel>Create Meeting</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleStartInstant} disabled={isLoading} className="cursor-pointer py-2.5">
                  <VideoIcon className="mr-2.5 h-4 w-4 text-indigo-500" /> Start instant meeting
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsScheduling(true)} className="cursor-pointer py-2.5">
                  <CalendarPlus className="mr-2.5 h-4 w-4 text-indigo-500" /> Schedule for later
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsJoining(true)} className="cursor-pointer py-2.5">
                  <Keyboard className="mr-2.5 h-4 w-4 text-slate-500" /> Join via ID...
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-full h-9 flex items-center justify-center rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
                      <Plus className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" className="w-56" sideOffset={12}>
                    <DropdownMenuLabel>Create Meeting</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleStartInstant} disabled={isLoading} className="cursor-pointer py-2.5">
                      <VideoIcon className="mr-2.5 h-4 w-4 text-indigo-500" /> Start instant meeting
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsScheduling(true)} className="cursor-pointer py-2.5">
                      <CalendarPlus className="mr-2.5 h-4 w-4 text-indigo-500" /> Schedule for later
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsJoining(true)} className="cursor-pointer py-2.5">
                      <Keyboard className="mr-2.5 h-4 w-4 text-slate-500" /> Join via ID...
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent side="right">New Meeting</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {routes.map((route) => {
            const active = pathname === route.href || pathname.startsWith(route.href + "/");
            const Icon = route.icon;

            return expanded ? (
              <Link key={route.href} href={route.href}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}>
                  <Icon className={cn("h-4 w-4 shrink-0", active ? "text-indigo-600" : route.color)} />
                  <span className="truncate whitespace-nowrap">{route.label}</span>
                  {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />}
                </div>
              </Link>
            ) : (
              <Tooltip key={route.href}>
                <TooltipTrigger asChild>
                  <Link href={route.href}>
                    <div className={cn(
                      "flex items-center justify-center h-9 w-9 mx-auto rounded-lg transition-all",
                      active ? "bg-indigo-50 text-indigo-600" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    )}>
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{route.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom — logout */}
        <div className="px-3 pb-4 pt-2 border-t border-slate-100 shrink-0">
          {expanded ? (
            <button
              onClick={() => { localStorage.removeItem("token"); router.push("/login"); }}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" /> Sign Out
            </button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => { localStorage.removeItem("token"); router.push("/login"); }}
                  className="flex items-center justify-center h-9 w-9 mx-auto rounded-lg text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign Out</TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>

      {/* Modals */}
      <ScheduleMeetingModal open={isScheduling} onOpenChange={setIsScheduling} />

      <Dialog open={isJoining} onOpenChange={setIsJoining}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Join Meeting</DialogTitle>
            <DialogDescription>Enter the meeting ID or code to join.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="joinId" className="text-sm font-medium mb-2 block">Meeting ID</Label>
            <Input id="joinId" value={joinId} onChange={(e) => setJoinId(e.target.value)} placeholder="abc-123-xyz" />
          </div>
          <DialogFooter>
            <Button onClick={() => router.push(`/meeting/${joinId}?join=1`)} disabled={!joinId}>
              Join Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
