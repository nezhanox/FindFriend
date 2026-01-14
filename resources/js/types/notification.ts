export interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    action_url: string | null;
    data: Record<string, unknown> | null;
    read_at: string | null;
    created_at: string;
}

export interface NotificationResponse {
    notifications: Notification[];
    unread_count: number;
}
