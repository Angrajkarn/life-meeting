"use client";

import React, { useMemo } from 'react';
import { VideoTile } from './VideoTile';
import { getTileAspectRatio } from '../lib/gridLayout';
import type { ParticipantPresence } from '../lib/gridLayout';
import { useVideoLayout } from '../lib/hooks/useVideoLayout';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';



interface VideoGridProps {
  participants: ParticipantPresence[];
  videoStreams: Map<string, MediaStream>;
  localUserId: string;
  pinnedUserIds?: string[];  // Array of pinned user IDs
  spotlightedUserIds?: string[];  // Array of spotlighted user IDs
  onPinParticipant?: (userId: string) => void;
  // Enterprise Props
  currentUserRole?: string;
  meetingId?: string;
  activeSpeakerId?: string | null;
  maxGallerySize?: number;
  viewMode?: string;
}

export function VideoGrid({
  participants,
  videoStreams,
  localUserId,
  pinnedUserIds = [],
  spotlightedUserIds = [],
  onPinParticipant,
  activeSpeakerId = null,
  currentUserRole,
  meetingId,
  maxGallerySize = 25,
  viewMode = 'gallery'
}: VideoGridProps) {
  const {
    paginatedParticipants,
    mainStageParticipants,
    sidebarParticipants,
    gridConfig,
    page,
    totalPages,
    nextPage,
    prevPage,
    togglePin,
    layoutMode
  } = useVideoLayout({
    participants,
    localUserId,
    spotlightedUserIds,
    activeSpeakerId,
    pinnedUserIds,
    maxGallerySize,
    viewMode
  });

  // Get aspect ratio for tiles
  const aspectRatio = useMemo(() => {
    return getTileAspectRatio(paginatedParticipants.length);
  }, [paginatedParticipants.length]);

  // --- SIDEBAR / SPEAKER LAYOUT ---
  if (layoutMode === 'sidebar' && mainStageParticipants && mainStageParticipants.length > 0) {
      return (
          <div className="flex h-full w-full gap-4 p-4 overflow-hidden">
              {/* Main Stage (Left/Top) */}
              <div className="flex-1 h-full min-w-0 flex items-center justify-center bg-black/20 rounded-2xl relative">
                  {/* If multiple main stage users (e.g. screen share + pin), split them */}
                  {mainStageParticipants.map((participant, index) => (
                       <div key={participant.user_id} className={`w-full h-full ${mainStageParticipants.length > 1 ? 'h-1/2' : ''}`}>
                             <VideoTile
                                participant={participant}
                                stream={videoStreams.get(participant.user_id)}
                                isPinned={pinnedUserIds.includes(participant.user_id)}
                                isSpotlighted={spotlightedUserIds.includes(participant.user_id)}
                                isLocal={participant.user_id === localUserId}
                                onPin={onPinParticipant ? () => onPinParticipant(participant.user_id) : undefined}
                                currentUserId={localUserId}
                                currentUserRole={currentUserRole}
                                meetingId={meetingId}
                            />
                       </div>
                  ))}
              </div>

              {/* Sidebar Strip (Right) */}
              {sidebarParticipants && sidebarParticipants.length > 0 && (
                   <div className="w-64 flex flex-col gap-3 h-full overflow-y-auto pr-1 custom-scrollbar">
                       {sidebarParticipants.map(participant => (
                           <div 
                                key={participant.user_id} 
                                className="w-full h-40 flex-shrink-0 animate-in fade-in slide-in-from-right-4 duration-300"
                           >
                                <VideoTile
                                    participant={participant}
                                    stream={videoStreams.get(participant.user_id)}
                                    isPinned={pinnedUserIds.includes(participant.user_id)}
                                    isSpotlighted={spotlightedUserIds.includes(participant.user_id)}
                                    isLocal={participant.user_id === localUserId}
                                    onPin={onPinParticipant ? () => onPinParticipant(participant.user_id) : undefined}
                                    currentUserId={localUserId}
                                    currentUserRole={currentUserRole}
                                    meetingId={meetingId}
                                />
                           </div>
                       ))}
                   </div>
              )}
          </div>
      );
  }

  // --- DEFAULT GRID LAYOUT ---
  return (
    <div className="relative h-full w-full group">
      <div 
        className="h-full w-full p-4 grid gap-4 transition-all duration-500 ease-in-out"
        style={{
          gridTemplateColumns: `repeat(${gridConfig.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridConfig.rows}, minmax(0, 1fr))`
        }}
      >
        {paginatedParticipants.map(participant => (
          <div
            key={participant.user_id}
            className="w-full h-full min-h-0 min-w-0 transition-all duration-300 ease-in-out"
          >
            <VideoTile
              participant={participant}
              stream={videoStreams.get(participant.user_id)}
              isPinned={pinnedUserIds.includes(participant.user_id)}
              isSpotlighted={spotlightedUserIds.includes(participant.user_id)}
              isLocal={participant.user_id === localUserId}
              onPin={onPinParticipant ? () => onPinParticipant(participant.user_id) : undefined}
              currentUserId={localUserId}
              currentUserRole={currentUserRole}
              meetingId={meetingId}
            />
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between pointer-events-none px-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="icon"
            onClick={prevPage}
            disabled={page === 0}
            className={`pointer-events-auto rounded-full shadow-lg bg-black/50 hover:bg-black/70 text-white border-0 ${page === 0 ? 'invisible' : ''}`}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            onClick={nextPage}
            disabled={page === totalPages - 1}
            className={`pointer-events-auto rounded-full shadow-lg bg-black/50 hover:bg-black/70 text-white border-0 ${page === totalPages - 1 ? 'invisible' : ''}`}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      )}
      
      {/* Page Indicator */}
      {totalPages > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/40 px-3 py-1 rounded-full text-white text-xs backdrop-blur-sm pointer-events-none">
          Page {page + 1} / {totalPages}
        </div>
      )}
    </div>
  );
}
