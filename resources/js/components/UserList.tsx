import axios from '@/bootstrap';
import { UserMarker } from '@/types/location';
import { router } from '@inertiajs/react';
import { MessageCircle, UserCheck, UserPlus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface UserListProps {
    users: UserMarker[];
    isLoading: boolean;
    onUserClick: (user: UserMarker) => void;
    isAuthenticated?: boolean;
    showOnlyFriends?: boolean;
    currentUserId?: number | null;
}

function getMinutesSinceLastSeen(
    lastSeenAt: string | null | undefined,
): number {
    if (!lastSeenAt) return Infinity;
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    return Math.floor((now.getTime() - lastSeen.getTime()) / 1000 / 60);
}

function formatLastSeen(minutes: number): string {
    if (minutes < 1) return 'щойно';
    if (minutes < 60) return `${minutes} хв тому`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} год тому`;
    const days = Math.floor(hours / 24);
    return `${days} дн тому`;
}

export default function UserList({
    users,
    isLoading,
    onUserClick,
    isAuthenticated = false,
    showOnlyFriends = false,
    currentUserId = null,
}: UserListProps) {
    const [activeTab, setActiveTab] = useState<'online' | 'offline'>('online');
    const [friendIds, setFriendIds] = useState<Set<number>>(new Set());
    const [loadingFriendship, setLoadingFriendship] = useState<number | null>(
        null,
    );

    // Load friend IDs
    useEffect(() => {
        if (isAuthenticated) {
            axios
                .get<{ friends: Array<{ id: number }>; count: number }>(
                    '/friends',
                )
                .then((response) => {
                    const ids = new Set(response.data.friends.map((f) => f.id));
                    setFriendIds(ids);
                })
                .catch((error) => {
                    console.error('Failed to load friends:', error);
                });
        }
    }, [isAuthenticated]);

    const { onlineUsers, offlineUsers } = useMemo(() => {
        const online: UserMarker[] = [];
        const offline: UserMarker[] = [];

        // Filter by friends if needed
        const filteredUsers = showOnlyFriends
            ? users.filter((user) => friendIds.has(user.id))
            : users;

        filteredUsers.forEach((user) => {
            const minutes = getMinutesSinceLastSeen(user.last_seen_at);
            if (minutes < 60) {
                online.push(user);
            } else {
                offline.push(user);
            }
        });

        return { onlineUsers: online, offlineUsers: offline };
    }, [users, showOnlyFriends, friendIds]);

    const displayedUsers = activeTab === 'online' ? onlineUsers : offlineUsers;

    const handleStartChat = async (e: React.MouseEvent, userId: number) => {
        e.stopPropagation();

        if (!isAuthenticated) {
            router.visit('/login');
            return;
        }

        try {
            // Create or get conversation
            const response = await fetch('/chat/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    recipient_id: userId,
                    content: 'Hi! 👋',
                }),
            });

            if (response.ok) {
                // Redirect to chat
                router.visit(`/chat`);
            } else {
                console.error('Failed to start chat');
            }
        } catch (error) {
            console.error('Error starting chat:', error);
        }
    };

    const handleToggleFriend = async (
        e: React.MouseEvent,
        userId: number,
        isFriend: boolean,
    ) => {
        e.stopPropagation();

        if (!isAuthenticated) {
            router.visit('/login');
            return;
        }

        setLoadingFriendship(userId);

        try {
            if (isFriend) {
                // Remove friend
                await axios.delete(`/friends/${userId}`);
                setFriendIds((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(userId);
                    return newSet;
                });
            } else {
                // Add friend
                await axios.post('/friends', { friend_id: userId });
                setFriendIds((prev) => new Set([...prev, userId]));
            }
        } catch (error) {
            console.error('Failed to toggle friendship:', error);
        } finally {
            setLoadingFriendship(null);
        }
    };
    if (isLoading) {
        return (
            <div className="flex h-24 items-center justify-center md:h-32">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-gray-700 md:h-8 md:w-8"></div>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="py-6 text-center text-gray-500 md:py-8">
                <svg
                    className="mx-auto h-10 w-10 text-gray-400 md:h-12 md:w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                </svg>
                <p className="mt-2 text-sm md:text-base">No nearby users</p>
            </div>
        );
    }

    return (
        <div>
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('online')}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                        activeTab === 'online'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Онлайн
                    {onlineUsers.length > 0 && (
                        <span className="ml-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">
                            {onlineUsers.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('offline')}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                        activeTab === 'offline'
                            ? 'border-b-2 border-blue-500 text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Давно в мережі
                    {offlineUsers.length > 0 && (
                        <span className="ml-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            {offlineUsers.length}
                        </span>
                    )}
                </button>
            </div>

            {/* User List */}
            {displayedUsers.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                    <p className="text-sm md:text-base">
                        {activeTab === 'online'
                            ? 'Немає користувачів онлайн'
                            : 'Немає користувачів офлайн'}
                    </p>
                </div>
            ) : (
                <div className="divide-y divide-gray-200">
                    {displayedUsers.map((user) => {
                        const minutesSinceLastSeen = getMinutesSinceLastSeen(
                            user.last_seen_at,
                        );
                        return (
                            <button
                                key={user.id}
                                onClick={() => onUserClick(user)}
                                className="w-full p-3 text-left transition-colors duration-150 hover:bg-gray-50 focus:bg-gray-100 focus:outline-none md:p-4"
                            >
                                <div className="flex items-start gap-2 md:gap-3">
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        {user.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="h-10 w-10 rounded-full object-cover md:h-12 md:w-12"
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-base font-semibold text-white md:h-12 md:w-12 md:text-lg">
                                                {user.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                        )}
                                        {/* Online indicator */}
                                        {minutesSinceLastSeen < 60 && (
                                            <div className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500 md:h-3.5 md:w-3.5"></div>
                                        )}
                                    </div>

                                    {/* User Info */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between">
                                            <h3 className="truncate text-sm font-semibold text-gray-900 md:text-base">
                                                {user.name}
                                            </h3>
                                            <span className="ml-2 flex-shrink-0 text-[10px] font-medium text-blue-600 md:text-xs">
                                                {user.distance} km
                                            </span>
                                        </div>

                                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-gray-500 md:mt-1 md:gap-2 md:text-xs">
                                            {user.age && (
                                                <span className="inline-flex items-center">
                                                    <svg
                                                        className="mr-0.5 h-2.5 w-2.5 md:mr-1 md:h-3 md:w-3"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                    {user.age} years
                                                </span>
                                            )}
                                            {user.gender && (
                                                <>
                                                    {user.age && <span>•</span>}
                                                    <span className="capitalize">
                                                        {user.gender}
                                                    </span>
                                                </>
                                            )}
                                            {user.last_seen_at && (
                                                <>
                                                    {(user.age ||
                                                        user.gender) && (
                                                        <span>•</span>
                                                    )}
                                                    <span
                                                        className={
                                                            minutesSinceLastSeen <
                                                            60
                                                                ? 'text-green-600'
                                                                : 'text-gray-400'
                                                        }
                                                    >
                                                        {formatLastSeen(
                                                            minutesSinceLastSeen,
                                                        )}
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="mt-1.5 flex gap-1.5 md:mt-2 md:gap-2">
                                            <button
                                                onClick={(e) =>
                                                    handleStartChat(e, user.id)
                                                }
                                                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm transition-all hover:scale-105 hover:shadow-md md:gap-1.5 md:px-3 md:py-1.5 md:text-xs"
                                            >
                                                <MessageCircle className="size-3 md:size-3.5" />
                                                Чат
                                            </button>

                                            {isAuthenticated &&
                                                user.id !== currentUserId && (
                                                    <button
                                                        onClick={(e) =>
                                                            handleToggleFriend(
                                                                e,
                                                                user.id,
                                                                friendIds.has(
                                                                    user.id,
                                                                ),
                                                            )
                                                        }
                                                        disabled={
                                                            loadingFriendship ===
                                                            user.id
                                                        }
                                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium shadow-sm transition-all hover:scale-105 hover:shadow-md disabled:opacity-50 md:gap-1.5 md:px-3 md:py-1.5 md:text-xs ${
                                                            friendIds.has(
                                                                user.id,
                                                            )
                                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {loadingFriendship ===
                                                        user.id ? (
                                                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-700 border-t-transparent md:h-3.5 md:w-3.5"></div>
                                                        ) : friendIds.has(
                                                              user.id,
                                                          ) ? (
                                                            <>
                                                                <UserCheck className="size-3 md:size-3.5" />
                                                                Друг
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UserPlus className="size-3 md:size-3.5" />
                                                                Додати
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
