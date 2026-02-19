import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, MessageSquare, PlayCircle, UserPlus, Video } from "lucide-react";
import useSWRInfinite from "swr/infinite";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { format, isSameDay, isToday, isYesterday, parseISO } from "date-fns";

interface ActivityLog {
    id: string;
    actor_id: string;
    actor_name: string;
    target_id?: string;
    target_type?: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
}

const fetcher = (url: string) => api.get(url);

export function ActivityFeed() {
    const getKey = (pageIndex: number, previousPageData: ActivityLog[]) => {
        if (previousPageData && !previousPageData.length) return null; // reached the end
        return `/notifications/activity?limit=20&skip=${pageIndex * 20}`;
    };

    const { data, size, setSize, isLoading, isValidating } = useSWRInfinite<ActivityLog[]>(getKey, fetcher);

    const activities: ActivityLog[] = data ? ([] as ActivityLog[]).concat(...data) : [];
    const isEmpty = data?.[0]?.length === 0;
    const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < 20);

    const getIcon = (type: string) => {
        switch (type) {
            case "meeting_created": return <Video className="h-4 w-4 text-indigo-600" />;
            case "meeting_joined": return <UserPlus className="h-4 w-4 text-green-600" />;
            case "file_uploaded": return <FileText className="h-4 w-4 text-blue-600" />;
            case "message_sent": return <MessageSquare className="h-4 w-4 text-slate-500" />;
            case "recording_ready": return <PlayCircle className="h-4 w-4 text-red-600" />;
            default: return <Calendar className="h-4 w-4 text-slate-400" />;
        }
    };

    const getDateLabel = (dateStr: string) => {
        const date = parseISO(dateStr);
        if (isToday(date)) return "Today";
        if (isYesterday(date)) return "Yesterday";
        return format(date, "EEEE, MMM d, yyyy");
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Activity Feed</h3>
                <Button variant="ghost" size="sm" onClick={() => setSize(1)}>Refresh</Button>
            </div>
            
            <ScrollArea className="flex-1 p-6">
                <div className="space-y-8">
                    {activities.map((activity: ActivityLog, index) => {
                        const currentParams = parseISO(activity.timestamp);
                        const prevParams = index > 0 ? parseISO(activities[index - 1].timestamp) : null;
                        const isNewDay = index === 0 || (prevParams && !isSameDay(currentParams, prevParams));
                        
                        return (
                            <div key={activity.id}>
                                {isNewDay && (
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="h-px bg-slate-100 flex-1" />
                                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                            {getDateLabel(activity.timestamp)}
                                        </span>
                                        <div className="h-px bg-slate-100 flex-1" />
                                    </div>
                                )}
                                
                                <div className="flex gap-4 group">
                                    <div className="relative">
                                        <div className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center border border-slate-100 bg-slate-50",
                                            "group-hover:bg-white group-hover:shadow-md transition-all"
                                        )}>
                                            {getIcon(activity.type)}
                                        </div>
                                        <div className="absolute inset-x-0 top-10 bottom-[-32px] w-px bg-slate-100 mx-auto -z-10 last:hidden" />
                                    </div>
                                    
                                    <div className="flex-1 pb-2">
                                        <p className="text-sm text-slate-900">
                                            <span className="font-semibold">{activity.actor_name}</span>{" "}
                                            <span className="text-slate-600">
                                                {activity.title.replace(activity.actor_name, '').trim()}
                                            </span>
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5">{activity.description}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                            {format(parseISO(activity.timestamp), "h:mm a")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {isLoading && (
                        <div className="flex justify-center p-4">
                            <span className="text-xs text-slate-400 animate-pulse">Loading activity...</span>
                        </div>
                    )}
                    
                    {!isReachingEnd && (
                        <Button 
                            variant="ghost" 
                            className="w-full text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            onClick={() => setSize(size + 1)}
                            disabled={isLoading || isValidating}
                        >
                            Load More
                        </Button>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
