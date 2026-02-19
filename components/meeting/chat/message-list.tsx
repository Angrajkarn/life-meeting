"use client";

import React, { useRef, useEffect } from 'react';
import { MessageItem } from './message-item';
import { ChatMessage } from './types';

interface MessageListProps {
    messages: ChatMessage[];
    currentUserId: string;
    isHost: boolean;
    onReact: (msgId: string, emoji: string) => void;
    onDelete: (msgId: string) => void;
}

export function MessageList({ messages, currentUserId, isHost, onReact, onDelete }: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-scroll to bottom on new message
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50/50">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs">Start the conversation!</p>
                </div>
            )}
            
            {messages.map((msg, i) => (
                <MessageItem
                    key={msg.id || i}
                    message={msg}
                    isMe={msg.sender_id === currentUserId}
                    isHost={isHost}
                    onReact={onReact}
                    onDelete={onDelete}
                />
            ))}
            <div ref={bottomRef} />
        </div>
    );
}
