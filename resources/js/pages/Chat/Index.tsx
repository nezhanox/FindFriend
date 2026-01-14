import ConversationItem from '@/components/Chat/ConversationItem';
import PageTransition from '@/components/PageTransition';
import AppLayout from '@/Layouts/AppLayout';
import { Conversation } from '@/types/chat';
import { Head, Link } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { motion } from 'framer-motion';
import { Map as MapIcon, MessageCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
    conversations: Conversation[];
    currentUserId: number;
}

export default function ChatIndex({ conversations, currentUserId }: Props) {
    const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
    const typingTimeoutRefs = useRef<Map<number, NodeJS.Timeout>>(new Map());

    useEffect(() => {
        // Copy ref to a local variable for cleanup
        const timeoutsMap = typingTimeoutRefs.current;

        // Subscribe to typing events for all conversations
        conversations.forEach((conversation) => {
            const channel = echo().private(`conversation.${conversation.id}`);

            channel.listen(
                '.UserTyping',
                (event: { user_id: number; typing: boolean }) => {
                    // Only track typing for other users
                    if (event.user_id !== currentUserId) {
                        const userId = conversation.other_user.id;

                        if (event.typing) {
                            setTypingUsers((prev) => {
                                const newSet = new Set(prev);
                                newSet.add(userId);
                                return newSet;
                            });

                            // Clear existing timeout
                            const existingTimeout = timeoutsMap.get(userId);
                            if (existingTimeout) {
                                clearTimeout(existingTimeout);
                            }

                            // Auto-hide after 5 seconds
                            const timeout = setTimeout(() => {
                                setTypingUsers((prev) => {
                                    const newSet = new Set(prev);
                                    newSet.delete(userId);
                                    return newSet;
                                });
                                timeoutsMap.delete(userId);
                            }, 5000);

                            timeoutsMap.set(userId, timeout);
                        } else {
                            setTypingUsers((prev) => {
                                const newSet = new Set(prev);
                                newSet.delete(userId);
                                return newSet;
                            });

                            const existingTimeout = timeoutsMap.get(userId);
                            if (existingTimeout) {
                                clearTimeout(existingTimeout);
                                timeoutsMap.delete(userId);
                            }
                        }
                    }
                },
            );
        });

        return () => {
            // Cleanup
            conversations.forEach((conversation) => {
                echo().leave(`conversation.${conversation.id}`);
            });

            // Clear all timeouts using the local variable
            timeoutsMap.forEach((timeout) => {
                clearTimeout(timeout);
            });
            timeoutsMap.clear();
        };
    }, [conversations, currentUserId]);

    return (
        <AppLayout>
            <Head title="Chat" />

            <PageTransition className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
                <div className="mx-auto max-w-4xl">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                        }}
                        className="mb-4 overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-2xl backdrop-saturate-150 md:mb-6 md:rounded-3xl md:p-6"
                    >
                        <div className="flex items-center justify-between gap-2 md:gap-3">
                            <div className="flex items-center gap-2 md:gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 md:size-12 md:rounded-2xl">
                                    <MessageCircle className="size-5 text-white md:size-6" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900 md:text-2xl dark:text-white">
                                        Messages
                                    </h1>
                                    <p className="text-xs text-gray-600 md:text-sm dark:text-gray-400">
                                        {conversations.length} conversation
                                        {conversations.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>

                            {/* Map Button */}
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 400,
                                    damping: 25,
                                }}
                            >
                                <Link
                                    href="/"
                                    className="flex items-center gap-1.5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg shadow-blue-500/30 transition-shadow hover:shadow-xl hover:shadow-blue-500/40 md:gap-2 md:px-4 md:py-2 md:text-sm"
                                >
                                    <MapIcon className="size-3.5 md:size-4" />
                                    <span className="hidden sm:inline">
                                        Map
                                    </span>
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Conversations List */}
                    <div className="space-y-2 md:space-y-3">
                        {conversations.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 300,
                                    damping: 30,
                                }}
                                className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-2xl backdrop-saturate-150 md:rounded-3xl md:p-12"
                            >
                                <MessageCircle className="mx-auto mb-3 size-12 text-gray-400 md:mb-4 md:size-16" />
                                <h3 className="mb-2 text-base font-semibold text-gray-900 md:text-lg dark:text-white">
                                    No conversations yet
                                </h3>
                                <p className="text-xs text-gray-600 md:text-sm dark:text-gray-400">
                                    Start a chat by finding users on the map
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.05,
                                        },
                                    },
                                }}
                            >
                                {conversations.map((conversation) => (
                                    <motion.div
                                        key={conversation.id}
                                        variants={{
                                            hidden: { opacity: 0, y: 20 },
                                            visible: { opacity: 1, y: 0 },
                                        }}
                                        transition={{
                                            type: 'spring',
                                            stiffness: 300,
                                            damping: 30,
                                        }}
                                    >
                                        <ConversationItem
                                            conversation={conversation}
                                            isTyping={typingUsers.has(
                                                conversation.other_user.id,
                                            )}
                                        />
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </div>
            </PageTransition>
        </AppLayout>
    );
}
