export interface UserMarker {
    id: number;
    name: string;
    lat: number;
    lng: number;
    distance: number;
    avatar?: string | null;
    age?: number | null;
    gender?: string | null;
    last_seen_at?: string | null;
}

export interface MapFilters {
    radius: number;
}

export interface LocationUpdate {
    user_id: number;
    message: string;
}

export interface NearbyUsersResponse {
    users: UserMarker[];
    count: number;
}
