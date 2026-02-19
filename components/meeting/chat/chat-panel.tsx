"use client";

import React, { useState, useEffect } from 'react';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { ChatMessage } from './types';
import { X, Lock, Unlock, MoreHorizontal, Trash2 } from 'lucide-react';
import { getChatHistory } from "@/lib/api";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatPanelProps {
    socket: WebSocket | null;
    lastMessage: any;
    meetingId: string;
    currentUser: { id: string; name: string; role: string };
    participants: { id: string; name: string; role: string }[];
    onClose: () => void;
    canChat: boolean;
    isChatLocked: boolean;
    messages: ChatMessage[];
    onReaction: (msgId: string, emoji: string) => void;
    onDeleteMessage: (msgId: string) => void;
}

export function ChatPanel({ socket, lastMessage, meetingId, currentUser, participants, onClose, canChat, isChatLocked, messages, onReaction, onDeleteMessage }: ChatPanelProps) {
    // Internal state moved to parent (page.tsx) to persist across panel unmounts
    // const [messages, setMessages] = useState<ChatMessage[]>([]);

    const handleSendMessage = (content: { type: string, body: string, fileUrl?: string, fileName?: string, fileSize?: string }, scope: string, targetId?: string) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            const payload = {
                type: 'chat_message',
                content,
                scope,
                targetId,
                sender_name: currentUser.name // Redundant but useful for fallback
            };
            socket.send(JSON.stringify(payload));
        }
    };

    const handleReact = (messageId: string, emoji: string) => {
        // Delegated to parent (via prop or direct socket if we keep socket here)
        // Actually, we can just send socket message here, but optimistic update relies on parent
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'chat_reaction',
                messageId,
                emoji
            }));
        }
    };

    const handleDelete = (messageId: string) => {
        if (confirm("Delete this message?")) {
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({
                    type: 'chat_moderation',
                    action: 'delete',
                    targetId: messageId
                }));
            }
        }
    };

    const isHost = currentUser.role === 'host' || currentUser.role === 'co-host';

    return (
        <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">In-Call Messages</h3>
                <div className="flex items-center gap-1">
                    {isHost && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                    if (socket && socket.readyState === WebSocket.OPEN) {
                                        socket.send(JSON.stringify({
                                            type: 'chat_moderation',
                                            action: isChatLocked ? 'unlock_chat' : 'lock_chat' // Logic inverted based on state
                                        }));
                                    }
                                }}>
                                    {isChatLocked ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                                    {isChatLocked ? "Unlock Chat" : "Lock Chat"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                    if (confirm("Clear all chat history for everyone?")) {
                                        if (socket && socket.readyState === WebSocket.OPEN) {
                                            socket.send(JSON.stringify({ type: 'chat_moderation', action: 'clear' }));
                                        }
                                    }
                                }} className="text-red-600">
                                    <Trash2 className="w-4 h-4 mr-2" /> Clear Chat
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* List */}
            <MessageList 
                messages={messages} 
                currentUserId={currentUser.id}
                isHost={isHost}
                onReact={handleReact}
                onDelete={handleDelete}
            />

            {/* Input */}
            {canChat ? (
                <ChatInput 
                    onSendMessage={handleSendMessage} 
                    participants={participants}
                    currentUserId={currentUser.id}
                    isChatDisabled={!canChat}
                />
            ) : (
                <div className="p-4 bg-slate-100 border-t border-slate-200 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Chat is disabled by the host</span>
                </div>
            )}
        </div>
    );
}
