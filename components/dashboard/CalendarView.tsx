"use client";

import { useState, useEffect, useCallback } from "react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, addWeeks, subWeeks,
  isSameDay, isSameMonth, isToday, parseISO, startOfDay, endOfDay,
  differenceInMinutes, getHours, getMinutes
} from "date-fns";
import {
  ChevronLeft, ChevronRight, Plus, RefreshCw, Calendar,
  Clock, Users, Video, LayoutGrid, List, Columns3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useSocket } from "@/lib/socket";
import { ScheduleMeetingModal } from "@/components/schedule-meeting-modal";
import { toast } from "sonner";
import useSWR from "swr";
import { fetcher } from "@/lib/api";

type ViewMode = "month" | "week" | "day";

interface Meeting {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  code: string;
  participants?: { id: string; name: string }[];
  color?: string;
}

const MEETING_COLORS = [
  "bg-indigo-500", "bg-violet-500", "bg-pink-500",
  "bg-emerald-500", "bg-sky-500", "bg-amber-500",
];

function colorForMeeting(id: string) {
  const sum = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return MEETING_COLORS[sum % MEETING_COLORS.length];
}

// ── Month Grid Cell ────────────────────────────────────────────────────────────
function MonthCell({
  day, currentMonth, meetings, onSelect,
}: {
  day: Date; currentMonth: Date; meetings: Meeting[]; onSelect: (d: Date) => void;
}) {
  const dayMeetings = meetings.filter((m) => isSameDay(parseISO(m.start_time), day));
  const inMonth = isSameMonth(day, currentMonth);
  const isNow = isToday(day);

  return (
    <div
      onClick={() => onSelect(day)}
      className={cn(
        "min-h-[96px] p-2 border-b border-r border-slate-100 cursor-pointer transition-colors",
        inMonth ? "bg-white hover:bg-slate-50" : "bg-slate-50/50",
      )}
    >
      <span className={cn(
        "inline-flex items-center justify-center w-7 h-7 text-sm font-semibold rounded-full mb-1",
        isNow ? "bg-indigo-600 text-white" : inMonth ? "text-slate-800" : "text-slate-400"
      )}>
        {format(day, "d")}
      </span>
      <div className="space-y-0.5">
        {dayMeetings.slice(0, 3).map((m) => (
          <div
            key={m.id}
            className={cn(
              "text-[10px] text-white font-medium px-1.5 py-0.5 rounded truncate",
              colorForMeeting(m.id)
            )}
          >
            {format(parseISO(m.start_time), "h:mma")} {m.title}
          </div>
        ))}
        {dayMeetings.length > 3 && (
          <span className="text-[10px] text-slate-400 font-medium pl-1">
            +{dayMeetings.length - 3} more
          </span>
        )}
      </div>
    </div>
  );
}

