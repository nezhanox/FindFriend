import { router } from '@inertiajs/react';
import { MessageCircle } from 'lucide-react';
import { UserMarker } from '@/types/location';

interface UserListProps {
    users: UserMarker[];
    isLoading: boolean;
    onUserClick: (user: UserMarker) => void;
    isAuthenticated?: boolean;
}

export default function UserList({ users, isLoading, onUserClick, isAuthenticated = false }: UserListProps) {
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
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    recipient_id: userId,
                    content: 'Hi! 👋',
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // Redirect to chat
                router.visit(`/chat`);
            } else {
                console.error('Failed to start chat');
            }
        } catch (error) {
            console.error('Error starting chat:', error);
        }
    };
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700"></div>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                <svg
                    className="mx-auto h-12 w-12 text-gray-400"
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
                <p className="mt-2">No nearby users</p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-200">
            {users.map((user) => (
                <button
                    key={user.id}
                    onClick={() => onUserClick(user)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors duration-150 focus:outline-none focus:bg-gray-100"
                >
                    <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="h-12 w-12 rounded-full object-cover"
                                />
                            ) : (
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between">
                                <h3 className="text-sm font-semibold text-gray-900 truncate">
                                    {user.name}
                                </h3>
                                <span className="ml-2 flex-shrink-0 text-xs font-medium text-blue-600">
                                    {user.distance} km
                                </span>
                            </div>

                            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                {user.age && (
                                    <span className="inline-flex items-center">
                                        <svg
                                            className="h-3 w-3 mr-1"
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
                                        <span className="capitalize">{user.gender}</span>
                                    </>
                                )}
                            </div>

                            {/* Chat Button */}
                            <button
                                onClick={(e) => handleStartChat(e, user.id)}
                                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:scale-105 hover:shadow-md"
                            >
                                <MessageCircle className="size-3.5" />
                                Chat
                            </button>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
