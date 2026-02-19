"use client";

import { MessageSquare, SquarePen, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChatLandingPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/20 text-center animate-in fade-in duration-700">
            <div className="max-w-md w-full">
                {/* HERO ILLUSTRATION CONTAINER */}
                <div className="w-64 h-64 mx-auto mb-10 relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-indigo-50 rounded-full scale-110 opacity-50 blur-2xl animate-pulse" />
                    <div className="relative z-10 p-10 bg-white rounded-[40px] shadow-2xl shadow-indigo-100 ring-1 ring-slate-100">
                        <MessageSquare className="h-24 w-24 text-indigo-600" />
                    </div>
                    {/* Floating accents */}
                    <div className="absolute top-4 right-4 h-6 w-6 bg-emerald-400 rounded-full shadow-lg animate-bounce" />
                    <div className="absolute bottom-10 left-0 h-4 w-4 bg-amber-400 rounded-full shadow-lg animate-pulse" />
                </div>

                <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Your Workspace Hub</h1>
                <p className="text-slate-500 mb-8 leading-relaxed">
                    Collaborate instantly with your team. Select a conversation from the sidebar or start a fresh one to begin.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-10">
                    <Button variant="outline" className="h-24 flex flex-col gap-2 rounded-2xl border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group">
                        <SquarePen className="h-6 w-6 text-indigo-500 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-700">New Message</span>
                    </Button>
                    <Button variant="outline" className="h-24 flex flex-col gap-2 rounded-2xl border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group">
                        <Video className="h-6 w-6 text-indigo-500 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-slate-700">Meet Now</span>
                    </Button>
                </div>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-700 text-xs font-bold ring-1 ring-indigo-100 uppercase tracking-widest">
                    <Users className="h-3 w-3" />
                    Join over 100+ channels
                </div>
            </div>
        </div>
    );
}
