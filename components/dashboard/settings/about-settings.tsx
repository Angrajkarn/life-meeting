"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    Info, 
    Shield, 
    FileText, 
    Github, 
    Twitter, 
    Globe, 
    Cpu, 
    RefreshCcw,
    CheckCircle2,
    Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export function AboutSettings() {
    const [isChecking, setIsChecking] = useState(false);
    const [isUpToDate, setIsUpToDate] = useState<boolean | null>(null);
    const [systemInfo, setSystemInfo] = useState({
        os: "Unknown",
        browser: "Unknown",
        agent: "Unknown"
    });

    useEffect(() => {
        // Detect System Info
        const ua = window.navigator.userAgent;
        let os = "Unknown OS";
        if (ua.indexOf("Win") !== -1) os = "Windows";
        if (ua.indexOf("Mac") !== -1) os = "macOS";
        if (ua.indexOf("Linux") !== -1) os = "Linux";
        if (ua.indexOf("Android") !== -1) os = "Android";
        if (ua.indexOf("like Mac") !== -1) os = "iOS";

        let browser = "Unknown Browser";
        if (ua.indexOf("Chrome") !== -1) browser = "Chrome";
        if (ua.indexOf("Firefox") !== -1) browser = "Firefox";
        if (ua.indexOf("Safari") !== -1) browser = "Safari";
        if (ua.indexOf("Edge") !== -1) browser = "Edge";

        setSystemInfo({
            os,
            browser,
            agent: ua
        });
    }, []);

    const checkForUpdates = () => {
        setIsChecking(true);
        setIsUpToDate(null);
        
        // Mock API call
        setTimeout(() => {
            setIsChecking(false);
            setIsUpToDate(true);
            toast.success("You are on the latest version");
        }, 2000);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 max-w-4xl mx-auto">
            
            {/* Hero Section */}
            <div className="relative bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-10 text-white overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Sparkles className="w-64 h-64 transform rotate-12" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 shadow-2xl">
                        <div className="bg-white p-4 rounded-xl">
                            <Sparkles className="w-12 h-12 text-indigo-600" />
                        </div>
                    </div>
                    <div className="text-center md:text-left space-y-2">
                        <h1 className="text-4xl font-black tracking-tight">Life Meeting</h1>
                        <p className="text-indigo-100 text-lg font-medium">Enterprise Communication Suite</p>
                        <div className="flex items-center gap-3 pt-2 justify-center md:justify-start">
                            <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                                v2.4.0-stable
                            </Badge>
                            <Badge variant="outline" className="text-indigo-100 border-indigo-200/30">
                                Build 2026.02.12
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* System Information */}
                <Card className="bg-slate-50/50 border-slate-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-slate-500" />
                            System Information
                        </CardTitle>
                        <CardDescription>Details about your current environment.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-slate-200/60 last:border-0">
                            <span className="text-sm font-medium text-slate-500">Operating System</span>
                            <span className="text-sm font-bold text-slate-900">{systemInfo.os}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-200/60 last:border-0">
                            <span className="text-sm font-medium text-slate-500">Browser Engine</span>
                            <span className="text-sm font-bold text-slate-900">{systemInfo.browser}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-200/60 last:border-0">
                            <span className="text-sm font-medium text-slate-500">Connection</span>
                            <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                Encrypted (TLS 1.3)
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Software Update */}
                <Card className="border-indigo-100 bg-white shadow-sm hover:shadow-md transition-all">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-indigo-900">
                            <RefreshCcw className="w-5 h-5 text-indigo-600" />
                            Software Update
                        </CardTitle>
                        <CardDescription>Check for the latest features and security patches.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-indigo-50/50 rounded-xl p-4 flex items-center gap-4 border border-indigo-100/50">
                            <div className={cn("p-3 rounded-full", isUpToDate ? "bg-green-100 text-green-600" : "bg-indigo-100 text-indigo-600")}>
                                {isUpToDate ? <CheckCircle2 className="w-6 h-6" /> : <RefreshCcw className={cn("w-6 h-6", isChecking && "animate-spin")} />}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-indigo-950">
                                    {isUpToDate ? "Up to date" : isChecking ? "Checking..." : "Check for updates"}
                                </p>
                                <p className="text-xs text-indigo-600/80">
                                    {isUpToDate ? "Last checked just now" : "Auto-updates enabled"}
                                </p>
                            </div>
                            <Button 
                                size="sm" 
                                onClick={checkForUpdates}
                                disabled={isChecking || isUpToDate === true}
                                className={cn(isUpToDate ? "bg-green-600 hover:bg-green-700" : "bg-indigo-600 hover:bg-indigo-700")}
                            >
                                {isChecking ? "Checking" : isUpToDate ? "Latest" : "Check Now"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Legal & Links */}
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                        <div className="p-3 bg-slate-100 rounded-full group-hover:bg-indigo-100 transition-colors">
                            <Shield className="w-6 h-6 text-slate-600 group-hover:text-indigo-600" />
                        </div>
                        <h3 className="font-bold text-slate-900">Privacy Policy</h3>
                        <p className="text-xs text-slate-500">How we handle your data</p>
                    </CardContent>
                </Card>
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                        <div className="p-3 bg-slate-100 rounded-full group-hover:bg-indigo-100 transition-colors">
                            <FileText className="w-6 h-6 text-slate-600 group-hover:text-indigo-600" />
                        </div>
                        <h3 className="font-bold text-slate-900">Terms of Service</h3>
                        <p className="text-xs text-slate-500">Usage guidelines</p>
                    </CardContent>
                </Card>
                <Card className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                        <div className="p-3 bg-slate-100 rounded-full group-hover:bg-indigo-100 transition-colors">
                            <Globe className="w-6 h-6 text-slate-600 group-hover:text-indigo-600" />
                        </div>
                        <h3 className="font-bold text-slate-900">Website</h3>
                        <p className="text-xs text-slate-500">Visit life-meeting.com</p>
                    </CardContent>
                </Card>
            </div>

            {/* Footer */}
            <div className="text-center pt-8 pb-4">
                <p className="text-slate-400 text-sm">
                    © 2026 Life Meeting Inc. All rights reserved.
                </p>
                <div className="flex justify-center gap-4 mt-2">
                    <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors"><Twitter className="w-4 h-4" /></a>
                    <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors"><Github className="w-4 h-4" /></a>
                </div>
            </div>
        </div>
    );
}
