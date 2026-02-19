"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AcceptInvitePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState("Verifying your invitation...");
    const processing = useRef(false);

    useEffect(() => {
        if (!token || processing.current) {
            if (!token) {
                setStatus('error');
                setMessage("Invalid or missing invitation token.");
            }
            return;
        }

        processing.current = true;
        const acceptInvite = async () => {
            try {
                const res = await api.get(`/chat/accept-invite?token=${token}`);
                setStatus('success');
                setMessage(res.message || "Welcome to the workspace! Redirecting...");
                toast.success("Successfully joined the workspace");
                
                // Redirect after a short delay to show success state
                setTimeout(() => {
                    router.push("/dashboard/chat");
                }, 2000);
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.detail || "This invitation is invalid or has already been used.");
            }
        };

        acceptInvite();
    }, [token, router]);

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white min-h-[60vh]">
            <div className="max-w-md w-full text-center space-y-6 animate-in fade-in duration-500">
                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
                        <h1 className="text-2xl font-bold text-slate-900">{message}</h1>
                        <p className="text-slate-500">One moment while we set things up for you.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">You're in!</h1>
                        <p className="text-slate-600 text-lg">{message}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mb-2">
                            <AlertCircle className="h-12 w-12 text-rose-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">Oops!</h1>
                        <p className="text-slate-600 mb-6">{message}</p>
                        <Button 
                            onClick={() => router.push("/dashboard")}
                            className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8 rounded-xl"
                        >
                            Go to Dashboard
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
