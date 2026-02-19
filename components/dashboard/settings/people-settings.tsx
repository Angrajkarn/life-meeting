"use client";

import { useState, useEffect } from "react";
import { useUserPreferences } from "@/components/providers/user-preferences-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { 
    Users,
    Search,
    MapPin,
    Briefcase,
    Phone,
    Building2,
    Mail
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DirectoryUser {
    id: string;
    full_name: string;
    email: string;
    avatar?: string;
    job_title?: string;
    department?: string;
    location?: string;
    status: string;
}

export function PeopleSettings() {
    const { user, mutate } = useUserPreferences();
    const [activeTab, setActiveTab] = useState("profile");
    
    // Profile State
    const [formData, setFormData] = useState({
        job_title: "",
        location: "",
        phone: ""
    });
    const [isSaving, setIsSaving] = useState(false);

    // Directory State
    const [searchQuery, setSearchQuery] = useState("");
    const [directoryUsers, setDirectoryUsers] = useState<DirectoryUser[]>([]);
    const [isLoadingDirectory, setIsLoadingDirectory] = useState(false);

    // Initialize form with user data
    useEffect(() => {
        if (user) {
            setFormData({
                job_title: user.job_title || "",
                location: user.location || "",
                phone: user.phone || ""
            });
        }
    }, [user]);

    // Search users effect
    useEffect(() => {
        const searchUsers = async () => {
            if (searchQuery.length < 2) {
                setDirectoryUsers([]);
                return;
            }
            setIsLoadingDirectory(true);
            try {
                const results = await api.get(`/directory/users/search?q=${searchQuery}`);
                setDirectoryUsers(results);
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsLoadingDirectory(false);
            }
        };

        const debounceTimer = setTimeout(searchUsers, 500);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    const handleProfileUpdate = async () => {
        setIsSaving(true);
        try {
            await api.patch("/directory/users/me/profile", formData);
            await mutate(); // Refresh user data
            toast.success("Profile updated successfully");
        } catch (error) {
            console.error("Failed to update profile", error);
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <section className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">People & Directory</h2>
                        <p className="text-sm text-slate-500">Manage your identity and find colleagues.</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                        <TabsTrigger value="profile">My Profile</TabsTrigger>
                        <TabsTrigger value="directory">Directory Search</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Professional Identity</CardTitle>
                                <CardDescription>
                                    Your profile information visible to other organization members.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                                    <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                                        <AvatarImage src={user?.avatar} />
                                        <AvatarFallback className="text-xl bg-indigo-100 text-indigo-700">
                                            {user?.full_name?.substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{user?.full_name}</h3>
                                        <p className="text-sm text-slate-500 flex items-center gap-2">
                                            <Mail className="w-3 h-3" />
                                            {user?.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Job Title</Label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input 
                                                className="pl-9"
                                                placeholder="e.g. Senior Product Manager"
                                                value={formData.job_title}
                                                onChange={(e) => setFormData({...formData, job_title: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Department</Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input 
                                                className="pl-9 bg-slate-50"
                                                value={user?.department || "No Department"}
                                                disabled
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Office Location</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input 
                                                className="pl-9"
                                                placeholder="e.g. New York - Floor 4"
                                                value={formData.location}
                                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input 
                                                className="pl-9"
                                                placeholder="+1 (555) 000-0000"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <Button onClick={handleProfileUpdate} disabled={isSaving}>
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="directory" className="mt-6 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Find Colleagues</CardTitle>
                                <CardDescription>Search for people across your organization.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input 
                                        className="pl-9 h-10"
                                        placeholder="Search by name, email, or job title..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <ScrollArea className="h-[400px] rounded-md border p-4">
                                    {directoryUsers.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                                            <Search className="w-8 h-8 opacity-20" />
                                            <p className="text-sm">
                                                {searchQuery.length < 2 ? "Type at least 2 characters to search" : "No results found"}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {directoryUsers.map((u) => (
                                                <div key={u.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar>
                                                            <AvatarImage src={u.avatar} />
                                                            <AvatarFallback>{u.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-semibold text-sm text-slate-900">{u.full_name}</p>
                                                            <p className="text-xs text-slate-500">{u.job_title || "Team Member"} • {u.department || "General"}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`inline-flex h-2 w-2 rounded-full ${
                                                            u.status === 'available' ? 'bg-green-500' : 
                                                            u.status === 'busy' ? 'bg-red-500' : 'bg-slate-300'
                                                        }`} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </section>
        </div>
    );
}
