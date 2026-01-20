import axios from '@/bootstrap';
import { router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { MessageCircle, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Friend {
    id: number;
    name: string;
    avatar: string | null;
    age: number | null;
    gender: string | null;
    last_seen_at: string | null;
    location: {
        lat: number;
        lng: number;
        address: string | null;
    } | null;
}

export default function FriendList() {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
            .get<{ friends: Friend[]; count: number }>('/friends')
            .then((response) => {
                setFriends(response.data.friends);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Failed to load friends:', error);
                setLoading(false);
            });
    }, []);

    const handleChatWithFriend = (friendId: number) => {
        // Create or get conversation with friend
        axios
            .post('/chat/conversations', {
                recipient_id: friendId,
            })
            .then((response) => {
                router.visit(`/chat/${response.data.conversation.id}`);
            })
            .catch((error) => {
                console.error('Failed to create conversation:', error);
            });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    if (friends.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <UserIcon className="mb-4 h-12 w-12 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    У вас поки немає друзів
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    Додайте друзів на мапі, щоб почати спілкування
                </p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {friends.map((friend, index) => (
                <motion.button
                    key={friend.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        delay: index * 0.05,
                        duration: 0.3,
                    }}
                    onClick={() => handleChatWithFriend(friend.id)}
                    className="flex w-full items-center gap-3 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        {friend.avatar ? (
                            <img
                                src={`/storage/${friend.avatar}`}
                                alt={friend.name}
                                className="h-12 w-12 rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                                <UserIcon className="h-6 w-6 text-white" />
                            </div>
                        )}

                        {/* Online indicator */}
                        {friend.last_seen_at &&
                            new Date().getTime() -
                                new Date(friend.last_seen_at).getTime() <
                                5 * 60 * 1000 && (
                                <div className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-gray-900"></div>
                            )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-center justify-between">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                {friend.name}
                            </p>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            {friend.age && <span>{friend.age} років</span>}
                            {friend.location?.address && (
                                <span className="truncate">
                                    {friend.location.address.split(',')[0]}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Chat button */}
                    <div className="flex-shrink-0">
                        <div className="rounded-full bg-blue-100 p-2 text-blue-600 transition-colors hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
                            <MessageCircle className="h-4 w-4" />
                        </div>
                    </div>
                </motion.button>
            ))}
        </div>
    );
}
