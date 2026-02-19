"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DateCarouselProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
}

export function DateCarousel({ selectedDate, onDateSelect }: DateCarouselProps) {
    // Generate next 14 days
    const dates = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            scrollContainerRef.current.scrollBy({
                left: direction === 'right' ? scrollAmount : -scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const monthYear = dates[0].toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-700 tracking-wider bg-slate-100 px-3 py-1 rounded-md">
                    {monthYear}
                </h3>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => scroll('left')} className="h-8 w-8 hover:bg-slate-100 rounded-full">
                        <ChevronLeft className="h-4 w-4 text-slate-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => scroll('right')} className="h-8 w-8 hover:bg-slate-100 rounded-full">
                        <ChevronRight className="h-4 w-4 text-slate-600" />
                    </Button>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {dates.map((date, index) => {
                    const selected = isSameDay(date, selectedDate);
                    return (
                        <button
                            key={index}
                            onClick={() => onDateSelect(date)}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[80px] h-[90px] rounded-xl border transition-all snap-start",
                                selected
                                    ? "bg-indigo-50 border-indigo-600 shadow-sm ring-1 ring-indigo-600"
                                    : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                            )}
                        >
                            <span className={cn(
                                "text-xs font-medium mb-1",
                                selected ? "text-indigo-600" : "text-slate-500"
                            )}>
                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <span className={cn(
                                "text-2xl font-bold",
                                selected ? "text-indigo-700" : "text-slate-900"
                            )}>
                                {date.getDate()}
                            </span>
                            {selected && <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                        </button>
                    );
                })}
            </div>
            {/* Scroll Progress Bar visual (optional) */}
            <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-300 w-1/3 rounded-full" />
            </div>
        </div>
    );
}
