"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    SendHorizontal, Hash, Video, Circle, Smile, Paperclip, MoreHorizontal, Phone, UserPlus, 
    Image as ImageIcon, AtSign, Plus, MessageSquare, FileText, Download, ExternalLink, 
    Reply, X, Edit2, Trash2, Pin, Copy, Forward, Check, Clock, Bold, Italic, List,
    Search, BellOff, Monitor, Calendar, CircleSlash, File, Folder, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSocket } from "@/lib/socket";
import useSWR, { mutate } from "swr";
import { fetcher, api, API_URL } from "@/lib/api";
import { ScheduleMeetingModal } from "@/components/schedule-meeting-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { format, isToday, isYesterday, formatDistanceToNow, differenceInMinutes } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

const EMOJI_CATEGORIES = [
    { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'] },
    { name: 'Gestures', emojis: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'] },
    { name: 'Hearts', emojis: ['❤', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'] },
];

export default function ChannelPage() {
    const params = useParams();
    const router = useRouter();
    const channelId = params.channelId as string;

    const formatSafeTimestamp = (timestamp: any, formatStr: string = 'p') => {
        if (!timestamp) return "";
        try {
            let dateStr = typeof timestamp === 'string' ? timestamp : timestamp.toString();
            // If ISO string without timezone, append Z (assume UTC from backend)
            if (dateStr.includes('T') && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
                dateStr += 'Z';
            }
            return format(new Date(dateStr), formatStr);
        } catch (e) {
            return "";
        }
    };

    const navigateToDM = (targetUserId: string) => {
        if (!channels || !user) return;
        if (targetUserId === user.id) {
            toast.info("This is you!");
            return;
        }
        
        const dm = channels.find((c: any) => 
            c.type === 'dm' && c.members.includes(targetUserId)
        );
        
        if (dm) {
            router.push(`/dashboard/chat/${dm.id}`);
        } else {
            toast.info("Direct chat not found. You can start one from the sidebar.");
        }
    };

    const renderMessageText = (text: string, mentions?: any[]) => {
        if (!text) return null;
        if (!mentions || mentions.length === 0) return <span className="whitespace-pre-wrap">{text}</span>;

        let parts: any[] = [text];

        mentions.forEach((mention: any) => {
            const mentionText = `@${mention.full_name}`;
            const newParts: any[] = [];

            parts.forEach(part => {
                if (typeof part !== 'string') {
                    newParts.push(part);
                    return;
                }

                const splitParts = part.split(mentionText);
                splitParts.forEach((subPart, i) => {
                    if (subPart) newParts.push(subPart);
                    if (i < splitParts.length - 1) {
                        newParts.push(
                            <span 
                                key={`${mention.user_id}-${i}`}
                                className="text-emerald-600 font-bold bg-emerald-50 px-1 rounded cursor-pointer hover:bg-emerald-100 transition-colors mx-0.5"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToDM(mention.user_id);
                                }}
                            >
                                {mentionText}
                            </span>
                        );
                    }
                });
            });
            parts = newParts;
        });

        return <span className="whitespace-pre-wrap">{parts}</span>;
    };

    const PollRenderer = ({ msg }: { msg: any }) => {
        if (!msg.poll_id || !msg.poll_data) return null;
        
        const totalVotes = msg.poll_data.options.reduce((sum: number, opt: any) => sum + (opt.votes?.length || 0), 0);
        
        return (
            <Card className="w-full max-w-sm mt-3 overflow-hidden border-none shadow-xl shadow-indigo-100/50 animate-in zoom-in-95 duration-300">
                <div className="p-5 bg-gradient-to-br from-indigo-50 to-white">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-6 w-6 bg-indigo-600 rounded flex items-center justify-center">
                            <MessageSquare className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Enterprise Poll</span>
                    </div>
                    <h4 className="font-black text-slate-800 text-base leading-tight mb-4">{msg.poll_data.question}</h4>
                    
                    <div className="space-y-2">
                        {msg.poll_data.options.map((option: any) => {
                            const hasVoted = option.votes?.includes(user?.id);
                            const percentage = totalVotes > 0 ? (option.votes?.length || 0) / totalVotes * 100 : 0;
                            
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleVotePoll(msg.poll_data.id || msg.poll_id, option.id)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden group/opt",
                                        hasVoted ? "border-indigo-200 bg-indigo-50/50" : "border-slate-100 bg-white hover:border-indigo-100"
                                    )}
                                >
                                    <div 
                                        className={cn("absolute inset-y-0 left-0 transition-all duration-1000 ease-out opacity-20", hasVoted ? "bg-indigo-300" : "bg-slate-200")} 
                                        style={{ width: `${percentage}%` }}
                                    />
                                    <div className="relative flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                                                hasVoted ? "border-indigo-600 bg-indigo-600" : "border-slate-200 group-hover/opt:border-indigo-300"
                                            )}>
                                                {hasVoted && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                            <span className={cn("text-sm font-bold", hasVoted ? "text-indigo-900" : "text-slate-700")}>{option.text}</span>
                                        </div>
                                        <span className="text-[10px] font-black tabular-nums text-slate-400">
                                            {option.votes?.length || 0} • {Math.round(percentage)}%
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{totalVotes} Total Votes</span>
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-5 w-5 rounded-full border-2 border-white bg-slate-200" />
                        ))}
                    </div>
                </div>
            </Card>
        );
    };
    
    const [activeTab, setActiveTab] = useState('chat');
    const { data: user } = useSWR('/users/me', fetcher);
    const { data: channel, error: channelError } = useSWR(channelId ? `/chat/channels/${channelId}` : null, fetcher);
    const { data: initialMessages } = useSWR(channelId ? `/chat/channels/${channelId}/messages` : null, fetcher);
    const { data: channelFiles } = useSWR(activeTab === 'files' && channelId ? `/chat/channels/${channelId}/files` : null, fetcher);
    const { data: channelPhotos } = useSWR(activeTab === 'photos' && channelId ? `/chat/channels/${channelId}/photos` : null, fetcher);
    
    const { data: presence } = useSWR('/chat/presence', fetcher, { refreshInterval: 5000 });
    
    // Connect to WebSocket using "dashboard" as the pipe for global updates
    // In a real app, we might use a dedicated "chat" pipe.
    const { socket, status, sendMessage, lastMessage } = useSocket("dashboard", user?.id);

    const [messages, setMessages] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [replyTo, setReplyTo] = useState<any>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
    const [messageToForward, setMessageToForward] = useState<any>(null);
    const { data: channels } = useSWR('/chat/channels', fetcher);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Advanced Input States
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState("");

    // Enterprise Features States
    const [isPollModalOpen, setIsPollModalOpen] = useState(false);
    const [isCanvasModalOpen, setIsCanvasModalOpen] = useState(false);
    const [pollQuestion, setPollQuestion] = useState("");
    const [pollOptions, setPollOptions] = useState(["", ""]);
    const [canvasTitle, setCanvasTitle] = useState("");
    const [canvasContent, setCanvasContent] = useState("");

    // Presence State Management
    const [localPresence, setLocalPresence] = useState<Record<string, string>>({});
    
    // Merge SWR presence into local state
    useEffect(() => {
        if (presence) {
            setLocalPresence(prev => ({ ...presence, ...prev }));
        }
    }, [presence]);

    // Search and Channel Actions States
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    
    // Channel Management States
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleChannelToggle = async (action: 'pin' | 'mute' | 'unread') => {
        try {
            const response = await api.post(`/chat/channels/${channelId}/${action}`, {});
            toast.success(response.detail || `Channel ${action} status updated`);
            mutate(`/chat/channels/${channelId}`);
            mutate('/chat/channels');
        } catch (err) {
            toast.error(`Failed to update channel ${action} status`);
        }
    };

    const fetchSearchResults = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const data = await api.get(`/chat/channels/${channelId}/search?query=${encodeURIComponent(query)}`);
            setSearchResults(data);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery) fetchSearchResults(searchQuery);
            else setSearchResults([]);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);
    const lastCanvasSync = useRef<number>(0);

    // Initial Messages
    useEffect(() => {
        if (initialMessages) {
            setMessages(initialMessages);
        }
    }, [initialMessages]);

    // Handle Incoming WebSocket Events
    useEffect(() => {
        if (!lastMessage) return;

        if (lastMessage.type === "chat:message" && lastMessage.data.channel_id === channelId) {
            setMessages(prev => {
                if (prev.some(m => m.id === lastMessage.data.id)) return prev;
                return [...prev, lastMessage.data];
            });
        }

        if (lastMessage.type === "chat:message_delete") {
            const { id, delete_type, user_id } = lastMessage.data;
            setMessages(prev => {
                if (delete_type === "everyone") {
                    return prev.map(m => m.id === id ? { ...m, is_deleted: true } : m);
                } else if (delete_type === "me" && user_id === user?.id) {
                    return prev.filter(m => m.id !== id);
                }
                return prev;
            });
        }

        if (lastMessage.type === "chat:presence") {
            const { user_id, status } = lastMessage.data;
            setLocalPresence(prev => ({
                ...prev,
                [user_id]: status
            }));
        } else if (lastMessage.type === "chat:status_message") {
            mutate(channelId ? `/chat/channels/${channelId}` : null);
            mutate('/chat/presence');
        }

        if (lastMessage.type === "chat:typing" && lastMessage.data.channel_id === channelId) {
            const { user_id, active_typists } = lastMessage.data;
            if (user_id !== user?.id) {
                setTypingUsers(active_typists.filter((id: string) => id !== user?.id));
            }
        }

        if (lastMessage.type === "poll:update") {
            const { poll_id, options } = lastMessage.data;
            setMessages(prev => prev.map(m => {
                if (m.content?.type === 'poll' && m.content?.poll_id === poll_id) {
                    return { ...m, poll_data: { ...m.poll_data, options } };
                }
                return m;
            }));
        }

        if (lastMessage.type === "canvas:sync" && lastMessage.data.channel_id === channelId) {
            setCanvasContent(lastMessage.data.content);
        }

        if (lastMessage.type === "huddle:invite" && lastMessage.data.channel_id === channelId) {
            toast.info(`Huddle started by ${lastMessage.data.creator_name}`, {
                description: "Team is gathering now",
                action: {
                    label: "Join Huddle",
                    onClick: () => router.push(`/meeting/${lastMessage.data.code}`)
                },
                duration: 10000
            });
        }

        if (lastMessage.type === "chat:channel_deleted" && lastMessage.data.channel_id === channelId) {
            toast.warning("This conversation has been deleted", {
                description: `Deleted by ${lastMessage.data.deleted_by}`
            });
            router.push("/dashboard");
        }
    }, [lastMessage, channelId, user]);

    const getPresenceColor = (uid: string) => {
        const status = localPresence[uid] || "offline";
        switch (status) {
            case "available":
            case "online": return "bg-emerald-500";
            case "busy":
            case "dnd": return "bg-red-500";
            case "away":
            case "brb": return "bg-amber-500";
            default: return "bg-slate-400";
        }
    };

    const getPresenceText = (uid: string) => {
        const status = localPresence[uid] || "offline";
        const map: Record<string, string> = {
            "available": "Available",
            "online": "Available",
            "busy": "Busy",
            "dnd": "Do not disturb",
            "away": "Appear away",
            "brb": "Be right back",
            "offline": "Offline"
        };
        return map[status] || status.charAt(0).toUpperCase() + status.slice(1);
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typingUsers]);

    const scrollToMessage = (msgId: string) => {
        const element = document.getElementById(`msg-${msgId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-indigo-400', 'ring-offset-2');
            setTimeout(() => {
                element.classList.remove('ring-2', 'ring-indigo-400', 'ring-offset-2');
            }, 2000);
        }
    };

    const handleEdit = async (msgId: string) => {
        if (!editValue.trim()) return;
        try {
            await api.patch(`/chat/messages/${msgId}`, { text: editValue });
            setEditingMessageId(null);
            setEditValue("");
            toast.success("Message updated");
        } catch (err) {
            toast.error("Failed to edit message");
        }
    };

    // Enterprise Feature Handlers
    const handleCreatePoll = async () => {
        if (!pollQuestion.trim() || pollOptions.some(opt => !opt.trim())) {
            toast.error("Please fill in the question and all options");
            return;
        }

        try {
            const pollData = {
                channel_id: channelId,
                question: pollQuestion,
                options: pollOptions.map(opt => ({ text: opt, votes: [] }))
            };
            const response = await api.post('/chat/polls', pollData);
            
            setIsPollModalOpen(false);
            setPollQuestion("");
            setPollOptions(["", ""]);
            toast.success("Poll created!");
        } catch (err) {
            toast.error("Failed to create poll");
        }
    };

    const handleVotePoll = async (pollId: string, optionId: string) => {
        try {
            await api.post(`/chat/polls/${pollId}/vote?option_id=${optionId}`, {});
        } catch (err) {
            toast.error("Failed to cast vote");
        }
    };

    const handleCanvasSave = async () => {
        try {
            await api.post('/chat/canvases', {
                channel_id: channelId,
                title: canvasTitle || "Untitled Canvas",
                content: canvasContent
            });
            toast.success("Canvas saved");
        } catch (err) {
            toast.error("Failed to save canvas");
        }
    };

    const handleCanvasChange = (newContent: string) => {
        setCanvasContent(newContent);
        
        // Throttled WebSocket sync
        const now = Date.now();
        if (now - lastCanvasSync.current > 100) {
            sendMessage({
                type: "canvas:sync",
                channel_id: channelId,
                data: { channel_id: channelId, content: newContent }
            });
            lastCanvasSync.current = now;
        }
    };

    const handleStartHuddle = () => {
        sendMessage({
            type: "huddle:start",
            channel_id: channelId
        });
        toast.promise(new Promise(resolve => setTimeout(resolve, 1000)), {
            loading: 'Initializing huddle room...',
            success: 'Huddle invitation sent to channel',
            error: 'Failed to start huddle',
        });
    };

    const handleDelete = async (msgId: string, type: 'me' | 'everyone') => {
        try {
            await api.delete(`/chat/messages/${msgId}?delete_type=${type}`);
            if (type === 'me') {
                setMessages(prev => prev.filter(m => m.id !== msgId));
            }
            toast.success(type === 'everyone' ? "Message deleted for everyone" : "Message deleted for you");
        } catch (err) {
            toast.error("Failed to delete message");
        }
    };

    const handleDeleteChannel = async () => {
        setIsDeleting(true);
        try {
            await api.delete(`/chat/channels/${channelId}`);
            toast.success("Conversation deleted successfully");
            router.push("/dashboard");
        } catch (err) {
            toast.error("Failed to delete conversation");
        } finally {
            setIsDeleting(false);
            setIsDeleteConfirmOpen(false);
        }
    };

    const handlePin = async (msgId: string) => {
        try {
            await api.post(`/chat/messages/${msgId}/pin`, {});
            toast.success("Pin status updated");
        } catch (err) {
            toast.error("Failed to pin message");
        }
    };

    const handleStartCall = async (type: 'video' | 'audio' = 'video') => {
        try {
            const startTime = new Date();
            const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
            
            const res = await api.post('/meetings', {
                title: channel.type === 'dm' 
                    ? `Call with ${channel.member_details?.find((m: any) => m.id !== user?.id)?.full_name || 'Contact'}`
                    : `Huddle: ${channel.name}`,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                type: type,
                settings: {
                    waiting_room: false,
                    mute_on_entry: false,
                    allow_guest_join: true
                }
            });
            
            // Broadcast invitation if in a DM or group channel
            sendMessage({
                type: "huddle:invite",
                channel_id: channelId,
                creator_name: user?.full_name,
                code: res.id
            });

            toast.success(`Starting ${type} call...`);
            window.location.href = `/meeting/${res.id}`;
        } catch (err: any) {
            toast.error(err.message || "Failed to start call");
        }
    };

    const handleForward = async (targetChannelId: string) => {
        if (!messageToForward) return;
        try {
            await api.post('/chat/messages', {
                channel_id: targetChannelId,
                content: messageToForward.content,
                text: messageToForward.content?.body || messageToForward.text
            });
            setIsForwardModalOpen(false);
            setMessageToForward(null);
            toast.success("Message forwarded");
        } catch (err) {
            toast.error("Failed to forward message");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Enterprise Size Limit: 10MB
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size exceeds 10MB limit");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) throw new Error("Upload failed");
            const data = await res.json();
            
            setAttachments(prev => [...prev, {
                id: Math.random().toString(36).substr(2, 9),
                url: data.url,
                filename: data.filename,
                type: data.type,
                size: (file.size / 1024).toFixed(1) + ' KB'
            }]);
            toast.success(`${type === 'image' ? 'Image' : 'File'} uploaded`);
        } catch (err) {
            toast.error("Upload failed. Please try again.");
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    const insertAtCursor = (text: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = inputValue.substring(0, start) + text + inputValue.substring(end);
        
        setInputValue(newValue);
        
        // Return focus and set cursor position after insertion
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + text.length, start + text.length);
        }, 0);
    };

    const handleEmojiSelect = (emoji: string) => {
        insertAtCursor(emoji);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    const canDeleteForEveryone = (timestamp: string) => {
        const msgTime = new Date(timestamp);
        // Ensure we are comparing UTC to UTC or properly relative
        const now = new Date();
        const diff = Math.abs(now.getTime() - msgTime.getTime());
        return diff < 10 * 60 * 1000; // 10 minutes in ms
    };

    const sendTypingStatus = (typing: boolean) => {
        if (status !== 'connected') return;
        sendMessage({
            type: "chat:typing",
            channel_id: channelId,
            is_typing: typing
        });
    };

    const handleSend = () => {
        if ((!inputValue.trim() && attachments.length === 0) || !user || !channelId) return;

        // Extract mentions
        const mentions: any[] = [];
        if (channel?.member_details) {
            channel.member_details.forEach((m: any) => {
                if (inputValue.includes(`@${m.full_name}`)) {
                    mentions.push({
                        user_id: m.id,
                        full_name: m.full_name
                    });
                }
            });
        }
        
        const baseMsg = {
            type: "chat:message",
            channel_id: channelId,
            sender_id: user.id,
            sender_name: user.full_name,
            parent_id: replyTo?.id,
            reply_to_name: replyTo?.sender_name,
            reply_to_content: replyTo?.content?.body || replyTo?.text,
            mentions: mentions
        };

        if (attachments.length > 0) {
            // Send each attachment (or the first one with text)
            attachments.forEach((file, index) => {
                const payload = {
                    ...baseMsg,
                    text: index === 0 ? inputValue : "",
                    content: {
                        type: file.type.startsWith('image/') ? 'image' : 'file',
                        body: index === 0 ? inputValue : "",
                        fileUrl: file.url,
                        fileName: file.filename,
                        fileSize: file.size
                    }
                };
                sendMessage(payload);
            });
        } else {
            sendMessage({
                ...baseMsg,
                text: inputValue,
            });
        }
        
        // Reset
        sendTypingStatus(false);
        setInputValue("");
        setReplyTo(null);
        setAttachments([]);
        textareaRef.current?.focus();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setInputValue(value);
        
        // Typing status
        if (!isTyping) {
            setIsTyping(true);
            sendTypingStatus(true);
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            sendTypingStatus(false);
        }, 3000);

        // Mention Detection
        const lastChar = value[value.length - 1];
        const lastWord = value.split(/\s/).pop() || "";
        
        if (lastChar === "@" || (lastWord.startsWith("@") && lastWord.length > 1)) {
            setShowMentions(true);
            setMentionFilter(lastWord.slice(1).toLowerCase());
        } else {
            setShowMentions(false);
        }
    };

    if (!user || !channel) return <div className="p-10 text-center text-slate-500 animate-pulse">Loading Workspace...</div>;

    const otherMemberId = channel.members.find((m: string) => m !== user.id);

    return (
        <div className="flex flex-col h-full bg-white relative animate-in fade-in duration-500">
            {/* ENTERPRISE HEADER */}
            <div className="shrink-0 bg-white border-b border-slate-100 px-6 pt-4 sticky top-0 z-20 backdrop-blur-md bg-white/80">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="relative group/avatar">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black overflow-hidden shadow-lg shadow-indigo-100 border border-indigo-400/20">
                                {channel.name?.[0]?.toUpperCase() || "C"}
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-white flex items-center justify-center ring-2 ring-white">
                                <div className={cn(
                                    "h-2 w-2 rounded-full",
                                    getPresenceColor(otherMemberId || "")
                                )} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                    {channel.type === 'dm' 
                                        ? channel.member_details?.find((m: any) => m.id !== user?.id)?.full_name || channel.name
                                        : channel.name || "Chat"}
                                </h2>
                                {channel.pinned_users?.includes(user?.id) && <Pin className="h-3 w-3 text-indigo-500 fill-indigo-500" />}
                                {channel.muted_users?.includes(user?.id) && <BellOff className="h-3 w-3 text-slate-400" />}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                {channel.type === 'dm' ? (
                                    <>
                                        <div className={cn(
                                            "h-1.5 w-1.5 rounded-full",
                                            getPresenceColor(otherMemberId || "")
                                        )} />
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-widest",
                                            getPresenceColor(otherMemberId || "").replace('bg-', 'text-')
                                        )}>
                                            {getPresenceText(otherMemberId || "")}
                                        </span>
                                        {channel.member_details?.find((m: any) => m.id === otherMemberId)?.status_message && (
                                            <>
                                                <div className="h-2 w-[1px] bg-slate-200 mx-1" />
                                                <span className="text-[10px] text-slate-500 font-medium italic truncate max-w-[200px]">
                                                    "{channel.member_details?.find((m: any) => m.id === otherMemberId)?.status_message}"
                                                </span>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{channel.member_details?.length || 0} Members</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleStartCall('video')}
                            className="h-10 w-10 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                            <Video className="h-5 w-5" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleStartCall('audio')}
                            className="h-10 w-10 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                        >
                            <Phone className="h-5 w-5" />
                        </Button>
                        <div className="h-5 w-[1px] bg-slate-200 mx-1" />
                        
                        {/* SEARCH BAR (TEAMS STYLE) */}
                        <div className={cn(
                            "flex items-center transition-all duration-300 ease-in-out relative group",
                            isSearchExpanded ? "w-[240px]" : "w-10"
                        )}>
                            <Search 
                                onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                                className={cn(
                                    "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 cursor-pointer z-10 transition-colors",
                                    isSearchExpanded ? "text-indigo-500" : "text-slate-400 hover:text-indigo-600 left-1/2 -translate-x-1/2"
                                )} 
                            />
                            {isSearchExpanded && (
                                <Input 
                                    autoFocus
                                    placeholder="Search conversation..." 
                                    className="w-full pl-9 h-10 bg-indigo-50/50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-indigo-500 transition-all text-sm font-medium pr-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onBlur={() => !searchQuery && setIsSearchExpanded(false)}
                                    onKeyDown={(e) => e.key === 'Escape' && setIsSearchExpanded(false)}
                                />
                            )}
                            {isSearchExpanded && searchQuery && (
                                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 hover:bg-white hover:text-indigo-600 hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-slate-100">
                                    <MoreHorizontal className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 p-2.5 rounded-[24px] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-xl bg-white/95 animate-in slide-in-from-top-2 duration-300">
                                <DropdownMenuLabel className="px-4 pb-3 pt-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Channel Management</DropdownMenuLabel>
                                
                                <div className="space-y-1">
                                    <DropdownMenuItem className="rounded-2xl py-3 px-4 cursor-pointer hover:bg-slate-50/80 group transition-all" onClick={handleStartHuddle}>
                                        <div className="flex items-center w-full">
                                            <div className="bg-indigo-50 p-2 rounded-xl mr-3 group-hover:bg-indigo-100 transition-colors">
                                                <Monitor className="h-4.5 w-4.5 text-indigo-600" />
                                            </div>
                                            <span className="font-bold text-[15px] text-slate-700">Screen Sharing</span>
                                        </div>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem className="rounded-2xl py-3 px-4 cursor-pointer hover:bg-slate-50/80 group transition-all" onClick={() => setIsScheduleModalOpen(true)}>
                                        <div className="flex items-center w-full">
                                            <div className="bg-orange-50 p-2 rounded-xl mr-3 group-hover:bg-orange-100 transition-colors">
                                                <Calendar className="h-4.5 w-4.5 text-orange-600" />
                                            </div>
                                            <span className="font-bold text-[15px] text-slate-700">Schedule Meeting</span>
                                        </div>
                                    </DropdownMenuItem>
                                </div>

                                <DropdownMenuSeparator className="my-2.5 bg-slate-100/50" />

                                <div className="space-y-1">
                                    <DropdownMenuItem className="rounded-2xl py-3 px-4 cursor-pointer hover:bg-slate-50/80 group transition-all" onClick={() => handleChannelToggle('unread')}>
                                        <div className="flex items-center w-full">
                                            <div className="bg-emerald-50 p-2 rounded-xl mr-3 group-hover:bg-emerald-100 transition-colors">
                                                <CircleSlash className="h-4.5 w-4.5 text-emerald-600" />
                                            </div>
                                            <span className="font-bold text-[15px] text-slate-700">Mark as Unread</span>
                                        </div>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem className="rounded-2xl py-3 px-4 cursor-pointer hover:bg-slate-50/80 group transition-all" onClick={() => handleChannelToggle('pin')}>
                                        <div className="flex items-center w-full">
                                            <div className="bg-blue-50 p-2 rounded-xl mr-3 group-hover:bg-blue-100 transition-colors">
                                                <Pin className="h-4.5 w-4.5 text-blue-600" />
                                            </div>
                                            <span className="font-bold text-[15px] text-slate-700">
                                                {channel.pinned_users?.includes(user?.id) ? 'Unpin Channel' : 'Pin Channel'}
                                            </span>
                                        </div>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem className="rounded-2xl py-3 px-4 cursor-pointer hover:bg-slate-50/80 group transition-all" onClick={() => handleChannelToggle('mute')}>
                                        <div className="flex items-center w-full">
                                            <div className="bg-slate-100 p-2 rounded-xl mr-3 group-hover:bg-slate-200 transition-colors">
                                                <BellOff className="h-4.5 w-4.5 text-slate-600" />
                                            </div>
                                            <span className="font-bold text-[15px] text-slate-700">
                                                {channel.muted_users?.includes(user?.id) ? 'Unmute' : 'Mute Notifications'}
                                            </span>
                                        </div>
                                    </DropdownMenuItem>
                                </div>

                                <DropdownMenuSeparator className="my-2.5 bg-slate-100/50" />

                                <DropdownMenuItem 
                                    className="rounded-2xl py-3 px-4 cursor-pointer hover:bg-red-50 group transition-all"
                                    onClick={() => setIsDeleteConfirmOpen(true)}
                                >
                                    <div className="flex items-center w-full">
                                        <div className="bg-red-50 p-2 rounded-xl mr-3 group-hover:bg-red-100 transition-colors">
                                            <Trash2 className="h-4.5 w-4.5 text-red-600" />
                                        </div>
                                        <span className="font-bold text-[15px] text-red-600">Delete Conversation</span>
                                    </div>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Modals for Channel Management */}
                        <ScheduleMeetingModal open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen} />
                        
                        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                            <DialogContent className="max-w-md rounded-[32px] border-none shadow-2xl p-8">
                                <DialogHeader>
                                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                                        <Trash2 className="h-8 w-8 text-red-600" />
                                    </div>
                                    <DialogTitle className="text-2xl font-black text-slate-900">Delete Conversation?</DialogTitle>
                                    <DialogDescription className="text-slate-500 font-medium text-base">
                                        This will permanently remove all messages and media for everyone in this conversation. This action cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="gap-3 mt-8">
                                    <Button 
                                        variant="ghost" 
                                        className="rounded-2xl h-12 px-6 font-bold text-slate-600 hover:bg-slate-50"
                                        onClick={() => setIsDeleteConfirmOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 px-8 font-bold shadow-lg shadow-red-100"
                                        onClick={handleDeleteChannel}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Delete for Everyone
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* TABS (ENTERPRISE GRADE) */}
                <div className="flex items-center gap-8">
                    {['Chat', 'Files', 'Photos'].map((tab) => (
                        <div 
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={cn(
                                "text-xs font-black py-3 px-1 cursor-pointer transition-all relative uppercase tracking-widest",
                                activeTab === tab.toLowerCase() 
                                    ? "text-indigo-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-1 after:bg-indigo-600 after:rounded-full after:shadow-sm" 
                                    : "text-slate-400 hover:text-slate-900"
                            )}
                        >
                            {tab}
                        </div>
                    ))}
                </div>
            </div>

            {/* PINNED MESSAGES BAR */}
            {messages?.filter((m: any) => m.is_pinned).length > 0 && (
                <div className="px-6 py-2 bg-indigo-50/50 border-b border-indigo-100/50 flex items-center gap-3">
                    <Pin className="h-3.5 w-3.5 text-indigo-500 fill-indigo-500" />
                    <div className="flex-1 flex gap-4 overflow-x-auto no-scrollbar py-1">
                        {messages.filter((m: any) => m.is_pinned).map((msg: any) => (
                            <div 
                                key={`pin-${msg.id}`} 
                                className="text-[12px] text-slate-600 whitespace-nowrap cursor-pointer hover:text-indigo-600 transition-colors flex items-center bg-white px-2 py-0.5 rounded-full border border-indigo-100 shadow-sm"
                                onClick={() => scrollToMessage(msg.id)}
                            >
                                <span className="font-bold mr-1">{msg.sender_name}:</span>
                                <span className="truncate max-w-[200px]">{msg.content?.body || msg.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CONTENT AREA BASED ON TAB */}
            <ScrollArea className="flex-1">
                {activeTab === 'chat' && (
                    <div className="p-6 pb-2 min-h-full flex flex-col">
                        {/* SEARCH OVERLAY (ENTERPRISE) */}
                        {searchQuery && (
                            <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-indigo-100 shadow-sm animate-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Search Results for "{searchQuery}"</span>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="bg-white text-indigo-600 border-indigo-100">{searchResults.length} Results</Badge>
                                        <button onClick={() => setSearchQuery("")} className="hover:text-red-500 transition-colors"><X className="h-4 w-4" /></button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {isSearching ? (
                                        <div className="py-8 text-center animate-pulse">
                                            <Search className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                                            <p className="text-xs font-bold text-slate-400">Analyzing conversation history...</p>
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        searchResults.map((msg: any) => (
                                            <div 
                                                key={`search-${msg.id}`} 
                                                className="p-3 bg-white rounded-xl border border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                                                onClick={() => {
                                                    scrollToMessage(msg.id);
                                                    setSearchQuery("");
                                                }}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-black text-slate-900 group-hover:text-indigo-600">{msg.sender_name}</span>
                                                    <span className="text-[10px] text-slate-400">{formatSafeTimestamp(msg.timestamp, 'MMM d, h:mm a')}</span>
                                                </div>
                                                <p className="text-sm text-slate-600 line-clamp-2">
                                                    {msg.content?.body || msg.text}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center">
                                            <p className="text-xs font-bold text-slate-400">No matching messages found in this conversation.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {messages.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95 duration-500">
                                <div className="w-48 h-48 bg-slate-50 rounded-full flex items-center justify-center mb-8 relative">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full animate-pulse" />
                                    <MessageSquare className="h-20 w-20 text-indigo-500 drop-shadow-sm" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">You're starting a new conversation</h3>
                                <p className="text-sm text-slate-500 max-w-xs">
                                    Type your first message below to collaborate with your team.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6 max-w-6xl mx-auto w-full">
                                {messages.map((msg, i) => {
                                    const isMe = msg.sender_id === user?.id;
                                    const showHeader = i === 0 || messages[i-1].sender_id !== msg.sender_id;

                                    return (
                                        <div key={msg.id || i} id={`msg-${msg.id}`} className={cn("flex flex-col group animate-in fade-in duration-300", isMe ? "items-end" : "items-start")}>
                                            {showHeader && !isMe && (
                                                <span className="text-[11px] font-black text-slate-400 mb-1 ml-12 uppercase tracking-tight">{msg.sender_name}</span>
                                            )}
                                            <div className={cn("flex items-end gap-3 max-w-[85%]", isMe ? "flex-row-reverse" : "flex-row")}>
                                                {showHeader ? (
                                                    <div className="relative group/avatar">
                                                        <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                                            <AvatarImage src={`https://avatar.vercel.sh/${msg.sender_id}`} />
                                                            <AvatarFallback className={cn("text-[10px] font-black text-white", isMe ? "bg-indigo-600" : "bg-slate-400")}>
                                                                {msg.sender_name?.[0]?.toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-white flex items-center justify-center ring-2 ring-white">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-9 w-9 shrink-0" />
                                                )}
                                                <div className="relative group/msg">
                                                    <div className={cn(
                                                        "px-5 py-3 rounded-2xl text-[14px] leading-relaxed transition-all shadow-sm relative group/bubble border",
                                                        isMe 
                                                            ? "bg-indigo-600 text-white rounded-tr-none border-indigo-500 shadow-indigo-100" 
                                                            : "bg-white text-slate-800 rounded-tl-none border-slate-100"
                                                    )}>
                                                        {msg.is_pinned && (
                                                            <Pin className={cn(
                                                                "h-3 w-3 absolute -right-4 top-1 text-indigo-400 rotate-45 fill-indigo-400",
                                                                isMe && "right-auto -left-4"
                                                            )} />
                                                        )}
                                                        
                                                        <div className="flex flex-col gap-2">
                                                            {msg.is_deleted ? (
                                                                <p className="italic opacity-60 text-sm flex items-center gap-2">
                                                                    <CircleSlash className="h-3 w-3" /> Message deleted
                                                                </p>
                                                            ) : (
                                                                <>
                                                                    {msg.content?.type === 'image' && msg.content?.fileUrl && (
                                                                        <div className="my-1 rounded-xl overflow-hidden border border-white/10 shadow-sm">
                                                                            <img 
                                                                                src={`${API_URL}${msg.content.fileUrl}`} 
                                                                                alt={msg.content.fileName || "Image"}
                                                                                className="max-w-full h-auto cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                                                                                onClick={() => window.open(`${API_URL}${msg.content?.fileUrl}`, '_blank')}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    {msg.content?.type === 'file' && msg.content?.fileUrl && (
                                                                        <a 
                                                                            href={`${API_URL}${msg.content.fileUrl}`} 
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className={cn(
                                                                                "flex items-center gap-4 p-3 rounded-xl border transition-all hover:shadow-lg",
                                                                                isMe ? "bg-white/10 border-white/20 hover:bg-white/15" : "bg-slate-50 border-slate-200 hover:border-indigo-200"
                                                                            )}
                                                                        >
                                                                            <div className={cn(
                                                                                "h-10 w-10 rounded-xl flex items-center justify-center shadow-sm",
                                                                                isMe ? "bg-white/20" : "bg-white"
                                                                            )}>
                                                                                <File className={cn("h-5 w-5", isMe ? "text-white" : "text-indigo-600")} />
                                                                            </div>
                                                                            <div className="flex flex-col overflow-hidden">
                                                                                <span className={cn("text-xs font-black truncate max-w-[200px]", isMe ? "text-white" : "text-slate-800")}>
                                                                                    {msg.content.fileName}
                                                                                </span>
                                                                                <span className={cn("text-[9px] font-bold uppercase tracking-widest", isMe ? "text-white/60" : "text-slate-400")}>
                                                                                    {msg.content.fileSize} • Click to open
                                                                                </span>
                                                                            </div>
                                                                            <Download className={cn("h-4 w-4 ml-auto opacity-40 group-hover:opacity-100 transition-opacity", isMe ? "text-white" : "text-slate-400")} />
                                                                        </a>
                                                                    )}

                                                                    {msg.poll_id && <PollRenderer msg={msg} />}
                                                                    
                                                                    {msg.content?.body && renderMessageText(msg.content.body, msg.mentions)}
                                                                    {msg.text && !msg.content?.body && renderMessageText(msg.text, msg.mentions)}

                                                                    {msg.content?.type === 'canvas' && (
                                                                        <Card className="w-full max-w-sm mt-3 border-none bg-slate-900/5 overflow-hidden group/canvas cursor-pointer hover:shadow-lg transition-all" onClick={() => {
                                                                            setCanvasTitle(msg.content.fileName || "Canvas");
                                                                            setCanvasContent(msg.content.body || "");
                                                                            setIsCanvasModalOpen(true);
                                                                        }}>
                                                                            <div className="p-4 bg-white/50 backdrop-blur-sm border-b border-indigo-100/30">
                                                                                <div className="flex items-center gap-2 mb-3">
                                                                                    <div className="h-6 w-6 bg-emerald-100 rounded flex items-center justify-center">
                                                                                        <FileText className="h-3 w-3 text-emerald-600" />
                                                                                    </div>
                                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enterprise Canvas</span>
                                                                                </div>
                                                                                <h4 className="font-bold text-slate-800 truncate mb-1">{msg.content.fileName}</h4>
                                                                                <p className="text-[11px] text-slate-500 line-clamp-2 opacity-70">
                                                                                    {msg.content.body || "Collaborative document shared. Click to edit."}
                                                                                </p>
                                                                            </div>
                                                                            <div className="px-4 py-2 bg-indigo-50/50 flex items-center justify-between">
                                                                                <span className="text-[9px] font-bold text-indigo-400">SHARED CANVAS</span>
                                                                                <ExternalLink className="h-3 w-3 text-indigo-400 group-hover/canvas:translate-x-0.5 transition-transform" />
                                                                            </div>
                                                                        </Card>
                                                                    )}
                                                                </>
                                                            )}
                                                            {msg.is_edited && !msg.is_deleted && <span className="text-[10px] opacity-60 self-end italic">edited</span>}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* HOVER REACTIONS */}
                                                    <div className={cn(
                                                        "absolute -top-10 bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl px-2 py-1.5 flex items-center gap-1.5 opacity-0 group-hover/msg:opacity-100 transition-all duration-300 transform scale-95 group-hover/msg:scale-100 z-10",
                                                        isMe ? "right-2" : "left-2"
                                                    )}>
                                                        {['👍', '❤️', '🔥', '😂', '😮'].map(emoji => (
                                                            <button 
                                                                key={emoji} 
                                                                className="hover:scale-125 hover:bg-slate-50 transition-all p-1.5 text-sm outline-none rounded-lg"
                                                                onClick={async (e) => {
                                                                    e.preventDefault();
                                                                    try {
                                                                        await api.post(`/chat/messages/${msg.id}/reactions`, { emoji });
                                                                    } catch (err) {
                                                                        toast.error("Failed to add reaction");
                                                                    }
                                                                }}
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                        <div className="w-[1px] h-4 bg-slate-100 mx-1" />
                                                        <button 
                                                            title="Reply"
                                                            className="hover:scale-110 hover:bg-indigo-50 transition-all p-1.5 text-slate-400 hover:text-indigo-600 outline-none rounded-lg"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setReplyTo(msg);
                                                                textareaRef.current?.focus();
                                                            }}
                                                        >
                                                            <Reply className="h-4 w-4" />
                                                        </button>
                                                        
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button title="More Actions" className="hover:scale-110 hover:bg-slate-50 transition-all p-1.5 text-slate-400 hover:text-slate-600 outline-none rounded-lg">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align={isMe ? "end" : "start"} className="w-56 p-2 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border-slate-100 backdrop-blur-xl bg-white/95 animate-in slide-in-from-top-2 duration-300">
                                                                <DropdownMenuLabel className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Message Options</DropdownMenuLabel>
                                                                
                                                                {isMe && !msg.is_deleted && (
                                                                    <DropdownMenuItem onClick={() => { setEditingMessageId(msg.id); setEditValue(msg.content?.body || msg.text); }} className="rounded-xl py-2.5 px-3 gap-3 focus:bg-indigo-50 focus:text-indigo-600 cursor-pointer transition-all">
                                                                        <div className="bg-indigo-50 p-1.5 rounded-lg group-hover:bg-indigo-100"><Edit2 className="h-3.5 w-3.5" /></div> Edit Message
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem onClick={() => handlePin(msg.id)} className="rounded-xl py-2.5 px-3 gap-3 focus:bg-indigo-50 focus:text-indigo-600 cursor-pointer transition-all">
                                                                    <div className="bg-amber-50 p-1.5 rounded-lg group-hover:bg-amber-100"><Pin className={cn("h-3.5 w-3.5", msg.is_pinned && "fill-current")} /></div> {msg.is_pinned ? "Unpin Message" : "Pin Message"}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => { setMessageToForward(msg); setIsForwardModalOpen(true); }} className="rounded-xl py-2.5 px-3 gap-3 focus:bg-indigo-50 focus:text-indigo-600 cursor-pointer transition-all">
                                                                    <div className="bg-blue-50 p-1.5 rounded-lg group-hover:bg-blue-100"><Forward className="h-3.5 w-3.5" /></div> Forward
                                                                </DropdownMenuItem>
                                                                
                                                                <DropdownMenuItem onClick={() => handleChannelToggle('unread')} className="rounded-xl py-2.5 px-3 gap-3 focus:bg-indigo-50 focus:text-indigo-600 cursor-pointer transition-all">
                                                                    <div className="bg-violet-50 p-1.5 rounded-lg group-hover:bg-violet-100"><Clock className="h-3.5 w-3.5" /></div> Mark as Unread
                                                                </DropdownMenuItem>
                                                                
                                                                <DropdownMenuItem onClick={() => copyToClipboard(msg.content?.body || msg.text)} className="rounded-xl py-2.5 px-3 gap-3 focus:bg-indigo-50 focus:text-indigo-600 cursor-pointer transition-all">
                                                                    <div className="bg-slate-50 p-1.5 rounded-lg group-hover:bg-slate-100"><Copy className="h-3.5 w-3.5" /></div> Copy Text
                                                                </DropdownMenuItem>
                                                                
                                                                <DropdownMenuSeparator className="my-2 bg-slate-50" />
                                                                
                                                                <DropdownMenuItem onClick={() => handleDelete(msg.id, 'me')} className="rounded-xl py-2.5 px-3 gap-3 text-slate-500 focus:bg-slate-50 cursor-pointer transition-all">
                                                                    <div className="bg-slate-50 p-1.5 rounded-lg group-hover:bg-slate-100"><Trash2 className="h-3.5 w-3.5" /></div> Delete for Me
                                                                </DropdownMenuItem>
                                                                
                                                                {isMe && !msg.is_deleted && canDeleteForEveryone(msg.timestamp) && (
                                                                    <DropdownMenuItem onClick={() => handleDelete(msg.id, 'everyone')} className="rounded-xl py-2.5 px-3 gap-3 text-red-500 focus:bg-red-50 focus:text-red-600 cursor-pointer transition-all">
                                                                        <div className="bg-red-50 p-1.5 rounded-lg group-hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></div> Delete for Everyone
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* DISPLAY EXISTING REACTIONS */}
                                            {msg.reactions && msg.reactions.length > 0 && (
                                                <div className={cn("flex flex-wrap gap-1 mt-1 px-11", isMe ? "justify-end" : "justify-start")}>
                                                    {Object.entries(
                                                        msg.reactions.reduce((acc: any, curr: any) => {
                                                            acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
                                                            return acc;
                                                        }, {})
                                                    ).map(([emoji, count]: [string, any]) => (
                                                        <div key={emoji} className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5 text-[10px] font-bold text-slate-600 shadow-sm">
                                                            <span>{emoji}</span>
                                                            {count > 1 && <span>{count}</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <span className="text-[10px] text-slate-300 mt-1 px-11 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {formatSafeTimestamp(msg.timestamp)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        
                        {/* Typing Indicator */}
                        {typingUsers.length > 0 && (
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-4 ml-12 italic">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                                <span>
                                    {typingUsers.map(id => channel.member_details?.find((m: any) => m.id === id)?.full_name || "Someone").join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
                                </span>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-8" />
                    </div>
                )}

                {activeTab === 'files' && (
                    <div className="p-6 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-slate-900">Shared Files</h3>
                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 rounded-lg">
                                <Plus className="h-4 w-4 mr-2" /> Upload
                            </Button>
                        </div>

                        {!channelFiles || channelFiles.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                                <FileText className="h-12 w-12 mb-4 opacity-20" />
                                <p className="text-sm font-medium">No files shared yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {channelFiles.map((file: any) => (
                                    <Card key={file.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-slate-200 group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm">{file.name}</p>
                                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                                    <span>{file.size || "Unknown size"}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                    <span>Shared by {file.sender_name}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                    <span>{formatSafeTimestamp(file.timestamp, 'MMM d, p')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-indigo-600" onClick={() => window.open(`${API_URL}${file.url}`, '_blank')}>
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-indigo-600" onClick={() => window.open(`${API_URL}${file.url}`, '_blank')}>
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'photos' && (
                    <div className="p-6 animate-in fade-in duration-300">
                         <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-slate-900">Photos & Media</h3>
                        </div>

                        {!channelPhotos || channelPhotos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                                <ImageIcon className="h-12 w-12 mb-4 opacity-20" />
                                <p className="text-sm font-medium">No photos shared yet</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {channelPhotos.map((photo: any) => (
                                    <div key={photo.id} className="group relative aspect-square bg-slate-100 rounded-2xl overflow-hidden cursor-pointer shadow-sm">
                                        <img src={`${API_URL}${photo.url}`} alt="Shared" className="w-full h-full object-cover transition-transform group-hover:scale-110" onClick={() => window.open(`${API_URL}${photo.url}`, '_blank')} />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white" onClick={() => window.open(`${API_URL}${photo.url}`, '_blank')}>
                                            <Download className="h-6 w-6 mb-2" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">{photo.sender_name}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>

            {/* ENTERPRISE INPUT BAR */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 shrink-0">
                {replyTo && (
                    <div className="mb-2 bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start justify-between animate-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-start gap-3 border-l-2 border-indigo-500 pl-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-0.5">Replying to {replyTo.sender_name}</span>
                                <p className="text-xs text-slate-500 truncate max-w-md italic">"{replyTo.content?.body || replyTo.text}"</p>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full"
                            onClick={() => setReplyTo(null)}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                )}

                {/* ATTACHMENT PREVIEWS */}
                {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3 animate-in fade-in slide-in-from-bottom-2">
                        {attachments.map(file => (
                            <div key={file.id} className="group relative bg-slate-50 border border-slate-200 rounded-xl p-2 pr-8 flex items-center gap-2 max-w-[200px]">
                                <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                                    {file.type.startsWith('image/') ? <ImageIcon className="h-4 w-4 text-indigo-600" /> : <Paperclip className="h-4 w-4 text-indigo-600" />}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-bold truncate text-slate-700">{file.filename}</span>
                                    <span className="text-[9px] text-slate-400 uppercase">{file.size}</span>
                                </div>
                                <button 
                                    className="absolute right-1 top-1 h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-500 hover:text-white transition-colors"
                                    onClick={() => setAttachments(prev => prev.filter(a => a.id !== file.id))}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                        {isUploading && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl animate-pulse">
                                <div className="h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] font-medium text-slate-400">Uploading...</span>
                            </div>
                        )}
                    </div>
                )}

                {/* MENTIONS POPOVER */}
                {showMentions && (
                    <div className="mb-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 max-h-48 overflow-y-auto">
                        <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Mention People</span>
                        </div>
                        {channel?.member_details?.filter((m: any) => m.full_name.toLowerCase().includes(mentionFilter)).length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400 italic">No members found</div>
                        ) : (
                            channel?.member_details
                                ?.filter((m: any) => m.full_name.toLowerCase().includes(mentionFilter))
                                .map((member: any) => (
                                    <button 
                                        key={member.id} 
                                        className="w-full flex items-center gap-3 p-2.5 hover:bg-indigo-50 transition-colors text-left group"
                                        onClick={() => {
                                            const words = inputValue.split(' ');
                                            words.pop(); // Remove @mention
                                            setInputValue(words.join(' ') + (words.length > 0 ? ' ' : '') + '@' + member.full_name + ' ');
                                            setShowMentions(false);
                                            textareaRef.current?.focus();
                                        }}
                                    >
                                        <div className="h-8 w-8 bg-indigo-100 rounded-lg flex items-center justify-center font-bold text-indigo-600 text-xs">
                                            {member.full_name[0]}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">{member.full_name}</span>
                                            <span className="text-[10px] text-slate-400">{member.email}</span>
                                        </div>
                                    </button>
                                ))
                        )}
                    </div>
                )}

                <div className="bg-white border border-slate-200 rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] focus-within:ring-1 focus-within:ring-indigo-200 focus-within:border-indigo-400 transition-all flex flex-col p-1.5 relative">
                    <Textarea
                        ref={textareaRef}
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={`Message ${channel.name || 'this workspace'}...`}
                        className="border-none bg-transparent shadow-none focus-visible:ring-0 placeholder:text-slate-400 text-sm py-3 min-h-[44px] max-h-48 resize-none"
                    />
                    
                    <div className="flex items-center justify-between px-2 pb-1 pt-2 border-t border-slate-50">
                        <div className="flex items-center gap-1.5">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-slate-50">
                                        <Smile className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent side="top" align="start" className="w-72 p-0 rounded-2xl shadow-2xl border-slate-100 overflow-hidden">
                                    <div className="p-3 bg-slate-50 border-b border-slate-100">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Emoji</span>
                                    </div>
                                    <ScrollArea className="h-64 p-2">
                                        <div className="space-y-4">
                                            {EMOJI_CATEGORIES.map(cat => (
                                                <div key={cat.name}>
                                                    <h4 className="text-[10px] font-bold text-slate-400 mb-2 pl-1">{cat.name}</h4>
                                                    <div className="grid grid-cols-7 gap-1">
                                                        {cat.emojis.map(emoji => (
                                                            <button 
                                                                key={emoji} 
                                                                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-lg"
                                                                onClick={() => handleEmojiSelect(emoji)}
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </PopoverContent>
                            </Popover>

                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                ref={imageInputRef} 
                                onChange={(e) => handleFileUpload(e, 'image')}
                            />
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
                                onClick={() => imageInputRef.current?.click()}
                            >
                                <ImageIcon className="h-4 w-4" />
                            </Button>

                            <input 
                                type="file" 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={(e) => handleFileUpload(e, 'file')}
                            />
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Paperclip className="h-4 w-4" />
                            </Button>

                            <div className="h-3 w-[1px] bg-slate-200 mx-1" />
                            
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className={cn("h-8 w-8 transition-colors", showMentions ? "text-indigo-600 bg-indigo-50" : "text-slate-400 hover:text-indigo-600 hover:bg-slate-50")}
                                onClick={() => {
                                    if (showMentions) setShowMentions(false);
                                    else insertAtCursor('@');
                                }}
                            >
                                <AtSign className="h-4 w-4" />
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-slate-50">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent side="top" align="start" className="w-56 rounded-xl shadow-xl border-slate-100 p-1.5">
                                    <div className="px-2 py-1.5 mb-1.5 border-b border-slate-50">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Canvas</span>
                                    </div>
                                    <DropdownMenuItem 
                                        className="gap-2 py-2.5 rounded-lg focus:bg-indigo-50 focus:text-indigo-700 cursor-pointer"
                                        onClick={() => setIsCanvasModalOpen(true)}
                                    >
                                        <div className="h-7 w-7 bg-indigo-100 rounded flex items-center justify-center">
                                            <FileText className="h-3.5 w-3.5 text-indigo-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold">New Canvas</span>
                                            <span className="text-[9px] opacity-70">Collaborate on a rich doc</span>
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        className="gap-2 py-2.5 rounded-lg focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer"
                                        onClick={() => setIsPollModalOpen(true)}
                                    >
                                        <div className="h-7 w-7 bg-emerald-100 rounded flex items-center justify-center">
                                            <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold">Create Poll</span>
                                            <span className="text-[9px] opacity-70">Instant team feedback</span>
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        className="gap-2 py-2.5 rounded-lg focus:bg-amber-50 focus:text-amber-700 cursor-pointer"
                                        onClick={handleStartHuddle}
                                    >
                                        <div className="h-7 w-7 bg-amber-100 rounded flex items-center justify-center">
                                            <Video className="h-3.5 w-3.5 text-amber-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold">Quick Huddle</span>
                                            <span className="text-[9px] opacity-70">Voice/Video room</span>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <Button
                            onClick={handleSend}
                            disabled={(!inputValue.trim() && attachments.length === 0) || status !== 'connected'}
                            variant="ghost" 
                            size="icon"
                            className={cn(
                                "h-9 w-9 transition-all active:scale-95",
                                (inputValue.trim() || attachments.length > 0) ? "text-indigo-600 hover:bg-indigo-50" : "text-slate-300"
                            )}
                        >
                            <SendHorizontal className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* FORWARD MESSAGE MODAL */}
            <Dialog open={isForwardModalOpen} onOpenChange={setIsForwardModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Forward Message</DialogTitle>
                        <DialogDescription>Select a workspace member to forward this message to.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <ScrollArea className="h-64 pr-4">
                            <div className="space-y-1">
                                {channels?.filter((c: any) => c.type === 'dm').map((c: any) => {
                                    const otherMember = c.member_details?.find((m: any) => m.id !== user?.id);
                                    return (
                                        <div 
                                            key={c.id} 
                                            className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                                            onClick={() => handleForward(c.id)}
                                        >
                                            <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center font-bold text-indigo-600">
                                                {otherMember?.full_name?.[0]?.toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">{otherMember?.full_name}</p>
                                                <p className="text-xs text-slate-500 truncate">Forward here</p>
                                            </div>
                                            <Forward className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            {/* POLL CREATOR MODAL */}
            <Dialog open={isPollModalOpen} onOpenChange={setIsPollModalOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-emerald-600">
                            Create Team Poll
                        </DialogTitle>
                        <DialogDescription>
                            Get instant feedback from your workspace members.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Question</Label>
                            <Input 
                                placeholder="What should we name the new project?" 
                                value={pollQuestion}
                                onChange={(e) => setPollQuestion(e.target.value)}
                                className="rounded-xl border-slate-200 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Options</Label>
                            {pollOptions.map((opt, i) => (
                                <div key={i} className="flex gap-2">
                                    <Input 
                                        placeholder={`Option ${i + 1}`}
                                        value={opt}
                                        onChange={(e) => {
                                            const newOps = [...pollOptions];
                                            newOps[i] = e.target.value;
                                            setPollOptions(newOps);
                                        }}
                                        className="rounded-xl border-slate-200 focus:ring-indigo-500"
                                    />
                                    {pollOptions.length > 2 && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-10 w-10 text-slate-400 hover:text-red-500"
                                            onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full mt-2 border-dashed border-slate-300 text-slate-500 rounded-xl hover:bg-slate-50"
                                onClick={() => setPollOptions([...pollOptions, ""])}
                            >
                                <Plus className="h-3 w-3 mr-2" />
                                Add Option
                            </Button>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button 
                            className="w-full bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-700 hover:to-emerald-700 text-white rounded-xl h-12 font-bold shadow-lg shadow-indigo-200"
                            onClick={handleCreatePoll}
                        >
                            Launch Poll
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* CANVAS EDITOR MODAL (ENTERPRISE GRADE) */}
            <Dialog open={isCanvasModalOpen} onOpenChange={setIsCanvasModalOpen}>
                <DialogContent className="max-w-[95vw] w-[1200px] h-[90vh] p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                    <DialogTitle className="sr-only">Canvas Editor</DialogTitle>
                    <div className="flex h-full flex-col bg-white">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                                    <FileText className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <input 
                                        value={canvasTitle}
                                        onChange={(e) => setCanvasTitle(e.target.value)}
                                        className="text-lg font-bold bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-300"
                                        placeholder="Untitled Canvas"
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Collaboration System</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2 mr-4">
                                    {channel?.member_details?.slice(0, 3).map((member: any) => (
                                        <div 
                                            key={member.id}
                                            className="h-8 w-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 shadow-sm"
                                            title={member.full_name}
                                        >
                                            {member.full_name?.[0]?.toUpperCase()}
                                        </div>
                                    ))}
                                    {(channel?.member_details?.length || 0) > 3 && (
                                        <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                            +{(channel?.member_details?.length || 0) - 3}
                                        </div>
                                    )}
                                </div>
                                <Button variant="ghost" className="rounded-xl text-slate-500" onClick={() => setIsCanvasModalOpen(false)}>Close</Button>
                                <Button 
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 font-bold"
                                    onClick={handleCanvasSave}
                                >
                                    Save & Close
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden p-6 bg-slate-50/10">
                            <Textarea 
                                className="w-full h-full text-lg leading-relaxed border-none focus-visible:ring-0 shadow-none bg-transparent resize-none p-4 font-medium text-slate-700 placeholder:text-slate-200"
                                placeholder="Start brainstorming with your team..."
                                value={canvasContent}
                                onChange={(e) => handleCanvasChange(e.target.value)}
                            />
                        </div>
                        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                            <div className="flex items-center gap-4 text-slate-400">
                                <button className="hover:text-indigo-600 transition-colors"><Bold className="h-4 w-4" /></button>
                                <button className="hover:text-indigo-600 transition-colors"><Italic className="h-4 w-4" /></button>
                                <button className="hover:text-indigo-600 transition-colors"><List className="h-4 w-4" /></button>
                                <div className="h-4 w-[1px] bg-slate-200" />
                                <button className="hover:text-indigo-600 transition-colors"><ImageIcon className="h-4 w-4" /></button>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">All changes saved automatically</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
