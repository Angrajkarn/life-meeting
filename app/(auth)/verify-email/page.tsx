"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

function VerifyEmailForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");

    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [resendStatus, setResendStatus] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (!email) {
            setError("Email missing. Please sign up again.");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("http://localhost:8000/auth/verify-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Verification failed");
            }

            const data = await res.json();
            localStorage.setItem("token", data.access_token);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) return;
        setResendStatus("Sending...");
        try {
            const res = await fetch("http://localhost:8000/auth/resend-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: "000000" }), // Dummy OTP for type safety
            });

            if (res.ok) {
                setResendStatus("OTP Resent!");
            } else {
                setResendStatus("Failed to resend.");
            }
        } catch (e) {
            setResendStatus("Error sending.");
        }
    };

    return (
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold tracking-tight">Check your email</CardTitle>
                <CardDescription>
                    We sent a verification code to <span className="font-semibold text-foreground">{email}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="otp">Verification Code</Label>
                        <Input
                            id="otp"
                            placeholder="123456"
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="bg-white/50 text-center text-lg tracking-[0.5em] font-mono h-12"
                            maxLength={6}
                            required
                        />
                    </div>
                    {error && (
                        <div className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md border border-red-100 flex items-center gap-2">
                            <Icons.warning className="h-4 w-4" />
                            {error}
                        </div>
                    )}
                    <Button className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all duration-300" type="submit" disabled={isLoading}>
                        {isLoading && (
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Verify Email
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 text-center">
                <div className="text-sm text-muted-foreground">
                    Didn&apos;t receive the code?{" "}
                    <button
                        onClick={handleResend}
                        className="text-violet-600 hover:text-violet-500 font-medium underline-offset-4 hover:underline transition-colors"
                    >
                        Resend
                    </button>
                    {resendStatus && <span className="ml-2 text-xs text-green-600">{resendStatus}</span>}
                </div>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Back to login
                </Link>
            </CardFooter>
        </Card>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerifyEmailForm />
        </Suspense>
    );
}
