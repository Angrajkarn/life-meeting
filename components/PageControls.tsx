/**
 * PageControls Component
 * 
 * Navigation controls for paginated video grid.
 * Shows current page, total pages, and navigation buttons.
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PageControlsProps {
  currentPage: number;  // 0-indexed
  totalPages: number;
  onPageChange: (page: number) => void;
  participantCount: number;
  tilesPerPage?: number;
}

export function PageControls({
  currentPage,
  totalPages,
  onPageChange,
  participantCount,
  tilesPerPage = 25
}: PageControlsProps) {
  // Don't show controls if only 1 page
  if (totalPages <= 1) {
    return null;
  }

  const startIndex = currentPage * tilesPerPage + 1;
  const endIndex = Math.min((currentPage + 1) * tilesPerPage, participantCount);

  return (
    <div className="flex items-center justify-center gap-4 py-3 bg-slate-800/50 rounded-lg">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className={`
          flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors
          ${currentPage === 0 
            ? 'text-slate-500 cursor-not-allowed' 
            : 'text-white hover:bg-slate-700 active:bg-slate-600'}
        `}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Previous</span>
      </button>

      {/* Page Info */}
      <div className="flex flex-col items-center px-4">
        <span className="text-white font-semibold text-base">
          Page {currentPage + 1} of {totalPages}
        </span>
        <span className="text-slate-400 text-xs">
          Showing {startIndex}-{endIndex} of {participantCount}
        </span>
      </div>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        className={`
          flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors
          ${currentPage === totalPages - 1
            ? 'text-slate-500 cursor-not-allowed'
            : 'text-white hover:bg-slate-700 active:bg-slate-600'}
        `}
        aria-label="Next page"
      >
        <span className="text-sm font-medium">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
