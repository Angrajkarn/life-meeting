"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
}

const REACTION_EMOJIS = ['❤️', '👍', '👏', '🔥', '😂', '😮', '🎉'];

export function ReactionPicker({ onSelect, disabled = false }: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    // Toggle picker with Enter or Space
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSelectedIndex(0);
      }
      return;
    }

    // Close picker with Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      return;
    }

    // Navigate emojis when picker is open
    if (isOpen) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % REACTION_EMOJIS.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + REACTION_EMOJIS.length) % REACTION_EMOJIS.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSelect(REACTION_EMOJIS[selectedIndex]);
      }
    }
  };

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setIsOpen(false);
    setSelectedIndex(0);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`p-2.5 rounded-md transition-all ${
          isOpen ? 'bg-slate-100 text-slate-900' : 'hover:bg-slate-100 text-slate-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label="Send reaction"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title="Reactions"
      >
        <div className="flex flex-col items-center gap-0.5">
          <Smile className="w-5 h-5 stroke-[1.5]" />
          <span className="text-[10px] font-medium hidden md:block">React</span>
        </div>
      </button>

      {isOpen && !disabled && (
        <div
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-slate-200 shadow-xl rounded-full flex gap-2 p-2 animate-in fade-in zoom-in-95 duration-200 z-50"
          role="menu"
          aria-label="Choose reaction"
        >
          {REACTION_EMOJIS.map((emoji, index) => (
            <button
              key={emoji}
              onClick={() => handleSelect(emoji)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`
                text-2xl w-10 h-10 rounded-full flex items-center justify-center
                hover:scale-125 hover:bg-slate-100 transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                ${selectedIndex === index ? 'bg-slate-100 scale-110' : ''}
              `}
              role="menuitem"
              aria-label={`Send ${emoji} reaction`}
              tabIndex={isOpen ? 0 : -1}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
