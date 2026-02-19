"use client";

import React, { useEffect, useState } from 'react';

interface FloatingReactionProps {
  emoji: string;
  userName: string;
  userId: string;
  onComplete: () => void;
}

export function FloatingReaction({ emoji, userName, userId, onComplete }: FloatingReactionProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(query.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    query.addEventListener('change', listener);
    return () => query.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    // Auto-dismiss after duration
    const duration = prefersReducedMotion ? 1000 : 3000;
    const timeout = setTimeout(onComplete, duration);

    // Screen reader announcement
    announceReaction(userName, emoji);

    return () => clearTimeout(timeout);
  }, [prefersReducedMotion, onComplete, userName, emoji]);

  const announceReaction = (userName: string, emoji: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = `${userName} reacted with ${emoji}`;

    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  };

  return (
    <div
      className={`
        absolute bottom-4 right-4 text-6xl pointer-events-none z-50
        ${prefersReducedMotion ? 'animate-fade-in' : 'animate-float-up'}
      `}
      role="img"
      aria-label={`${userName} reacted with ${emoji}`}
    >
      {emoji}
    </div>
  );
}
