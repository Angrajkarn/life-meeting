"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { AuthGuard } from "@/components/auth/auth-guard";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserPreferencesProvider } from "@/components/providers/user-preferences-provider";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isChat = pathname.startsWith('/dashboard/chat');

    return (
        <AuthGuard>
            <UserPreferencesProvider>
                <div className="h-screen overflow-hidden relative flex">
                    <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-50 bg-white border-r border-slate-200">
                        <Sidebar />
                    </div>

                    <div className="md:pl-72 flex-1 flex flex-col min-h-screen bg-slate-50">
                        {/* Topbar */}
                        <div className="shrink-0">
                            <DashboardHeader />
                        </div>

                        <main className={cn(
                            "flex-1 overflow-auto",
                            (isChat || pathname.startsWith('/dashboard/settings')) ? "p-0 h-full" : "p-8"
                        )}>
                            {children}
                        </main>
                    </div>
                </div>
            </UserPreferencesProvider>
        </AuthGuard>
    );
}
