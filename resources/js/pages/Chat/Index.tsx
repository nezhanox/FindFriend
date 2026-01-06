import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Conversation } from '@/types/chat';
import ConversationItem from '@/components/Chat/ConversationItem';
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
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="mb-6 overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl backdrop-saturate-150"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30">
                                <MessageCircle className="size-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Messages
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Conversations List */}
                    <div className="space-y-3">
                        {conversations.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                className="overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-12 text-center shadow-2xl backdrop-blur-2xl backdrop-saturate-150"
                            >
                                <MessageCircle className="mx-auto mb-4 size-16 text-gray-400" />
                                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                                    No conversations yet
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
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
                                        <ConversationItem conversation={conversation} />
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
