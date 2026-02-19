/**
 * Reconnecting Overlay Component
 * 
 * Shows animated overlay when participant is reconnecting.
 * Provides visual feedback about connection status.
 */

import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ReconnectingOverlayProps {
  participantName: string;
  presence: 'connected' | 'reconnecting' | 'disconnected';
}

export function ReconnectingOverlay({ participantName, presence }: ReconnectingOverlayProps) {
  if (presence === 'connected') {
    return null;
  }

  return (
    <div 
      className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10 animate-fade-in"
      role="status"
      aria-live="polite"
      aria-label={`${participantName} is ${presence}`}
    >
      <div className="flex flex-col items-center gap-3 text-white">
        {/* Animated Icon */}
        <div className="relative">
          {presence === 'reconnecting' ? (
            <div className="animate-pulse">
              <Wifi className="w-12 h-12 text-yellow-400" />
            </div>
          ) : (
            <WifiOff className="w-12 h-12 text-red-400" />
          )}
          
          {/* Ripple Animation for Reconnecting */}
          {presence === 'reconnecting' && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-ping opacity-75" />
              <div className="absolute inset-0 rounded-full border-2 border-yellow-400 animate-ping opacity-50" style={{ animationDelay: '0.5s' }} />
            </>
          )}
        </div>

        {/* Status Text */}
        <div className="text-center">
          <p className="font-semibold text-lg">
            {presence === 'reconnecting' ? 'Reconnecting...' : 'Connection Lost'}
          </p>
          <p className="text-sm text-slate-300 mt-1">
            {presence === 'reconnecting' 
              ? 'Please wait while we restore the connection' 
              : 'User has disconnected from the meeting'}
          </p>
        </div>

        {/* Progress Dots for Reconnecting */}
        {presence === 'reconnecting' && (
          <div className="flex gap-2 mt-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}
