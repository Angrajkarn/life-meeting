"use client";

import { useEffect, useState } from "react";
import { useUserPreferences } from "@/components/providers/user-preferences-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardFooter, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building, Plus, Users, Settings, LogOut, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useSocket } from "@/lib/socket";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Organization {
    id: string;
    name: string;
    slug: string;
    plan: string;
    members: any[];
    owner_id: string;
}


export function AccountsAndOrgsSettings() {
    const { userId } = useUserPreferences(); // Get userId from context
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    
    // Invite State
    const [isInviting, setIsInviting] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");

    const [newOrgName, setNewOrgName] = useState("");
    const [newOrgSlug, setNewOrgSlug] = useState("");

    // Real-time
    const { lastMessage } = useSocket("dashboard", userId || "guest");

    // Fetch User's Orgs
    useEffect(() => {
        const fetchOrgs = async () => {
            try {
                const data = await api.get("/organizations");
                setOrgs(data);
                if (data.length > 0) {
                    setCurrentOrg(data[0]); 
                }
            } catch (err) {
                console.error("Failed to fetch orgs", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrgs();
    }, []);

    // Listen for Real-time Events
    useEffect(() => {
        if (!lastMessage || !currentOrg) return;

        if (lastMessage.type === "org:member_added") {
            // Check if update is for current org
            if (lastMessage.org_id === currentOrg.id) {
                const newMember = lastMessage.member;
                // Avoid duplicates
                const exists = currentOrg.members.some((m: any) => m.user_id === newMember.user_id);
                if (!exists) {
                    setCurrentOrg(prev => prev ? ({
                        ...prev,
                        members: [...prev.members, newMember]
                    }) : null);
                    toast.info("New member added to organization");
                }
            }
        }

        if (lastMessage.type === "org:member_removed") {
             if (lastMessage.org_id === currentOrg.id) {
                 // If I was removed (or left), redirect or show state
                 if (lastMessage.user_id === userId) {
                     toast.warning("You have been removed from the organization");
                     // Refresh org list and switch
                     const newOrgs = orgs.filter(o => o.id !== lastMessage.org_id);
                     setOrgs(newOrgs);
                     setCurrentOrg(newOrgs.length > 0 ? newOrgs[0] : null);
                 } else {
                     // Someone else removed
                     setCurrentOrg(prev => prev ? ({
                        ...prev,
                        members: prev.members.filter((m: any) => m.user_id !== lastMessage.user_id)
                    }) : null);
                 }
             }
        }
    }, [lastMessage, currentOrg, userId, orgs]);

    const handleCreateOrg = async () => {
        if (!newOrgName || !newOrgSlug) return;
        
        try {
            const newOrg = await api.post("/organizations", {
                name: newOrgName,
                slug: newOrgSlug
            });
            setOrgs([...orgs, newOrg]);
            setCurrentOrg(newOrg);
            setIsCreating(false);
            setNewOrgName("");
            setNewOrgSlug("");
            toast.success("Organization created successfully");
        } catch (err: any) {
            toast.error(err.message || "Failed to create organization");
        }
    };

    const handleInvite = async () => {
        if (!inviteEmail || !currentOrg) return;
        
        try {
            await api.post("/invitations", {
                email: inviteEmail,
                org_id: currentOrg.id
            });
            setInviteEmail("");
            setIsInviting(false);
            toast.success(`Invitation sent to ${inviteEmail}`);
        } catch (err: any) {
            toast.error(err.message || "Failed to send invitation");
        }
    };

    const handleLeaveOrg = async () => {
        if (!currentOrg) return;
        if (currentOrg.owner_id === userId) {
            toast.error("Owners cannot leave. Transfer ownership first.");
            return;
        }

        try {
            await api.post(`/organizations/${currentOrg.id}/leave`, {});
            toast.success("Left organization successfully");
            // State update handled by WebSocket or manually
            const newOrgs = orgs.filter(o => o.id !== currentOrg.id);
            setOrgs(newOrgs);
            setCurrentOrg(newOrgs.length > 0 ? newOrgs[0] : null);
        } catch (err: any) {
             toast.error(err.message || "Failed to leave organization");
        }
    };

    const handleRemoveMember = async (targetUserId: string) => {
        if (!currentOrg) return;
        
        try {
            await api.delete(`/organizations/${currentOrg.id}/members/${targetUserId}`);
            toast.success("Member removed successfully");
            // WebSocket will update list
        } catch (err: any) {
            toast.error(err.message || "Failed to remove member");
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Loading organizations...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header / Switcher */}
            <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Building className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                {currentOrg ? currentOrg.name : "No Organization"}
                            </h2>
                            <p className="text-sm text-slate-500">
                                {currentOrg ? currentOrg.slug : "Create one to get started"}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <Dialog open={isCreating} onOpenChange={setIsCreating}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Organization
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create Organization</DialogTitle>
                                    <DialogDescription>
                                        Create a new workspace for your team.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Organization Name</Label>
                                        <Input 
                                            placeholder="Acme Corp" 
                                            value={newOrgName}
                                            onChange={(e) => setNewOrgName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>URL Slug</Label>
                                        <div className="flex items-center">
                                            <span className="text-sm text-slate-500 mr-2">life-meeting.com/</span>
                                            <Input 
                                                placeholder="acme" 
                                                value={newOrgSlug}
                                                onChange={(e) => setNewOrgSlug(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreateOrg}>Create Organization</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {orgs.length > 1 && (
                    <div className="pt-4 border-t border-slate-100">
                        <Label className="text-xs text-slate-500 mb-2 block">Switch Organization</Label>
                        <div className="flex gap-2 flex-wrap">
                            {orgs.map(org => (
                                <button
                                    key={org.id}
                                    onClick={() => setCurrentOrg(org)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                                        currentOrg?.id === org.id 
                                        ? "bg-slate-900 text-white border-slate-900" 
                                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                                    }`}
                                >
                                    {org.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* Current Org Details */}
            {currentOrg && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">Plan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold capitalize">{currentOrg.plan}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">Members</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{currentOrg.members.length}</div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-slate-500">Your Role</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold capitalize">Owner</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Members List */}
                    <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Members</h3>
                            
                            <Dialog open={isInviting} onOpenChange={setIsInviting}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Users className="w-4 h-4 mr-2" />
                                        Invite People
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Invite to {currentOrg.name}</DialogTitle>
                                        <DialogDescription>
                                            Send an email invitation to join your organization.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Email Address</Label>
                                            <Input 
                                                placeholder="colleague@example.com" 
                                                value={inviteEmail}
                                                onChange={(e) => setInviteEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleInvite}>Send Invitation</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentOrg.members.map((member: any, i: number) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>{member.user_id.substring(0,2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span>{member.user_id === currentOrg.owner_id ? "You (Owner)" : "Member"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="capitalize">{member.role}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="capitalize">{member.status}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <Settings className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem 
                                                        className="text-red-600 focus:text-red-600"
                                                        onClick={() => handleRemoveMember(member.user_id)}
                                                        disabled={member.user_id === currentOrg.owner_id} 
                                                    >
                                                        Remove Member
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </section>

                    <section className="bg-red-50 border border-red-100 rounded-2xl p-8">
                        <h3 className="font-bold text-red-900 mb-2">Danger Zone</h3>
                        <p className="text-sm text-red-700 mb-4">
                            Irreversible actions for this organization.
                        </p>
                        <Button variant="destructive" onClick={handleLeaveOrg}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Leave Organization
                        </Button>
                    </section>
                </>
            )}
        </div>
    );
}
