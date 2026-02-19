"use client";

import React, { useState } from 'react';
import { Paperclip, Smile, MoreHorizontal, Download, Trash2, Copy, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { format } from 'date-fns';

import { ChatMessage } from './types';
import { API_URL } from '@/lib/api';

const getFullUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
};

interface MessageItemProps {
    message: ChatMessage;
    isMe: boolean;
    isHost: boolean;
    onReact: (msgId: string, emoji: string) => void;
    onDelete: (msgId: string) => void;
}

export function MessageItem({ message, isMe, isHost, onReact, onDelete }: MessageItemProps) {
    const [showReactions, setShowReactions] = useState(false);

    if (message.is_deleted) {
        return (
            <div className={`text-xs italic text-slate-400 py-1 ${isMe ? 'text-right' : 'text-left'}`}>
                Message removed by host
            </div>
        );
    }
    
    if (message.content.type === 'system') {
        return (
            <div className="flex justify-center my-2">
                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full italic border border-slate-200">
                    {message.content.body}
                </span>
            </div>
        );
    }
    


    const timeString = format(new Date(message.timestamp), 'h:mm a');
    const initials = message.sender_name.substring(0, 2).toUpperCase();
    
    // Group reactions by emoji
    const reactionCounts = message.reactions.reduce((acc: any, curr) => {
        acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
        return acc;
    }, {});

    return (
        <div 
            className={`flex gap-3 group relative ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
        >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-sm ${isMe ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                {initials}
            </div>

            <div className={`flex flex-col max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-700">
                        {message.sender_name}
                        {message.sender_role === 'host' && <span className="ml-1 text-[10px] bg-indigo-100 text-indigo-600 px-1 rounded">Host</span>}
                        {message.scope === 'private' && <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold">PRIVATE</span>}
                    </span>
                    <span className="text-[10px] text-slate-400">{timeString}</span>
                </div>

                {/* Message Bubble */}
                <div className={`rounded-lg shadow-sm border relative group/bubble ${
                    message.scope === 'private' 
                    ? 'bg-red-50 border-red-200 text-slate-800'
                    : isMe 
                        ? 'bg-indigo-600 text-white border-indigo-600 rounded-tr-none' 
                        : 'bg-white border-slate-200 text-slate-700 rounded-tl-none'
                }`}>
                    
                    {/* Content */}
                    <div className="p-1">
                        {message.content.type === 'text' && (
                            <div className={`px-3 py-2 text-sm whitespace-pre-wrap ${message.content.body.length < 5 && message.content.body.match(/[\u{1F300}-\u{1F64F}]/u) ? 'text-4xl px-2 py-1' : ''}`}>
                                {(() => {
                                    // Basic Markdown Parser
                                    let text = message.content.body;
                                    const parts = [];
                                    let lastIndex = 0;
                                    
                                    // Regex for bold, italic, code, strikethrough, link
                                    // Note: Order matters. Code first to avoid parsing inside code.
                                    const regex = /(\*\*(.*?)\*\*)|(\*(.*?)\*)|(`(.*?)`)|(~~(.*?)~~)|((https?:\/\/[^\s]+))/g;
                                    
                                    let match;
                                    while ((match = regex.exec(text)) !== null) {
                                        if (match.index > lastIndex) {
                                            parts.push(<span key={lastIndex}>{text.substring(lastIndex, match.index)}</span>);
                                        }
                                        
                                        const [full, bold, bText, italic, iText, code, cText, strike, sText, link] = match;
                                        
                                        if (bold) parts.push(<strong key={match.index}>{bText}</strong>);
                                        else if (italic) parts.push(<em key={match.index}>{iText}</em>);
                                        else if (code) parts.push(<code key={match.index} className="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono text-red-500">{cText}</code>);
                                        else if (strike) parts.push(<s key={match.index}>{sText}</s>);
                                        else if (link) parts.push(<a key={match.index} href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{link}</a>);
                                        
                                        lastIndex = regex.lastIndex;
                                    }
                                    
                                    if (lastIndex < text.length) {
                                        parts.push(<span key={lastIndex}>{text.substring(lastIndex)}</span>);
                                    }
                                    
                                    return parts.length > 0 ? parts : text;
                                })()}
                            </div>
                        )}

                        {message.content.type === 'image' && message.content.fileUrl && (
                             <div className="relative">
                                <img 
                                    src={getFullUrl(message.content.fileUrl)} 
                                    alt="Shared image" 
                                    className="max-w-[250px] max-h-[200px] rounded object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(getFullUrl(message.content.fileUrl), '_blank')}
                                />
                                {message.content.body && <div className="px-2 py-1 text-sm bg-black/20 text-white truncate max-w-[250px] absolute bottom-0 w-full">{message.content.body}</div>}
                             </div>
                        )}

                        {message.content.type === 'file' && (
                            <div className={`flex items-center gap-3 p-3 min-w-[200px] ${isMe ? 'bg-indigo-700/30' : 'bg-slate-50'}`}>
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col overflow-hidden flex-1">
                                    <span className="text-sm font-medium truncate">{message.content.fileName || 'File'}</span>
                                    <span className="text-[10px] opacity-70">{message.content.fileSize || 'Attachment'}</span>
                                </div>
                                <a 
                                    href={getFullUrl(message.content.fileUrl)} 
                                    download 
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 hover:bg-black/10 rounded transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Reactions Display - WhatsApp Style */}
                    {Object.keys(reactionCounts).length > 0 && (
                        <div className={`absolute -bottom-2 ${isMe ? 'right-0' : 'left-0'} bg-white shadow py-0.5 px-1 rounded-full flex items-center gap-0.5 z-10 translate-y-1/2 border border-slate-200`}>
                            {/* Sort by count descending and take top 3 */}
                            {Object.entries(reactionCounts)
                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                .slice(0, 3)
                                .map(([emoji]) => (
                                    <span key={emoji} className="text-[12px] -ml-0.5 first:ml-0 leading-none">{emoji}</span>
                                ))}
                            
                            {/* Total Count if > 1 */}
                            {message.reactions.length > 1 && (
                                <span className="text-[10px] font-medium text-slate-500 ml-0.5">{message.reactions.length}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions Menu (Hover) - Inline Reactions */}
            <div className={`flex items-center opacity-0 group-hover:opacity-100 transition-all duration-200 absolute -top-5 ${isMe ? 'right-0' : 'left-0'} z-20`}>
                <div className="bg-white border border-slate-200 rounded-full shadow-md flex items-center p-0.5 gap-0.5 animate-in fade-in zoom-in-95 duration-200">
                    {['👍', '❤️', '😂', '😮', '😢', '🔥'].map(emoji => (
                        <button 
                           key={emoji} 
                           onClick={() => onReact(message.id, emoji)} 
                           className="w-7 h-7 flex items-center justify-center text-sm hover:bg-slate-100 rounded-full transition-all hover:scale-125 active:scale-95"
                        >
                           {emoji}
                        </button>
                    ))}
                    
                    {(isHost || isMe) && (
                       <>
                           <div className="w-px h-4 bg-slate-200 mx-1"></div>
                           <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                   <button className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded-full text-slate-500 hover:text-red-600 transition-colors">
                                       <MoreHorizontal className="w-4 h-4" />
                                   </button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent>
                                   {(isHost) && (
                                       <DropdownMenuItem onClick={() => onDelete(message.id)} className="text-red-600 flex gap-2">
                                           <Trash2 className="w-4 h-4" /> Delete Message
                                       </DropdownMenuItem>
                                   )}
                                   {!isHost && isMe && (
                                        <DropdownMenuItem className="text-slate-500 text-xs italic" disabled>
                                           No actions
                                        </DropdownMenuItem>
                                   )}
                               </DropdownMenuContent>
                           </DropdownMenu>
                       </>
                   )}
                </div>
            </div>
        </div>
    );
}
