"use client";

import React, { useState, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import { Calendar, Search, Filter, Plus, Clock, RefreshCw } from 'lucide-react';
import { DateSelector } from './DateSelector';
import { MeetingCard } from './MeetingCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSocket } from '@/lib/socket';
import { toast } from 'sonner';
import { ScheduleMeetingModal } from '@/components/schedule-meeting-modal';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { AlertTriangle } from 'lucide-react';

export function UpcomingMeetings({ userId }: { userId: string }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState<any>(null);
  const { lastMessage } = useSocket('dashboard', userId);

  const fetchMeetings = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/meetings/upcoming');
      setMeetings(data);
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
      toast.error('Failed to load upcoming meetings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  // Listen for real-time status changes and creations
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === 'meeting_status_change') {
      const { meeting_id, status } = lastMessage.data;
      setMeetings(prev => prev.map(m => 
        m.id === meeting_id ? { ...m, status } : m
      ));
      
      if (status === 'join_now') {
        const meeting = meetings.find(m => m.id === meeting_id);
        toast(`Meeting starting: ${meeting?.title ?? 'A meeting'} is ready to join!`, {
          icon: <Clock className="w-4 h-4 text-indigo-500" />
        });
      }
    }

    if (lastMessage.type === 'meeting_updated') {
      const updatedData = lastMessage.meeting;
      setMeetings(prev => prev.map(m => 
        m.id === updatedData.id ? { ...m, ...updatedData } : m
      ));
    }

    if (lastMessage.type === 'meeting_deleted') {
      const { meeting_id } = lastMessage;
      setMeetings(prev => prev.filter(m => m.id !== meeting_id));
      toast.info("A meeting was cancelled");
    }

    if (lastMessage.type === 'meeting_created') {
      const newMeeting = lastMessage.meeting;
      // Add to list if it matches the current user's visibility
      setMeetings(prev => {
        if (prev.some(m => m.id === newMeeting.id)) return prev;
        return [...prev, newMeeting].sort((a, b) => 
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
      });
      
      toast.info(`New meeting scheduled: ${newMeeting.title}`, {
        description: `Starts at ${format(new Date(newMeeting.start_time), 'p')}`,
        icon: <Calendar className="w-4 h-4 text-indigo-500" />
      });
    }
  }, [lastMessage]);

  const filteredMeetings = meetings.filter(m => {
    const matchesDate = isSameDay(new Date(m.start_time), selectedDate);
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDate && matchesSearch;
  });

  const handleEdit = (meeting: any) => {
    setCurrentMeeting(meeting);
    setIsScheduleModalOpen(true);
  };

  const handleCancelRequest = (meeting: any) => {
    setCurrentMeeting(meeting);
    setIsCancelDialogOpen(true);
  };

  const confirmCancel = async () => {
    if (!currentMeeting) return;
    try {
      await api.delete(`/meetings/${currentMeeting.id}`);
      setMeetings(prev => prev.filter(m => m.id !== currentMeeting.id));
      toast.success("Meeting cancelled successfully");
      setIsCancelDialogOpen(false);
    } catch (error) {
      console.error("Failed to cancel meeting:", error);
      toast.error("Failed to cancel meeting");
    }
  };

  return (
    <div className="flex flex-col w-full max-w-full overflow-x-hidden bg-slate-50/50 p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Upcoming Meetings</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your schedule and join active sessions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 bg-white" onClick={fetchMeetings}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Sync
          </Button>
          <Button 
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
            onClick={() => setIsScheduleModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule
          </Button>
        </div>
      </div>

      {/* Date Selector */}
      <DateSelector 
        selectedDate={selectedDate} 
        onDateSelect={setSelectedDate} 
      />

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search meetings by title..." 
            className="pl-10 h-11 bg-slate-50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="ghost" className="rounded-xl hover:bg-slate-50 text-slate-600 gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {/* Meeting List */}
      <div className="flex-1 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <p className="font-medium">Refreshing your schedule...</p>
          </div>
        ) : filteredMeetings.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2 custom-scrollbar">
            {filteredMeetings.map((meeting) => (
              <MeetingCard 
                key={meeting.id}
                meeting={meeting}
                currentUserId={userId}
                onJoin={(code) => {
                  window.location.href = `/meeting/${code}`;
                }}
                onEdit={() => handleEdit(meeting)}
                onCancel={() => handleCancelRequest(meeting)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-80 bg-white rounded-3xl border border-dashed border-slate-300 gap-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
              <Calendar className="w-10 h-10 text-slate-300" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">No meetings scheduled</h3>
              <p className="text-slate-500 max-w-[280px] mt-1">
                You're all clear for {format(selectedDate, 'MMMM d')}. Enjoy your day!
              </p>
            </div>
            <Button 
              variant="outline" 
              className="rounded-xl border-slate-200"
              onClick={() => setIsScheduleModalOpen(true)}
            >
              Schedule something
            </Button>
          </div>
        )}
      </div>

      <ScheduleMeetingModal 
        open={isScheduleModalOpen} 
        onOpenChange={(open) => {
          setIsScheduleModalOpen(open);
          if (!open) setCurrentMeeting(null);
        }} 
        editingMeeting={currentMeeting}
        onSuccess={fetchMeetings}
      />

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white rounded-2xl border-none shadow-2xl">
          <DialogHeader>
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900">Cancel Meeting?</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Are you sure you want to cancel <span className="text-slate-900 font-bold">"{currentMeeting?.title}"</span>? This action cannot be undone and will notify all participants.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-3 mt-6">
            <DialogClose asChild>
              <Button variant="ghost" className="flex-1 font-bold text-slate-500 rounded-xl">No, Keep it</Button>
            </DialogClose>
            <Button 
              onClick={confirmCancel}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-100 h-11"
            >
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
