"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Search, 
    Download, 
    PlayCircle, 
    MoreHorizontal, 
    Calendar, 
    Clock, 
    RotateCcw,
    Users,
    Info,
    Trash2,
    CheckCircle2,
    XCircle,
    Copy,
    ExternalLink
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { fetcher, API_URL } from "@/lib/api";
import { format, differenceInMinutes, parseISO } from "date-fns";
import { toast } from "sonner";
import { useSocket } from "@/lib/socket";

export default function HistoryPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dateRange, setDateRange] = useState<number>(0); // 0 = All, 7, 30
    const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const { data: user } = useSWR('/users/me', fetcher);
    const { data: allUsers } = useSWR('/users/', fetcher);
    
    const historyUrl = `/meetings/history${dateRange > 0 ? `?days=${dateRange}` : ''}`;
    const { data: historyData, isLoading, mutate } = useSWR(historyUrl, fetcher, {
        refreshInterval: 60000, 
    });

    // WebSocket Integration for instant sync
    const { lastMessage } = useSocket("dashboard", user?.id || "guest");
    
    useEffect(() => {
        if (lastMessage?.type === "meeting_updated" && lastMessage.meeting.status === "ended") {
            console.log("[History] Meeting ended, refreshing list...");
            mutate();
        }
    }, [lastMessage, mutate]);

    // Helper to get user name from ID
    const getUserName = (userId: string) => {
        if (userId === user?.id) return "Me";
        const found = allUsers?.find((u: any) => u.id === userId);
        return found?.full_name || "Unknown User";
    };

    const getUserInitial = (userId: string) => {
        const name = getUserName(userId);
        return name === "Me" ? user?.full_name?.[0] : name.charAt(0);
    };

    const formatDuration = (start: string, end: string) => {
        if (!start || !end) return "N/A";
        try {
            const diff = differenceInMinutes(parseISO(end), parseISO(start));
            if (diff < 60) return `${diff}m`;
            const hours = Math.floor(diff / 60);
            const mins = diff % 60;
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        } catch (e) {
            return "N/A";
        }
    };

    const exportToCSV = () => {
        if (!filteredHistory.length) return;
        
        const headers = ["ID", "Title", "Date", "Time", "Host", "Duration", "Status"];
        const rows = filteredHistory.map((m: any) => [
            m.id,
            m.title,
            format(parseISO(m.start_time), "yyyy-MM-dd"),
            format(parseISO(m.start_time), "HH:mm"),
            getUserName(m.host_id),
            formatDuration(m.start_time, m.end_time),
            m.status
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((e: any) => e.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `meeting_history_${format(new Date(), "yyyyMMdd")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("History exported successfully!");
    };

    const filteredHistory = useMemo(() => {
        if (!historyData) return [];
        
        return historyData.filter((meeting: any) => {
            const matchesSearch = 
                meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                meeting.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                getUserName(meeting.host_id).toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesStatus = statusFilter === "all" || meeting.status.toLowerCase() === statusFilter.toLowerCase();
            
            return matchesSearch && matchesStatus;
        });
    }, [historyData, searchQuery, statusFilter, allUsers, user]);

    const handleDeleteHistory = async (meetingId: string) => {
        if (!confirm("Are you sure you want to remove this meeting from your history?")) return;
        
        try {
            const response = await fetch(`${API_URL}/meetings/${meetingId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                toast.success("Meeting removed from history");
                mutate();
            } else {
                const error = await response.json();
                toast.error(error.detail || "Failed to remove meeting");
            }
        } catch (error) {
            toast.error("An error occurred while removing the meeting");
        }
    };

    const handleViewDetails = (meeting: any) => {
        setSelectedMeeting(meeting);
        setIsDetailsOpen(true);
    };

    return (
        <div className="max-w-6xl mx-auto h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        Meeting History
                        {isLoading && <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and audit your past organization sessions.</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        onClick={exportToCSV}
                        disabled={!filteredHistory.length}
                        className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-indigo-200 transition-all rounded-xl h-11 shadow-sm"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                        placeholder="Search by title, host, or ID..."
                        className="pl-10 bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500 rounded-xl h-11 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex bg-slate-100/50 p-1 rounded-xl border border-slate-200">
                        <button 
                            onClick={() => setDateRange(0)}
                            className={cn("px-3 py-1.5 text-xs font-semibold rounded-lg transition-all", dateRange === 0 ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >All</button>
                        <button 
                            onClick={() => setDateRange(7)}
                            className={cn("px-3 py-1.5 text-xs font-semibold rounded-lg transition-all", dateRange === 7 ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >7D</button>
                        <button 
                            onClick={() => setDateRange(30)}
                            className={cn("px-3 py-1.5 text-xs font-semibold rounded-lg transition-all", dateRange === 30 ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                        >30D</button>
                    </div>
                    <select 
                        className="h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="ended">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-400 hover:bg-slate-100 hover:text-indigo-600 rounded-xl h-11 w-11 transition-all"
                        onClick={() => {
                            setSearchQuery("");
                            setStatusFilter("all");
                            setDateRange(0);
                            mutate();
                        }}
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                <Table>
                    <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-b border-slate-100">
                            <TableHead className="w-[120px] text-[10px] font-bold uppercase tracking-widest text-slate-400 px-6">Meeting ID</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Meeting Info</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Participants</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Schedule</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Host</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Duration</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</TableHead>
                            <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-400 pr-8">Manage</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="animate-pulse border-b border-slate-50">
                                    <TableCell className="px-6"><div className="h-4 bg-slate-100 rounded-full w-20" /></TableCell>
                                    <TableCell><div className="space-y-2"><div className="h-4 bg-slate-100 rounded-full w-48" /><div className="h-3 bg-slate-50 rounded-full w-32" /></div></TableCell>
                                    <TableCell><div className="h-4 bg-slate-100 rounded-full w-24" /></TableCell>
                                    <TableCell><div className="space-y-2"><div className="h-4 bg-slate-100 rounded-full w-24" /><div className="h-3 bg-slate-50 rounded-full w-16" /></div></TableCell>
                                    <TableCell><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-slate-100" /><div className="h-4 bg-slate-100 rounded-full w-20" /></div></TableCell>
                                    <TableCell><div className="h-6 bg-slate-100 rounded-lg w-16" /></TableCell>
                                    <TableCell><div className="h-6 bg-slate-100 rounded-lg w-24" /></TableCell>
                                    <TableCell className="text-right pr-8"><div className="h-9 w-9 bg-slate-100 rounded-xl ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredHistory.length > 0 ? (
                            filteredHistory.map((meeting: any) => (
                                <TableRow key={meeting.id} className="hover:bg-slate-50/50 group transition-all duration-300 border-b border-slate-50 cursor-pointer" onClick={() => handleViewDetails(meeting)}>
                                    <TableCell className="px-6">
                                        <div className="font-mono text-[11px] text-slate-400 font-bold bg-slate-100/50 w-fit px-2 py-0.5 rounded-md border border-slate-200">
                                            #{meeting.id.slice(-6).toUpperCase()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{meeting.title}</div>
                                        {meeting.settings?.is_chat_locked === false && (
                                            <div className="flex items-center text-emerald-600 text-[10px] font-bold bg-emerald-50 w-fit px-1.5 py-0.5 mt-1 rounded-md border border-emerald-100">
                                                <PlayCircle className="h-3 w-3 mr-1" />
                                                PRO RECORDING
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {meeting.attendees?.slice(0, 3).map((a: any, i: number) => (
                                                <div key={i} className="h-7 w-7 rounded-lg bg-white border-2 border-white flex items-center justify-center text-[9px] font-black text-slate-400 shadow-sm ring-1 ring-slate-100">
                                                    {getUserInitial(a.user_id)}
                                                </div>
                                            ))}
                                            {meeting.attendees?.length > 3 && (
                                                <div className="h-7 w-7 rounded-lg bg-indigo-50 border-2 border-white flex items-center justify-center text-[9px] font-black text-indigo-600 shadow-sm ring-1 ring-indigo-100">
                                                    +{meeting.attendees.length - 3}
                                                </div>
                                            )}
                                            {(!meeting.attendees || meeting.attendees.length === 0) && (
                                                <span className="text-xs text-slate-400 font-medium italic">Private</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-slate-800 font-semibold flex items-center gap-1.5">
                                            <Calendar className="h-3 h-3 text-slate-400" />
                                            {format(parseISO(meeting.start_time), "MMM d, yyyy")}
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-medium ml-4.5">
                                            {format(parseISO(meeting.start_time), "h:mm a")}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[11px] font-black text-white shadow-md shadow-indigo-200 ring-2 ring-white">
                                                {getUserInitial(meeting.host_id)}
                                            </div>
                                            <span className="text-sm text-slate-600 font-bold tracking-tight">{getUserName(meeting.host_id)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-slate-500 text-xs font-bold bg-slate-50 w-fit px-2.5 py-1.5 rounded-xl border border-slate-200 group-hover:border-indigo-200 group-hover:bg-indigo-50/30 transition-all">
                                            <Clock className="h-3 w-3 mr-1.5 text-slate-400 group-hover:text-indigo-500" />
                                            {formatDuration(meeting.start_time, meeting.end_time)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className={cn(
                                            "inline-flex items-center px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-sm",
                                            meeting.status === "ended" 
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                                : "bg-red-50 text-red-700 border-red-200"
                                        )}>
                                            {meeting.status === "ended" ? (
                                                <div className="flex items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    Completed
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <XCircle className="h-3 w-3" />
                                                    {meeting.status}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-8" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl h-10 w-10 transition-all">
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-slate-100">
                                                <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-widest p-3">Meeting Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleViewDetails(meeting)} className="rounded-xl p-3 cursor-pointer">
                                                    <Info className="mr-3 h-4 w-4 text-indigo-500" />
                                                    <span className="font-semibold text-slate-700">View Full Details</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl p-3 cursor-pointer">
                                                    <PlayCircle className="mr-3 h-4 w-4 text-emerald-500" />
                                                    <span className="font-semibold text-slate-700">Watch Recording</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="rounded-xl p-3 cursor-pointer">
                                                    <Copy className="mr-3 h-4 w-4 text-blue-500" />
                                                    <span className="font-semibold text-slate-700">Copy Summary</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-slate-100 mx-2" />
                                                <DropdownMenuItem 
                                                    onClick={() => handleDeleteHistory(meeting.id)}
                                                    className="rounded-xl p-3 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                                >
                                                    <Trash2 className="mr-3 h-4 w-4" />
                                                    <span className="font-semibold">Remove from History</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-96 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-700">
                                        <div className="p-8 bg-slate-50 rounded-full border border-slate-100 shadow-inner">
                                            <RotateCcw className="h-12 w-12 text-slate-200" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-slate-900 font-bold text-xl tracking-tight">Archives empty</p>
                                            <p className="text-slate-500 text-sm max-w-xs mx-auto">No meetings matching your current search parameters were found in the history.</p>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            className="rounded-xl mt-4 border-slate-200"
                                            onClick={() => {
                                                setSearchQuery("");
                                                setStatusFilter("all");
                                                setDateRange(0);
                                            }}
                                        >
                                            Reset all filters
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <div className="border-t border-slate-100 p-8 flex items-center justify-between text-xs text-slate-500 bg-slate-50/20">
                    <div className="font-bold tracking-tight">
                        Displaying <span className="text-slate-900 text-sm mx-1">{filteredHistory.length}</span> out of <span className="text-slate-900 text-sm mx-1">{historyData?.length || 0}</span> audit records
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl border-slate-200 font-bold hover:bg-white hover:text-indigo-600 transition-all shadow-sm" disabled>Previous</Button>
                        <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl border-slate-200 font-bold hover:bg-white hover:text-indigo-600 transition-all shadow-sm" disabled>Next</Button>
                    </div>
                </div>
            </div>

            {/* Meeting Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
                    {selectedMeeting && (
                        <div className="flex flex-col">
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white relative">
                                <div className="absolute top-8 right-8 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                                    {selectedMeeting.status}
                                </div>
                                <h2 className="text-2xl font-black tracking-tight pr-12">{selectedMeeting.title}</h2>
                                <p className="text-slate-400 text-sm mt-2 flex items-center gap-2">
                                    <span className="font-mono bg-white/5 px-2 py-0.5 rounded">ID: {selectedMeeting.id}</span>
                                    •
                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(parseISO(selectedMeeting.start_time), "MMMM d, yyyy")}</span>
                                </p>
                            </div>
                            
                            <div className="p-8 bg-white space-y-8">
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Host</p>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-lg bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-700">
                                                {getUserInitial(selectedMeeting.host_id)}
                                            </div>
                                            <p className="text-sm font-bold text-slate-700">{getUserName(selectedMeeting.host_id)}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</p>
                                        <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-slate-400" />
                                            {formatDuration(selectedMeeting.start_time, selectedMeeting.end_time)}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recordings</p>
                                        <p className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                                            <PlayCircle className="h-4 w-4" />
                                            Active
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Participants ({selectedMeeting.attendees?.length || 0})</p>
                                        <Button variant="ghost" size="sm" className="text-indigo-600 h-6 px-2 text-[10px] font-black hover:bg-indigo-50">INVITE HISTORY</Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {selectedMeeting.attendees?.map((attendee: any, i: number) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl group transition-all hover:border-indigo-100 hover:bg-white hover:shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                        {getUserInitial(attendee.user_id)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700">{getUserName(attendee.user_id)}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{attendee.role}</p>
                                                    </div>
                                                </div>
                                                {attendee.user_id === selectedMeeting.host_id && (
                                                    <CheckCircle2 className="h-3 w-3 text-indigo-500" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl h-12 font-black tracking-tight shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]">
                                        <PlayCircle className="mr-2 h-4 w-4" />
                                        Watch Playback
                                    </Button>
                                    <Button variant="outline" className="flex-1 border-slate-200 text-slate-600 rounded-2xl h-12 font-black tracking-tight hover:bg-slate-50 transition-all active:scale-[0.98]">
                                        <Download className="mr-2 h-4 w-4" />
                                        Export Log
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
