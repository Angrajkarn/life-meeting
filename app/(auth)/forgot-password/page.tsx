"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";
import { Loader2, Mail, ArrowLeft, CheckCircle2, KeyRound, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/icons";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<"EMAIL" | "OTP" | "NEW_PASSWORD" | "SUCCESS">("EMAIL");
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [resetToken, setResetToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");

    const handleSendOtp = async (e: React.FormEvent) => {
        // ... (unchanged)
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("http://localhost:8000/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) throw new Error("Failed to send reset email");
            setStep("OTP");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        // ... (unchanged
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const res = await fetch("http://localhost:8000/auth/verify-reset-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });
            if (!res.ok) throw new Error("Invalid OTP");
            const data = await res.json();
            setResetToken(data.token);
            setStep("NEW_PASSWORD");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("http://localhost:8000/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: resetToken, new_password: newPassword }),
            });
            if (!res.ok) throw new Error("Failed to reset password");
            setStep("SUCCESS");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    {step === "EMAIL" && "Reset your password"}
                    {step === "OTP" && "Enter verification code"}
                    {step === "NEW_PASSWORD" && "Set new password"}
                    {step === "SUCCESS" && "Password reset complete"}
                </h2>
                <p className="text-sm text-slate-500 mt-2">
                    {step === "EMAIL" && "Enter your email for a recovery code."}
                    {step === "OTP" && `We sent a code to ${email}`}
                    {step === "NEW_PASSWORD" && "Create a strong password."}
                    {step === "SUCCESS" && "You can now log in with your new password."}
                </p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md mb-4 border border-red-200 flex gap-2">
                    <Icons.warning className="h-4 w-4" />
                    {error}
                </div>
            )}

            <AnimatePresence mode="wait">
                {step === "EMAIL" && (
                    <motion.form
                        key="email-form"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onSubmit={handleSendOtp}
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Email address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                <Input
                                    type="email"
                                    placeholder="name@company.com"
                                    className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 text-slate-900"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Code"}
                        </Button>
                    </motion.form>
                )}

                {step === "OTP" && (
                    <motion.form
                        key="otp-form"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onSubmit={handleVerifyOtp}
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Verification Code</label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                <Input
                                    type="text"
                                    placeholder="123456"
                                    className="pl-10 h-11 bg-slate-50 text-center tracking-[0.5em] font-mono text-lg"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify Code"}
                        </Button>
                    </motion.form>
                )}

                {step === "NEW_PASSWORD" && (
                    <motion.form
                        key="password-form"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onSubmit={handleResetPassword}
                        className="space-y-6"
                    >
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                <Input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                >
                                    {showNewPassword ? <Icons.eyeOff className="h-4 w-4" /> : <Icons.eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pl-10 pr-10 h-11 bg-slate-50 border-slate-200"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                                >
                                    {showConfirmPassword ? <Icons.eyeOff className="h-4 w-4" /> : <Icons.eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Reset Password"}
                        </Button>
                    </motion.form>
                )}

                {step === "SUCCESS" && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-6"
                    >
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <Button
                            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => router.push("/login")}
                        >
                            Back to Login
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <p className="mt-8 text-center text-sm">
                <Link href="/login" className="inline-flex items-center font-medium text-slate-600 hover:text-slate-900 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to log in
                </Link>
            </p>
        </motion.div>
    );
}
