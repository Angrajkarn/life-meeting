"use client";

import { UpcomingMeetingCard } from "@/components/dashboard/upcoming-meeting-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ActivityStats } from "@/components/dashboard/activity-stats";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";

export default function DashboardPage() {
    const { data: user, error } = useSWR('/users/me', fetcher);
    const { data: stats } = useSWR('/users/me/stats', fetcher);

    const date = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    const greeting = user ? `Good morning, ${user.full_name?.split(' ')[0]}` : "Good morning";

    // Greeting Subtext logic
    const meetingsToday = stats?.meetings_today || 0;
    const subtext = meetingsToday === 0
        ? "Your schedule is clear today. Great time for deep work."
        : `You have ${meetingsToday} meeting${meetingsToday === 1 ? '' : 's'} scheduled for today.`;

    if (!user && !error) return <div className="flex h-full items-center justify-center min-h-[500px]"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Ambient Background Gradient */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-white to-white -z-10 pointer-events-none" />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100/60">
                <div className="space-y-2">
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                        {greeting}
                    </h1>
                    <div className="flex items-center gap-2 text-slate-500 font-medium">
                        <span className="bg-white/50 px-2 py-0.5 rounded-md border border-slate-100 text-sm shadow-sm">{date}</span>
                        <span className="text-slate-300">•</span>
                        <span>{subtext}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-slate-200 bg-white/50 backdrop-blur-sm hover:bg-white text-slate-700 font-medium h-10 px-4 shadow-sm">
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                        My Calendar
                    </Button>
                </div>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column (Primary Focus) */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Quick Actions Bar (Priority 1) */}
                    <section>
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800">Quick Actions</h2>
                        </div>
                        <QuickActions />
                    </section>

                    {/* Hero Card: Next Meeting (Priority 2) */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-1.5 h-5 bg-indigo-600 rounded-full" />
                                Up Next
                            </h2>
                        </div>
                        <UpcomingMeetingCard />
                    </section>

                    {/* Timeline / Today's Agenda (Future Placeholder) */}
                    <div className="bg-slate-50/50 rounded-3xl border border-slate-200/60 p-6 min-h-[120px] flex items-center justify-center text-slate-400 text-sm font-medium border-dashed">
                        Today's Agenda Timeline (Coming Soon)
                    </div>
                </div>

                {/* Right Column (Stats & Utility) */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Weekly Impact (Stats) */}
                    <section>
                        <ActivityStats />
                    </section>

                    {/* Recent Activity Feed */}
                    <section>
                        <ActivityFeed />
                    </section>
                </div>
            </div>
        </div>
    );
}
