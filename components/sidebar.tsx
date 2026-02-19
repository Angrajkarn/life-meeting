"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Video,
    Calendar,
    Clock,
    Settings,
    LogOut,
    Users,
    MessageSquare
} from "lucide-react";

const sidebarItems = [
    { icon: Video, label: "Meetings", href: "/dashboard" },
    { icon: Calendar, label: "Schedule", href: "/dashboard/schedule" },
    { icon: Clock, label: "History", href: "/dashboard/history" },
    { icon: Users, label: "Contacts", href: "/dashboard/contacts" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-white/5 bg-secondary/30 hidden md:flex flex-col h-screen fixed left-0 top-0 pt-20">
            <div className="px-4 py-4 space-y-2">
                {sidebarItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                        <Button
                            variant={pathname === item.href ? "secondary" : "ghost"}
                            className={cn(
                                "w-full justify-start gap-3 mb-1",
                                pathname === item.href ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white hover:bg-white/5"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Button>
                    </Link>
                ))}
            </div>

            <div className="mt-auto p-4 border-t border-white/5">
                <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </aside>
    );
}
