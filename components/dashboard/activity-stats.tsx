import { TrendingUp, Loader2 } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";

export function ActivityStats() {
    const { data: stats } = useSWR('/users/me/stats', fetcher, { refreshInterval: 60000 });
    const hasData = !!stats;
    const hoursSaved = hasData ? stats.hours_saved : 0;
    const meetingsCount = hasData ? stats.meetings_today : 0;

    return (
        <div className="bg-slate-900 rounded-3xl p-6 relative overflow-hidden shadow-xl shadow-slate-200 text-white min-h-[280px] flex flex-col justify-between group">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-l from-indigo-600/30 to-purple-600/10 rounded-full blur-3xl -mr-20 -mt-32 pointer-events-none group-hover:opacity-100 transition-opacity duration-500 opacity-70" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 blur-2xl rounded-full -ml-8 -mb-8" />

            <div className="relative z-10">
                <div className="flex items-center gap-2 text-indigo-300 mb-4">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-400/80">Productivity</span>
                </div>

                <h3 className="text-5xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    {hasData ? hoursSaved.toFixed(1) : "0.0"} <span className="text-2xl font-semibold text-slate-500 ml-1">hrs</span>
                </h3>
                <p className="text-slate-400 font-medium">Saved via AI summaries</p>
            </div>

            <div className="relative z-10 pt-8 border-t border-white/10 mt-6">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-sm text-slate-400 font-medium">Activity</span>
                    <span className="text-xs font-bold bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-md border border-indigo-500/20">
                        {meetingsCount} Meetings Today
                    </span>
                </div>
                <div className="flex items-end gap-1 h-12 w-full opacity-60">
                    {[30, 45, 25, 60, 40, 75, 50].map((h, i) => (
                        <div key={i} className="flex-1 bg-indigo-500 rounded-sm hover:bg-indigo-400 transition-colors cursor-pointer" style={{ height: `${h}%` }} />
                    ))}
                </div>
            </div>
        </div>
    );
}
