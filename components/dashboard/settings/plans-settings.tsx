"use client";

import { useState, useEffect } from "react";
import { useUserPreferences } from "@/components/providers/user-preferences-provider";
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
import { Check, Zap, Building, Crown } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Plan {
    id: string;
    name: string;
    price_monthly: number;
    features: string[];
    currency: string;
    max_seats: number;
}

interface BillingInfo {
    plan_id: string;
    status: string;
    next_invoice_date?: string;
}

export function PlansSettings() {
    const { user } = useUserPreferences();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [billing, setBilling] = useState<BillingInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpgrading, setIsUpgrading] = useState<string | null>(null);

    const hasOrg = user?.organizations && user.organizations.length > 0;

    useEffect(() => {
        const fetchData = async () => {
             if (!hasOrg) {
                setIsLoading(false);
                return;
            }

            try {
                const [plansData, billingData] = await Promise.all([
                    api.get("/billing/plans"),
                    api.get("/billing/my-billing")
                ]);
                setPlans(plansData);
                setBilling(billingData);
            } catch (error) {
                console.error("Failed to fetch billing data", error);
            } finally {
                setIsLoading(false);
            }
        };
        
        if (user) {
            fetchData();
        }
    }, [user, hasOrg]);

    const handleUpgrade = async (planId: string) => {
        setIsUpgrading(planId);
        try {
            await api.post("/billing/subscribe", {
                plan_id: planId,
                payment_method_id: "pm_mock_visa" 
            });
            setBilling(prev => prev ? { ...prev, plan_id: planId } : null);
            toast.success(`Successfully upgraded to ${planId.toUpperCase()} plan`);
        } catch (error) {
            console.error("Upgrade failed", error);
            toast.error("Upgrade failed. Please try again.");
        } finally {
            setIsUpgrading(null);
        }
    };

    if (!hasOrg && !isLoading) {
        return (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                 <section className="bg-white border border-slate-200 rounded-2xl p-12 space-y-6 shadow-sm flex flex-col items-center text-center">
                    <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                        <Building className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="max-w-md space-y-2">
                        <h2 className="text-xl font-bold text-slate-900">No Organization Found</h2>
                         <p className="text-slate-500">
                            You need to be part of an organization to manage billing and subscription plans.
                        </p>
                    </div>
                    {/* In a real app, this would link to organzation creation or invite acceptance */}
                    <Button variant="outline" disabled>Create Organization (Coming Soon)</Button>
                </section>
            </div>
        )
    }

    const currentPlanId = billing?.plan_id || "free";

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
             <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Crown className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Plans & Billing</h2>
                        <p className="text-sm text-slate-500">Manage your subscription and usage limits.</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 pt-6">
                    {plans.map((plan) => {
                        const isCurrent = currentPlanId === plan.id;
                        const isEnterprise = plan.id === "enterprise";
                        
                        return (
                            <Card key={plan.id} className={cn(
                                "relative flex flex-col border-2 transition-all duration-200",
                                isCurrent ? "border-indigo-600 shadow-lg scale-105 z-10" : "border-slate-100 hover:border-indigo-200 hover:shadow-md",
                                isEnterprise && !isCurrent ? "bg-slate-50/50" : "bg-white"
                            )}>
                                {isCurrent && (
                                    <div className="absolute -top-3 left-0 right-0 flex justify-center">
                                        <Badge className="bg-indigo-600 text-white hover:bg-indigo-700">Current Plan</Badge>
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                                    <div className="mt-2">
                                        <span className="text-3xl font-black text-slate-900">${plan.price_monthly}</span>
                                        <span className="text-slate-500">/mo</span>
                                    </div>
                                    <CardDescription>Up to {plan.max_seats} team members</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <ul className="space-y-2 text-sm">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-2">
                                                <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                                <span className="text-slate-600 capitalize">{feature.replace(/_/g, " ")}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                                <CardFooter>
                                    <Button 
                                        className={cn("w-full font-bold", isCurrent ? "bg-slate-100 text-slate-900 hover:bg-slate-200" : "bg-indigo-600 hover:bg-indigo-700 text-white")}
                                        disabled={isCurrent || (isUpgrading === plan.id)}
                                        onClick={() => handleUpgrade(plan.id)}
                                    >
                                        {isCurrent ? "Active" : isUpgrading === plan.id ? "Processing..." : plan.price_monthly === 0 ? "Downgrade" : "Upgrade"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            </section>
        </div>
    );
}
