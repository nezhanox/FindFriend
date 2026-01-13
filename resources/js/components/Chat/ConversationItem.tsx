import TypingIndicator from '@/components/Chat/TypingIndicator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Conversation } from '@/types/chat';
import { Link } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';

interface ConversationItemProps {
    conversation: Conversation;
    isActive?: boolean;
    isTyping?: boolean;
}

export default function ConversationItem({
    conversation,
    isActive = false,
    isTyping = false,
}: ConversationItemProps) {
    return (
        <Link href={`/chat/${conversation.id}`}>
            <motion.div
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`group relative overflow-hidden rounded-2xl p-3 transition-all duration-200 md:p-4 ${
                    isActive
                        ? 'border border-blue-500/30 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                        : 'border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                } backdrop-blur-xl backdrop-saturate-150`}
            >
                {/* Glassmorphism overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />

                <div className="relative z-10 flex items-center gap-2 md:gap-3">
                    <Avatar className="size-10 shrink-0 ring-2 ring-white/10 ring-offset-2 ring-offset-transparent md:size-12">
                        <AvatarImage
                            src={conversation.other_user.avatar || ''}
                            alt={conversation.other_user.name}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-sm text-white">
                            {conversation.other_user.name
                                .charAt(0)
                                .toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="truncate text-sm font-semibold text-gray-900 md:text-base dark:text-white">
                                {conversation.other_user.name}
                            </h3>
                            {conversation.last_message_at && (
                                <span className="shrink-0 text-[10px] text-gray-500 md:text-xs dark:text-gray-400">
                                    {formatDistanceToNow(
                                        new Date(conversation.last_message_at),
                                        {
                                            addSuffix: false,
                                        },
                                    )}
                                </span>
                            )}
                        </div>

                        <AnimatePresence mode="wait">
                            {isTyping ? (
                                <motion.div
                                    key="typing"
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    transition={{ duration: 0.2 }}
                                    className="mt-0.5 md:mt-1"
                                >
                                    <TypingIndicator variant="inline" />
                                </motion.div>
                            ) : (
                                conversation.last_message && (
                                    <motion.p
                                        key="message"
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 5 }}
                                        transition={{ duration: 0.2 }}
                                        className={`mt-0.5 truncate text-xs md:mt-1 md:text-sm ${conversation.last_message.is_own ? 'text-gray-600 dark:text-gray-400' : 'font-medium text-gray-900 dark:text-white'} `}
                                    >
                                        {conversation.last_message.is_own &&
                                            'You: '}
                                        {conversation.last_message.content}
                                    </motion.p>
                                )
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Hover shine effect */}
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                />
            </motion.div>
        </Link>
    );
}
