"use client";

import { CalendarView } from "@/components/dashboard/CalendarView";

export default function CalendarPage() {
  return (
    <div className="h-full flex flex-col p-4 md:p-6">
      <div className="mb-4 shrink-0">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Calendar</h1>
        <p className="text-sm text-slate-500 mt-0.5">Schedule, view, and join your meetings</p>
      </div>
      <div className="flex-1 min-h-0">
        <CalendarView />
      </div>
    </div>
  );
}
