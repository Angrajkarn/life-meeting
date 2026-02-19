"use client";

import React from 'react';
import { format, isToday, isTomorrow } from 'date-fns';
import { 
  Video, 
  MapPin, 
  Clock, 
  Users, 
  Edit2, 
  Trash2, 
  Copy, 
  ExternalLink,
  MoreVertical,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';

interface MeetingCardProps {
  meeting: {
    id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    status: 'scheduled' | 'starting_soon' | 'join_now' | 'live' | 'ended';
    host_id: string;
    attendees: any[];
    code: string;
  };
  currentUserId: string;
  onJoin: (code: string) => void;
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export function MeetingCard({ meeting, currentUserId, onJoin, onEdit, onCancel }: MeetingCardProps) {
  const startTime = new Date(meeting.start_time);
  const endTime = new Date(meeting.end_time);
  const isHost = meeting.host_id === currentUserId;

  const getStatusBadge = () => {
    switch (meeting.status) {
      case 'join_now':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold animate-pulse border border-emerald-200">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Join Now
          </span>
        );
      case 'live':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
            In Progress
          </span>
        );
      case 'starting_soon':
        return (
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">
            Starting Soon
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
            Scheduled
          </span>
        );
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/meeting/${meeting.code}`;
    navigator.clipboard.writeText(link);
    toast.success('Meeting link copied to clipboard');
  };

  const downloadICS = async () => {
    try {
      const response = await fetch(`${API_URL}/meetings/${meeting.id}/ics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meeting_${meeting.code}.ics`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Calendar invitation downloaded');
      } else {
        toast.error('Failed to generate calendar file');
      }
    } catch (error) {
      console.error('ICS error:', error);
      toast.error('Failed to download calendar invitation');
    }
  };

  return (
    <div className="group relative flex flex-col md:flex-row gap-6 p-6 bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 hover:border-indigo-100">
      {/* Time Sidebar */}
      <div className="flex flex-col md:w-32 items-center justify-center md:border-r border-slate-100 shrink-0">
        <span className="text-2xl font-black text-slate-900 leading-none">
          {format(startTime, 'HH:mm')}
        </span>
        <span className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-tighter">
          {format(endTime, 'HH:mm')}
        </span>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                {meeting.title}
              </h3>
              {getStatusBadge()}
            </div>
            {meeting.description && (
              <p className="text-sm text-slate-500 line-clamp-1">{meeting.description}</p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem className="gap-2" onClick={copyLink}>
                <Copy className="w-4 h-4" /> Copy Link
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={downloadICS}>
                <Calendar className="w-4 h-4" /> Download ICS
              </DropdownMenuItem>
              {isHost && (
                <>
                  <DropdownMenuItem className="gap-2" onClick={() => onEdit?.(meeting.id)}>
                    <Edit2 className="w-4 h-4" /> Edit Subject
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => onCancel?.(meeting.id)}>
                    <Trash2 className="w-4 h-4" /> Cancel Meeting
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-500 text-sm">
          <div className="flex items-center gap-1.5 font-medium">
            <Users className="w-4 h-4 text-emerald-500" />
            <span>{meeting.attendees.length} Participants</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Video className="w-4 h-4 text-indigo-500" />
            <span>Video Conference</span>
          </div>
          {isHost && (
            <div className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold uppercase text-slate-500">
              Organizer
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex items-center shrink-0">
        <Button
          onClick={() => onJoin(meeting.code)}
          disabled={meeting.status === 'scheduled' || meeting.status === 'ended'}
          className={`
            w-full md:w-32 h-12 rounded-xl text-sm font-bold shadow-lg transition-all
            ${(meeting.status === 'join_now' || meeting.status === 'live')
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}
          `}
        >
          {meeting.status === 'ended' ? 'Ended' : 'Join Now'}
          {(meeting.status === 'join_now' || meeting.status === 'live') && (
            <ExternalLink className="w-4 h-4 ml-2" />
          )}
        </Button>
      </div>
    </div>
  );
}
