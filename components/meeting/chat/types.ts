export interface ChatContent {
    type: string;
    body: string;
    fileUrl?: string;
    fileName?: string; 
    fileSize?: string;
}

export interface Reaction {
    userId: string;
    emoji: string;
}

export interface ChatMessage {
    id: string;
    meeting_id: string;
    sender_id: string;
    sender_name: string;
    sender_role: string;
    timestamp: string;
    content: ChatContent;
    scope: string;
    target_id?: string;
    reactions: Reaction[];
    is_deleted: boolean;
    type?: string; 
}
