import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Message } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
            }}
            className={`mb-4 flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
        >
            {!isOwn && (
                <Avatar className="size-8 shrink-0">
                    <AvatarImage src={message.sender.avatar || ''} alt={message.sender.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-xs text-white">
                        {message.sender.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
            )}

            <div className={`flex max-w-[70%] flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`
                        relative overflow-hidden rounded-3xl px-4 py-3 shadow-lg
                        ${
                            isOwn
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                                : 'border border-white/20 bg-white/10 text-gray-900 backdrop-blur-2xl backdrop-saturate-150 dark:text-white'
                        }
                    `}
                >
                    {/* Glassmorphism shine effect */}
                    {!isOwn && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
                    )}

                    <p className="relative z-10 break-words text-sm leading-relaxed">
                        {message.content}
                    </p>
                </motion.div>

                <div className="mt-1 flex items-center gap-2 px-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                    {isOwn && message.read_at && (
                        <span className="text-xs text-blue-500">Read</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