// ── Week View ─────────────────────────────────────────────────────────────────
function WeekView({
  weekStart, meetings, onMeetingClick,
}: {
  weekStart: Date; meetings: Meeting[]; onMeetingClick: (m: Meeting) => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const HOUR_H = 56; // px per hour

  return (
    <div className="flex flex-col overflow-hidden flex-1">
      {/* Day headers */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-slate-200 bg-white shrink-0">
        <div className="border-r border-slate-100" />
        {days.map((d) => (
          <div key={d.toISOString()} className={cn(
            "py-3 text-center border-r border-slate-100",
            isToday(d) ? "bg-indigo-50" : ""
          )}>
            <p className="text-xs text-slate-400 font-semibold uppercase">{format(d, "EEE")}</p>
            <p className={cn(
              "text-lg font-black mt-0.5",
              isToday(d) ? "text-indigo-600" : "text-slate-800"
            )}>{format(d, "d")}</p>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative grid grid-cols-[56px_repeat(7,1fr)]" style={{ height: `${HOUR_H * 24}px` }}>
          {/* Hour labels */}
          <div className="border-r border-slate-100">
            {hours.map((h) => (
              <div key={h} className="border-b border-slate-100 flex items-start justify-end pr-2 pt-0.5"
                style={{ height: HOUR_H }}>
                <span className="text-[10px] text-slate-400 font-medium">
                  {format(new Date(2000, 0, 1, h), "ha")}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d) => {
            const dayMeetings = meetings.filter((m) => isSameDay(parseISO(m.start_time), d));
            return (
              <div key={d.toISOString()} className={cn("border-r border-slate-100 relative", isToday(d) ? "bg-indigo-50/30" : "")}>
                {hours.map((h) => (
                  <div key={h} className="border-b border-slate-100" style={{ height: HOUR_H }} />
                ))}

                {/* Current time line */}
                {isToday(d) && (() => {
                  const now = new Date();
                  const topPct = ((getHours(now) * 60 + getMinutes(now)) / 1440) * 100;
                  return (
                    <div className="absolute left-0 right-0 z-10 pointer-events-none"
                      style={{ top: `${topPct}%` }}>
                      <div className="h-px bg-red-500 relative">
                        <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
                      </div>
                    </div>
                  );
                })()}

                {/* Meeting chips */}
                {dayMeetings.map((m) => {
                  const start = parseISO(m.start_time);
                  const end = parseISO(m.end_time);
                  const topPx = ((getHours(start) * 60 + getMinutes(start)) / 60) * HOUR_H;
                  const heightPx = Math.max((differenceInMinutes(end, start) / 60) * HOUR_H, 24);
                  return (
                    <div
                      key={m.id}
                      onClick={() => onMeetingClick(m)}
                      className={cn(
                        "absolute left-0.5 right-0.5 rounded-lg px-2 py-1 text-white cursor-pointer overflow-hidden hover:brightness-110 transition-all z-20 shadow-sm",
                        colorForMeeting(m.id)
                      )}
                      style={{ top: topPx, height: heightPx }}
                    >
                      <p className="text-[10px] font-bold truncate">{m.title}</p>
                      {heightPx > 32 && (
                        <p className="text-[9px] opacity-80">{format(start, "h:mm")}–{format(end, "h:mma")}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Day View ──────────────────────────────────────────────────────────────────
function DayView({ day, meetings, onMeetingClick }: { day: Date; meetings: Meeting[]; onMeetingClick: (m: Meeting) => void }) {
  const dayMeetings = meetings.filter((m) => isSameDay(parseISO(m.start_time), day));
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const HOUR_H = 64;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className={cn("bg-white border-b border-slate-200 py-4 px-6 text-center shrink-0", isToday(day) ? "bg-indigo-50" : "")}>
        <p className="text-xs uppercase text-slate-400 font-semibold">{format(day, "EEEE")}</p>
        <p className={cn("text-4xl font-black mt-1", isToday(day) ? "text-indigo-600" : "text-slate-900")}>{format(day, "d")}</p>
        <p className="text-sm text-slate-400 mt-0.5">{format(day, "MMMM yyyy")}</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="relative grid grid-cols-[64px_1fr]" style={{ height: `${HOUR_H * 24}px` }}>
          <div className="border-r border-slate-100">
            {hours.map((h) => (
              <div key={h} className="border-b border-slate-100 flex items-start justify-end pr-2 pt-0.5" style={{ height: HOUR_H }}>
                <span className="text-[10px] text-slate-400 font-medium">{format(new Date(2000, 0, 1, h), "ha")}</span>
              </div>
            ))}
          </div>
          <div className="relative">
            {hours.map((h) => <div key={h} className="border-b border-slate-100" style={{ height: HOUR_H }} />)}
            {isToday(day) && (() => {
              const now = new Date();
              const topPct = ((getHours(now) * 60 + getMinutes(now)) / 1440) * 100;
              return (
                <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: `${topPct}%` }}>
                  <div className="h-px bg-red-500"><div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" /></div>
                </div>
              );
            })()}
            {dayMeetings.map((m) => {
              const start = parseISO(m.start_time);
              const end = parseISO(m.end_time);
              const topPx = ((getHours(start) * 60 + getMinutes(start)) / 60) * HOUR_H;
              const heightPx = Math.max((differenceInMinutes(end, start) / 60) * HOUR_H, 28);
              return (
                <div
                  key={m.id}
                  onClick={() => onMeetingClick(m)}
                  className={cn("absolute left-2 right-2 rounded-xl px-4 py-2 text-white cursor-pointer hover:brightness-110 z-20 shadow-md transition-all", colorForMeeting(m.id))}
                  style={{ top: topPx, height: heightPx }}
                >
                  <p className="text-sm font-bold truncate">{m.title}</p>
                  {heightPx > 44 && (
                    <p className="text-xs opacity-80 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {format(start, "h:mm")}–{format(end, "h:mma")}
                    </p>
                  )}
                  {heightPx > 64 && m.participants && (
                    <p className="text-xs opacity-70 mt-0.5 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {m.participants.length} participant{m.participants.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Calendar Component ────────────────────────────────────────────────────
export function CalendarView() {
  const [view, setView] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const { data: user } = useSWR('/users/me', fetcher);
  const { lastMessage } = useSocket("dashboard", user?.id || "guest");

  const fetchMeetings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/meetings/upcoming');
      setMeetings(data ?? []);
    } catch {
      toast.error("Failed to load meetings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchMeetings(); }, [fetchMeetings]);

  // Real-time updates via WebSocket
  useEffect(() => {
    if (!lastMessage) return;
    if (lastMessage.type === "meeting_created") {
      const m = lastMessage.meeting;
      setMeetings(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m].sort(
        (a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime()
      ));
      toast.info(`New meeting: ${m.title}`, { icon: <Calendar className="w-4 h-4" /> });
    }
    if (lastMessage.type === "meeting_updated") {
      const m = lastMessage.meeting;
      setMeetings(prev => prev.map(x => x.id === m.id ? { ...x, ...m } : x));
    }
    if (lastMessage.type === "meeting_deleted") {
      setMeetings(prev => prev.filter(x => x.id !== lastMessage.meeting_id));
      toast.info("A meeting was cancelled");
    }
  }, [lastMessage]);

  // Navigation
  const prev = () => {
    if (view === "month") setCursor(subMonths(cursor, 1));
    else if (view === "week") setCursor(subWeeks(cursor, 1));
    else setCursor(addDays(cursor, -1));
  };
  const next = () => {
    if (view === "month") setCursor(addMonths(cursor, 1));
    else if (view === "week") setCursor(addWeeks(cursor, 1));
    else setCursor(addDays(cursor, 1));
  };
  const today = () => setCursor(new Date());

  // Month grid days
  const monthDays = (() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    const days: Date[] = [];
    let d = start;
    while (d <= end) { days.push(d); d = addDays(d, 1); }
    return days;
  })();

  const weekStart = startOfWeek(cursor, { weekStartsOn: 1 });

  const headerLabel = view === "month"
    ? format(cursor, "MMMM yyyy")
    : view === "week"
    ? `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`
    : format(cursor, "EEEE, MMMM d, yyyy");

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 shrink-0 bg-white z-10">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={today} className="h-8 text-xs font-semibold">
            Today
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={next}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-black text-slate-900 ml-1">{headerLabel}</h2>
          {isLoading && <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin ml-1" />}
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
            {([["month", LayoutGrid], ["week", Columns3], ["day", List]] as [ViewMode, any][]).map(([v, Icon]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                  view === v ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="capitalize">{v}</span>
              </button>
            ))}
          </div>

          <Button
            size="sm"
            className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
            onClick={() => setIsScheduling(true)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> New
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchMeetings}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Calendar body */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {view === "month" && (
          <>
            {/* DOW headers */}
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 shrink-0">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="py-2 text-center text-xs font-bold text-slate-400 uppercase border-r border-slate-100 last:border-r-0">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 flex-1 overflow-y-auto">
              {monthDays.map((day) => (
                <MonthCell
                  key={day.toISOString()}
                  day={day}
                  currentMonth={cursor}
                  meetings={meetings}
                  onSelect={(d) => { setCursor(d); setView("day"); }}
                />
              ))}
            </div>
          </>
        )}

        {view === "week" && (
          <WeekView
            weekStart={weekStart}
            meetings={meetings}
            onMeetingClick={setSelectedMeeting}
          />
        )}

        {view === "day" && (
          <DayView
            day={cursor}
            meetings={meetings}
            onMeetingClick={setSelectedMeeting}
          />
        )}
      </div>

      {/* Meeting Quick-View Drawer */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={() => setSelectedMeeting(null)}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={cn("w-10 h-1.5 rounded-full mb-4 mx-auto", colorForMeeting(selectedMeeting.id))} />
            <h3 className="text-xl font-black text-slate-900">{selectedMeeting.title}</h3>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {format(parseISO(selectedMeeting.start_time), "EEE, MMM d · h:mm")}–{format(parseISO(selectedMeeting.end_time), "h:mma")}
            </p>
            {selectedMeeting.participants && (
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                <Users className="w-4 h-4" /> {selectedMeeting.participants.length} participants
              </p>
            )}
            <div className="flex gap-2 mt-5">
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                onClick={() => { window.location.href = `/meeting/${selectedMeeting.code}`; }}
              >
                <Video className="w-4 h-4 mr-2" /> Join
              </Button>
              <Button variant="outline" className="flex-1 font-semibold border-slate-200" onClick={() => setSelectedMeeting(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      <ScheduleMeetingModal open={isScheduling} onOpenChange={setIsScheduling} onSuccess={fetchMeetings} />
    </div>
  );
}
