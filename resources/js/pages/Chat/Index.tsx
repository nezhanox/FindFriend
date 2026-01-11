import ConversationItem from '@/components/Chat/ConversationItem';
import { Conversation } from '@/types/chat';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

interface Props {
    conversations: Conversation[];
}

export default function ChatIndex({ conversations }: Props) {
    return (
        <>
            <Head title="Chat" />

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
                                        />
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
