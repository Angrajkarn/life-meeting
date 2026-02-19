"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, Pin, VideoOff, User } from 'lucide-react';
import type { ParticipantPresence } from '../lib/gridLayout';
import { getVideoVisibilityObserver } from '../lib/videoVisibilityObserver';
import { ParticipantMenu } from './meeting/ParticipantMenu';

interface VideoTileProps {
  participant: ParticipantPresence;
  stream?: MediaStream;
  isPinned?: boolean;
  isSpotlighted?: boolean;
  isLocal?: boolean;
  onPin?: () => void;
  // Enterprise Menu Props
  currentUserId?: string;
  currentUserRole?: string;
  meetingId?: string;
}

export function VideoTile({
  participant,
  stream,
  isPinned = false,
  isSpotlighted = false,
  isLocal = false,
  onPin,
  currentUserId,
  currentUserRole,
  meetingId
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isAudioBlocked, setIsAudioBlocked] = useState(false);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream && participant.is_video_on) {
      videoRef.current.srcObject = stream;
      
      const attemptPlay = async () => {
          try {
              // Reset blocked state on new stream load
              if (isLocal) {
                  videoRef.current!.muted = true;
              }
              await videoRef.current!.play();
              setIsAudioBlocked(false);
          } catch (err: any) {
              if (err.name === 'NotAllowedError') {
                  console.warn(`[VideoTile] Autoplay blocked for ${participant.name}. Falling back to muted.`);
                  // Fallback: Mute and play
                  if (videoRef.current) {
                      videoRef.current.muted = true;
                      try {
                          await videoRef.current.play();
                          setIsAudioBlocked(true); // Notify UI to show "Unmute" button
                      } catch (mutedErr) {
                          console.error(`[VideoTile] Failed to play muted video for ${participant.name}:`, mutedErr);
                      }
                  }
              } else if (err.name !== 'AbortError') {
                   console.error(`[VideoTile] Failed to play video for ${participant.name}:`, err);
              }
          }
      };

      attemptPlay();
    }
  }, [stream, participant.is_video_on, isLocal, participant.name]);

  // Enterprise: Visibility Observer for performance optimization
  // Automatically pause off-screen videos to save CPU/GPU
  useEffect(() => {
    const videoElement = videoRef.current;
    
    // Only observe remote videos (not local, to keep local preview always active)
    if (videoElement && !isLocal && stream && participant.is_video_on) {
      const observer = getVideoVisibilityObserver();
      
      observer.observe(
        participant.user_id,
        videoElement,
        (visible) => {
          setIsVisible(visible);
          console.log(`[VideoTile] ${participant.name} visibility: ${visible}`);
        }
      );

      return () => {
        observer.unobserve(participant.user_id);
      };
    }
  }, [participant.user_id, participant.name, participant.is_video_on, isLocal, stream]);

  // Generate initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate gradient from color or name
  const getGradient = (color: string) => {
    // Map of tailwind colors to gradients
    const gradients: Record<string, string> = {
      'bg-red-500': 'bg-gradient-to-br from-red-500 to-rose-700',
      'bg-blue-500': 'bg-gradient-to-br from-blue-500 to-indigo-700',
      'bg-green-500': 'bg-gradient-to-br from-emerald-500 to-teal-700',
      'bg-yellow-500': 'bg-gradient-to-br from-amber-500 to-orange-700',
      'bg-purple-500': 'bg-gradient-to-br from-purple-500 to-fuchsia-700',
      'bg-pink-500': 'bg-gradient-to-br from-pink-500 to-rose-700',
      'bg-indigo-500': 'bg-gradient-to-br from-indigo-500 to-blue-700',
      'bg-gray-500': 'bg-gradient-to-br from-slate-500 to-zinc-700',
    };
    
    // Default fallback if exact match not found
    return gradients[color] || 'bg-gradient-to-br from-slate-600 to-slate-800';
  };

  const unmuteVideo = () => {
      if (videoRef.current) {
          videoRef.current.muted = false;
          setIsAudioBlocked(false);
      }
  };

  return (
    <div
      className={`
        relative w-full h-full rounded-xl overflow-hidden shadow-xl
        bg-slate-900 transition-all duration-300 group
        ${participant.is_speaking ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-900' : 'ring-1 ring-slate-700/50'}
        ${isSpotlighted ? 'ring-4 ring-indigo-500 ring-offset-4 ring-offset-slate-900' : ''}
        ${participant.presence === 'reconnecting' ? 'opacity-60' : ''}
      `}
    >
      {/* Video or Avatar */}
      {participant.is_video_on && stream ? (
        <>
            <video
            ref={videoRef}
            playsInline
            muted={isLocal} // Initial state, controlled by ref interaction later
            className="w-full h-full object-cover"
            />
            {/* Autoplay Blocked Overlay */}
            {isAudioBlocked && !isLocal && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 pointer-events-none">
                    <button 
                        onClick={unmuteVideo}
                        className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full font-medium transition-colors shadow-lg animate-bounce"
                    >
                        <MicOff className="w-4 h-4" />
                        Click to Unmute
                    </button>
                </div>
            )}
        </>
      ) : (
        /* Avatar Fallback */
        <div
          className={`w-full h-full flex items-center justify-center ${getGradient(participant.avatar_color)}`}
        >
          {/* Animated pulsing rings for speaking participants */}
          {participant.is_speaking && (
            <>
              <div className="absolute w-32 h-32 rounded-full border-2 border-white/20 animate-ping" />
              <div className="absolute w-24 h-24 rounded-full border-2 border-white/30 animate-pulse" />
            </>
          )}
          
          <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-inner border border-white/20">
            <span className="text-white text-3xl font-semibold tracking-wider">
              {getInitials(participant.name)}
            </span>
          </div>
        </div>
      )}

      {/* Reconnecting Overlay */}
      {participant.presence === 'reconnecting' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-white text-xs font-medium bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
              Reconnecting...
            </span>
          </div>
        </div>
      )}

      {/* Name Label - Glassmorphism */}
      <div className="absolute bottom-3 left-3 max-w-[calc(100%-24px)] flex items-center gap-2 z-10 pointer-events-none">
        <div className="flex items-center gap-2 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-2.5 py-1.5 transition-colors duration-200 pointer-events-auto">
           {/* Audio Indicator */}
           <div className={`p-1 rounded-full ${!participant.is_audio_on ? 'bg-red-500/80 shadow-sm' : 'bg-transparent'}`}>
              {participant.is_audio_on ? (
                participant.is_speaking ? (
                  <div className="flex gap-0.5 items-end h-3">
                    <div className="w-0.5 bg-green-400 animate-[music-bar_0.5s_ease-in-out_infinite]" style={{ height: '60%' }} />
                    <div className="w-0.5 bg-green-400 animate-[music-bar_0.5s_ease-in-out_0.1s_infinite]" style={{ height: '100%' }} />
                    <div className="w-0.5 bg-green-400 animate-[music-bar_0.5s_ease-in-out_0.2s_infinite]" style={{ height: '40%' }} />
                  </div>
                ) : (
                  <Mic className="w-3.5 h-3.5 text-white/70" />
                )
              ) : (
                <MicOff className="w-3 h-3 text-white" />
              )}
           </div>

           <span className="text-white text-sm font-medium truncate shadow-sm">
             {participant.name} {isLocal && '(You)'}
           </span>
        </div>

        {/* Role Badges */}
        {(participant.role === 'host' || participant.role === 'co-host') && (
           <div className="bg-indigo-600/90 backdrop-blur-md px-2 py-1 rounded-md border border-indigo-400/30">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                {participant.role}
              </span>
           </div>
        )}

        {/* Hand Raised Indicator */}
        {participant.is_hand_raised && (
           <div className="bg-yellow-500/90 backdrop-blur-md p-1.5 rounded-full border border-yellow-400/30 animate-bounce">
              <span className="text-sm">✋</span>
           </div>
        )}
      </div>

      {/* Pin Indicator */}
      {isPinned && (
        <div className="absolute top-2 right-2 bg-yellow-500 rounded-full p-1.5">
          <Pin className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Pin Button (Hover) - Legacy */}
      {onPin && !isLocal && !currentUserId && (
        <button
          onClick={onPin}
          className="absolute top-2 right-2 bg-slate-800/80 hover:bg-slate-700 rounded-full p-2 opacity-0 hover:opacity-100 transition-opacity"
        >
          <Pin className="w-4 h-4 text-white" />
        </button>
      )}

      {/* Enterprise Context Menu */}
      {currentUserId && currentUserRole && meetingId && (
          <ParticipantMenu 
              participant={participant}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              meetingId={meetingId}
              isPinned={isPinned}
              isSpotlighted={isSpotlighted}
              onPin={onPin || (() => {})}
          />
      )}
    </div>
  );
}
