"use client";

import React, { useRef } from 'react';
import { format, addDays, isSameDay, startOfToday } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateSelectorProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export function DateSelector({ selectedDate, onDateSelect }: DateSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = startOfToday();
  
  // Generate next 30 days
  const dates = Array.from({ length: 30 }, (_, i) => addDays(today, i));

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative flex items-center w-full max-w-full px-2 py-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      <button 
        onClick={() => scroll('left')}
        className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500 shrink-0"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth px-4 flex-1 items-center min-w-0"
      >
        {dates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          
          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateSelect(date)}
              className={`
                flex flex-col items-center min-w-[64px] py-3 px-2 rounded-xl transition-all duration-200
                ${isSelected 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105' 
                  : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'}
              `}
            >
              <span className={`text-[10px] uppercase tracking-wider font-bold mb-1 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                {format(date, 'EEE')}
              </span>
              <span className="text-lg font-bold">
                {format(date, 'd')}
              </span>
              {isToday && !isSelected && (
                <div className="w-1 h-1 bg-indigo-500 rounded-full mt-1" />
              )}
            </button>
          );
        })}
      </div>

      <button 
        onClick={() => scroll('right')}
        className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500 shrink-0"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
