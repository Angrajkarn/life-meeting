"use client";

import { Button } from "@/components/ui/button";
import { Plus, Calendar, Video, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useSWRConfig } from "swr";
import { ScheduleMeetingModal } from "@/components/schedule-meeting-modal";

export function QuickActions() {
    const router = useRouter();
    const { mutate } = useSWRConfig();
    const [joinId, setJoinId] = useState("");
    const [isScheduling, setIsScheduling] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleStartInstant = () => {
        router.push("/meeting/lobby");
    };

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (joinId.trim()) {
            router.push(`/meeting/${joinId}?join=1`);
        }
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {/* Start Instant */}
            <button
                onClick={handleStartInstant}
                disabled={isLoading}
                className="group relative flex flex-col items-start justify-between bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 rounded-3xl text-white shadow-lg shadow-indigo-200 overflow-hidden hover:scale-[1.02] transition-all h-32"
            >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-white/20 transition-all" />

                <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-sm">
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Video className="h-6 w-6" />}
                </div>
                <div>
                    <span className="block font-bold text-lg leading-none mb-1">New Meeting</span>
                    <span className="text-indigo-100 text-xs font-medium">Start instant call</span>
                </div>
            </button>

            {/* Schedule */}
            <button
                onClick={() => setIsScheduling(true)}
                className="group relative flex flex-col items-start justify-between bg-white border border-slate-200 p-5 rounded-3xl text-slate-800 shadow-sm hover:border-indigo-200 hover:shadow-md hover:scale-[1.02] transition-all h-32"
            >
                <div className="bg-orange-50 p-2.5 rounded-2xl text-orange-600 group-hover:bg-orange-100 transition-colors">
                    <Calendar className="h-6 w-6" />
                </div>
                <div className="text-left">
                    <span className="block font-bold text-lg leading-none mb-1">Schedule</span>
                    <span className="text-slate-500 text-xs font-medium">Plan for later</span>
                </div>
            </button>
            <ScheduleMeetingModal open={isScheduling} onOpenChange={setIsScheduling} />

            {/* Join */}
            <div className="group relative flex flex-col justify-between bg-white border border-slate-200 p-1.5 rounded-3xl text-slate-800 shadow-sm h-32">
                <div className="p-3.5 pb-0 flex items-start gap-3">
                    <div className="bg-emerald-50 p-2.5 rounded-2xl text-emerald-600">
                        <ArrowRight className="h-6 w-6" />
                    </div>
                    <div className="text-left py-1">
                        <span className="block font-bold text-lg leading-none mb-1">Join</span>
                        <span className="text-slate-500 text-xs font-medium">Via meeting code</span>
                    </div>
                </div>

                <form onSubmit={handleJoin} className="p-1">
                    <div className="relative">
                        <Input
                            placeholder="Enter code..."
                            value={joinId}
                            onChange={(e) => setJoinId(e.target.value)}
                            className="bg-slate-50 border-transparent focus:bg-white focus:border-indigo-200 pl-4 pr-10 h-10 rounded-2xl text-sm"
                        />
                        {joinId && (
                            <button type="submit" className="absolute right-2 top-2 text-indigo-600 hover:text-indigo-700">
                                <ArrowRight className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
