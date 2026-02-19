"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Video, MoreHorizontal, User, Clock, Calendar } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Attendee {
    id: string;
    image?: string;
    initials: string;
    color: string;
}

interface Meeting {
    id: string;
    title: string;
    startTime: string; // e.g., "10:00 AM"
    endTime: string;   // e.g., "11:00 AM"
    tags: string[];
    isStartingSoon?: boolean;
    attendees: Attendee[];
    description?: string;
}

interface AgendaCardProps {
    meeting: Meeting;
    onJoin?: (id: string) => void;
}

export function AgendaCard({ meeting, onJoin }: AgendaCardProps) {
    return (
        <div className="flex gap-6 group">
            {/* Time Column */}
            <div className="w-32 flex-shrink-0 pt-1">
                <div className="font-bold text-slate-900 text-lg">{meeting.startTime}</div>
                <div className="text-sm text-slate-500 font-medium">{meeting.endTime}</div>
                {meeting.isStartingSoon && (
                    <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 animate-pulse">
                        Starting soon
                    </div>
                )}
            </div>

            {/* Card Content */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group-hover:border-indigo-200">
                <div className="flex justify-between items-start mb-3">
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            {meeting.tags.map(tag => (
                                <span key={tag} className="px-2 py-1 rounded-md bg-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wide">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 leading-tight">
                            {meeting.title}
                        </h3>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit details</DropdownMenuItem>
                            <DropdownMenuItem>Reschedule</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Cancel meeting</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-6 text-sm text-slate-500 mb-4">
                    <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-indigo-500" />
                        <span>Video Call</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{meeting.attendees.length} Attendees</span>
                    </div>
                </div>

                {meeting.description && (
                    <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 mb-4 border border-slate-100 italic">
                        {meeting.description}
                    </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                    <div className="flex -space-x-2">
                        {meeting.attendees.map((attendee) => (
                            <div
                                key={attendee.id}
                                className={cn(
                                    "w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold",
                                    attendee.color
                                )}
                                title={attendee.initials}
                            >
                                {attendee.image ? (
                                    <img src={attendee.image} alt={attendee.initials} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    attendee.initials
                                )}
                            </div>
                        ))}
                        <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-500">
                            +
                        </div>
                    </div>

                    <Button
                        onClick={() => onJoin?.(meeting.id)}
                        className={cn(
                            "font-semibold shadow-sm transition-all",
                            meeting.isStartingSoon
                                ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                        )}
                    >
                        {meeting.isStartingSoon ? "Join Now" : "View Details"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
