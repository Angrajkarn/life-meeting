"use client";

import React, { useState, useRef, KeyboardEvent } from 'react';
import { Smile, Paperclip, SendHorizontal, Image as ImageIcon, X, ChevronUp, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { API_URL } from '@/lib/api';

interface ChatInputProps {
    onSendMessage: (content: { type: string, body: string, fileUrl?: string, fileName?: string, fileSize?: string }, scope: string, targetId?: string) => void;
    participants: { id: string; name: string; role: string }[];
    currentUserId: string;
    isChatDisabled: boolean;
}

export function ChatInput({ onSendMessage, participants, currentUserId, isChatDisabled }: ChatInputProps) {
    const [message, setMessage] = useState("");
    const [scope, setScope] = useState("public"); // public or private
    const [targetId, setTargetId] = useState<string | undefined>(undefined);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = () => {
        if (!message.trim()) return;
        
        onSendMessage({ type: 'text', body: message }, scope, targetId);
        setMessage("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const addEmoji = (emoji: string) => {
        setMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            
            if (res.ok) {
                const type = file.type.startsWith('image/') ? 'image' : 'file';
                onSendMessage({
                    type: type,
                    body: data.original_name, // Caption or filename
                    fileUrl: data.url, // Store relative URL
                    fileName: data.original_name,
                    fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`
                }, scope, targetId);
            } else {
                console.error("Upload failed", data);
                alert("Upload failed");
            }
        } catch (err) {
            console.error("Upload error", err);
            alert("Upload error");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Filter participants for "Send to" dropdown (exclude self)
    const validTargets = participants.filter(p => p.id !== currentUserId);
    const targetName = targetId ? participants.find(p => p.id === targetId)?.name : "Everyone";

    return (
        <div className="p-4 border-t border-slate-200 bg-white relative">
            {/* Target Selector */}
            <div className="flex items-center gap-2 mb-2 text-xs">
                <span className="text-slate-500">To:</span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 font-medium transition-colors ${scope === 'private' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>
                            {scope === 'public' ? 'Everyone' : targetName}
                            <ChevronUp className="w-3 h-3 opacity-50" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 max-h-60 overflow-y-auto">
                        <DropdownMenuItem onClick={() => { setScope("public"); setTargetId(undefined); }}>
                            <div className="flex items-center justify-between w-full">
                                <span>Everyone</span>
                                {scope === 'public' && <Check className="w-3 h-3" />}
                            </div>
                        </DropdownMenuItem>
                       
                        {validTargets.length > 0 && <div className="h-px bg-slate-100 my-1" />}
                        {validTargets.length > 0 && <div className="px-2 py-1 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Direct Message</div>}
                        
                        {validTargets.map(p => (
                             <DropdownMenuItem key={p.id} onClick={() => { setScope("private"); setTargetId(p.id); }}>
                                <div className="flex items-center justify-between w-full">
                                    <span className="truncate">{p.name}</span>
                                    {targetId === p.id && <Check className="w-3 h-3" />}
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
                <div className="absolute bottom-full left-4 mb-2 bg-white border border-slate-200 rounded-lg shadow-xl p-3 w-64 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Frequently Used</div>
                        <button onClick={() => setShowEmojiPicker(false)} className="text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                        {['👍', '👎', '👏', '🔥', '❤️', '😂', '😮', '😢', '🎉', '🚀', '💯', '👋', '👀', '✅', '❌', '🤔', '🙏', '🤝'].map(emoji => (
                            <button key={emoji} onClick={() => addEmoji(emoji)} className="hover:bg-slate-100 p-1 rounded transition-colors text-lg">
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className={`bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all ${isChatDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* Hidden Inputs */}
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

                {/* Text Area */}
                <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isChatDisabled ? "Chat disabled" : (scope === 'private' ? `Message to ${targetName}...` : "Type a message to everyone...")}
                    disabled={isChatDisabled || isUploading}
                    className="w-full bg-transparent border-none py-3 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:opacity-50"
                />

                {/* Toolbar */}
                <div className="flex items-center justify-between px-2 pb-2 mt-1">
                    <div className="flex items-center gap-1">
                        <button 
                            type="button" 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`p-1.5 rounded-md transition-colors ${showEmojiPicker ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`} 
                            title="Emoji"
                        >
                            <Smile className="w-4 h-4 stroke-[2.5]" />
                        </button>
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className={`p-1.5 rounded-md transition-colors ${isUploading ? 'text-indigo-400 animate-pulse' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'}`} 
                            title="Attach File"
                        >
                            <Paperclip className="w-4 h-4 stroke-[2.5]" />
                        </button>
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={!message.trim() || isChatDisabled || isUploading}
                        className="p-2 bg-white text-indigo-600 hover:bg-indigo-50 disabled:text-slate-300 disabled:hover:bg-transparent rounded-lg transition-all"
                    >
                        <SendHorizontal className="w-5 h-5 fill-current" />
                    </button>
                </div>
            </div>
            <div className="text-[10px] text-center text-slate-400 mt-2">
                Press <strong>Enter</strong> to send
            </div>
        </div>
    );
}
