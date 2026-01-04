export interface User {
    id: number;
    name: string;
    avatar: string | null;
}

export interface Message {
    id: number;
    sender_id: number;
    content: string;
    created_at: string;
    read_at: string | null;
    sender: User;
}

export interface Conversation {
    id: number;
    other_user: User;
    last_message: {
        content: string;
        created_at: string;
        is_own: boolean;
    } | null;
    last_message_at: string | null;
}

export interface ConversationDetail {
    id: number;
    other_user: User;
}
