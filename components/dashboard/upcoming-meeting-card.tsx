"use client";

import { Button } from "@/components/ui/button";
import { Clock, Video, MoreHorizontal, Copy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import useSWR from "swr";
import { fetcher } from "@/lib/api";

export function UpcomingMeetingCard() {
    const { data: meetings, error } = useSWR('/meetings/', fetcher, { refreshInterval: 5000 });
    const safeMeetings = Array.isArray(meetings) ? meetings : [];

    // Find next meeting
    const upcomingMeeting = safeMeetings
        .filter((m: any) => new Date(m.start_time) > new Date())
        .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];

    // -- EMPTY STATE (Beautiful Illustration Placeholder) --
    if (!upcomingMeeting) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center text-center h-[320px] relative overflow-hidden group">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-50 via-transparent to-slate-50 opacity-50" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-50/50 rounded-full blur-3xl -z-10 group-hover:bg-indigo-100/50 transition-colors duration-1000" />

                <div className="relative z-10 bg-white p-4 rounded-2xl shadow-sm mb-6 border border-slate-100">
                    <Clock className="h-10 w-10 text-indigo-200" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2 relative z-10">No upcoming meetings</h3>
                <p className="text-slate-500 max-w-[280px] leading-relaxed relative z-10">
                    You're all clear! Enjoy your free time or schedule a new collaboration session.
                </p>
            </div>
        )
    }

    // -- DATA PREP --
    const startTime = new Date(upcomingMeeting.start_time);
    const endTime = new Date(upcomingMeeting.end_time);
    const timeString = `${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // Logic: Is it happening now?
    const now = new Date();
    const diffMins = Math.ceil((startTime.getTime() - now.getTime()) / (1000 * 60));
    const isHappening = diffMins <= 5 && diffMins >= -60; // "Happening" window

    return (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 shadow-xl shadow-indigo-100/50 group h-[320px]">
            {/* Dynamic Background */}
            <div className={`absolute inset-0 z-0 ${isHappening ? 'bg-indigo-600' : 'bg-white'}`}>
                {isHappening ? (
                    <>
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -ml-10 -mb-10" />
                    </>
                ) : (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-16 -mt-16" />
                )}
            </div>

            <div className={`relative z-10 p-8 h-full flex flex-col justify-between ${isHappening ? 'text-white' : 'text-slate-900'}`}>

                {/* Header Row */}
                <div className="flex justify-between items-start">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isHappening ? 'bg-white/20 backdrop-blur-md text-white border border-white/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'}`}>
                        {isHappening ? <span className="relative flex h-2 w-2 mr-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span></span> : <Clock className="w-3 h-3 mr-1" />}
                        {isHappening ? "Happening Now" : `Starts in ${diffMins} mins`}
                    </div>
                </div>

                {/* Main Content */}
                <div>
                    <h2 className={`text-4xl font-extrabold tracking-tight mb-2 line-clamp-2 leading-tight ${isHappening ? 'text-white' : 'text-slate-900'}`}>
                        {upcomingMeeting.title}
                    </h2>
                    <p className={`text-lg font-medium opacity-90 mb-6 flex items-center gap-2 ${isHappening ? 'text-indigo-100' : 'text-slate-500'}`}>
                        <Clock className="w-5 h-5 opacity-70" /> {timeString}
                    </p>

                    {/* Participants */}
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                            {upcomingMeeting.participants?.slice(0, 5).map((p: any, i: number) => (
                                <Avatar key={p.user_id || i} className={`w-10 h-10 border-4 ${isHappening ? 'border-indigo-600' : 'border-white'} shadow-sm`}>
                                    <AvatarFallback className="bg-slate-200 text-slate-600 font-bold">{p.name?.[0]}</AvatarFallback>
                                </Avatar>
                            ))}
                        </div>
                        {upcomingMeeting.participants && (
                            <span className={`text-sm font-semibold ${isHappening ? 'text-indigo-200' : 'text-slate-500'}`}>
                                with {upcomingMeeting.participants[0]?.name} {upcomingMeeting.participants.length > 1 && `+ ${upcomingMeeting.participants.length - 1} others`}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="flex gap-4 pt-6 border-t border-white/10 mt-auto">
                    <Button
                        size="lg"
                        className={`flex-1 h-12 text-base font-semibold shadow-lg transition-all hover:scale-[1.02] ${isHappening ? 'bg-white text-indigo-600 hover:bg-slate-50 hover:text-indigo-700 border-none' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                        onClick={() => {
                            const url = `${window.location.origin}/meeting/${upcomingMeeting.code}`;
                            navigator.clipboard.writeText(url);
                        }}
                    >
                        Join Meeting
                    </Button>
                    <Button
                        variant={isHappening ? "ghost" : "outline"}
                        size="lg"
                        className={`aspect-square p-0 h-12 w-12 rounded-xl backdrop-blur-sm ${isHappening ? 'bg-white/10 text-white hover:bg-white/20 border-white/20' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        onClick={() => {
                            const url = `${window.location.origin}/meeting/${upcomingMeeting.code}`;
                            navigator.clipboard.writeText(url);
                            alert("Copied!");
                        }}
                    >
                        <Copy className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
