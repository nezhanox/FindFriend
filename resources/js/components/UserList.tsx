import { UserMarker } from '@/types/location';
import { router } from '@inertiajs/react';
import { MessageCircle } from 'lucide-react';

interface UserListProps {
    users: UserMarker[];
    isLoading: boolean;
    onUserClick: (user: UserMarker) => void;
    isAuthenticated?: boolean;
}

export default function UserList({
    users,
    isLoading,
    onUserClick,
    isAuthenticated = false,
}: UserListProps) {
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
        <div className="divide-y divide-gray-200">
            {users.map((user) => (
                <button
                    key={user.id}
                    onClick={() => onUserClick(user)}
                    className="w-full p-3 text-left transition-colors duration-150 hover:bg-gray-50 focus:bg-gray-100 focus:outline-none md:p-4"
                >
                    <div className="flex items-start gap-2 md:gap-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {user.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="h-10 w-10 rounded-full object-cover md:h-12 md:w-12"
                                />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-base font-semibold text-white md:h-12 md:w-12 md:text-lg">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
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
                            </div>

                            {/* Chat Button */}
                            <button
                                onClick={(e) => handleStartChat(e, user.id)}
                                className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm transition-all hover:scale-105 hover:shadow-md md:mt-2 md:gap-1.5 md:px-3 md:py-1.5 md:text-xs"
                            >
                                <MessageCircle className="size-3 md:size-3.5" />
                                Chat
                            </button>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
