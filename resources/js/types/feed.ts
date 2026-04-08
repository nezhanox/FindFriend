export type ActivityType =
    | 'friendship_accepted'
    | 'friend_request_sent'
    | 'message_sent'
    | 'user_joined';

export interface ActivityActor {
    id: number;
    name: string;
    avatar_url: string | null;
}

export interface ActivityFeedItem {
    id: string;
    type: ActivityType;
    label: string;
    actor: ActivityActor;
    subject: ActivityActor | null;
    occurred_at: string;
}
