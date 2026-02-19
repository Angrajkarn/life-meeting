"use client";

import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { UserProfileMenu } from "./user-profile-menu";
import { NotificationCenter } from "./notification-center";


export function DashboardHeader() {
    const { data: user, error } = useSWR('/users/me', fetcher);
    const isLoading = !user && !error;

    return (
        <header className="sticky top-0 z-40 w-full h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6">
            <div className="hidden md:flex items-center gap-4 w-96">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search meetings, people, or teams..."
                        className="pl-9 h-9 bg-slate-100 border-slate-200 focus:bg-white transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <NotificationCenter userId={user?.id} />
                <div className="h-8 w-px bg-slate-200 mx-2" />
                <UserProfileMenu />
            </div>
        </header>
    );
}
