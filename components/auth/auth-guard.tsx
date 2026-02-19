"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("token");
            
            if (!token) {
                console.log("[AuthGuard] No token found, redirecting to login");
                router.push("/login");
                return;
            }

            try {
                // Verify token is valid by calling the /users/me endpoint
                const response = await fetch("http://localhost:8000/users/me", {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    console.log("[AuthGuard] Token valid, user authenticated");
                    setIsAuthenticated(true);
                } else {
                    console.log("[AuthGuard] Invalid token, redirecting to login");
                    localStorage.removeItem("token");
                    router.push("/login");
                }
            } catch (error) {
                console.error("[AuthGuard] Auth check failed:", error);
                localStorage.removeItem("token");
                router.push("/login");
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Verifying authentication...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
