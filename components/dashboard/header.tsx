"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { UserProfileMenu } from "./user-profile-menu";
import { NotificationCenter } from "./notification-center";
import { GlobalSearch } from "./GlobalSearch";

export function DashboardHeader() {
    const { data: user, error } = useSWR('/users/me', fetcher);

    return (
        <header className="sticky top-0 z-40 w-full h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6">
            <div className="hidden md:flex items-center gap-4 w-96">
                <GlobalSearch />
            </div>

            <div className="flex items-center gap-4">
                <NotificationCenter userId={user?.id} />
                <div className="h-8 w-px bg-slate-200 mx-2" />
                <UserProfileMenu />
            </div>
        </header>
    );
}
