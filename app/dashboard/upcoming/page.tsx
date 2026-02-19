"use client";

import { useState, useEffect } from "react";
import { UpcomingMeetings } from "@/components/meetings/UpcomingMeetings";
import { toast } from "sonner";

export default function UpcomingMeetingsPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const response = await fetch("http://localhost:8000/users/me", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserId(data.id);
                }
            } catch (error) {
                console.error("Failed to fetch user:", error);
                toast.error("Session error. Please log in again.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
        );
    }

    if (!userId) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center gap-4">
                <p className="text-slate-500">Please log in to view your meetings.</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto">
            <UpcomingMeetings userId={userId} />
        </div>
    );
}
