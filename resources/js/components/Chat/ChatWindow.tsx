import axios from '@/bootstrap';
import { ConversationDetail, Message } from '@/types/chat';
import { echo } from '@laravel/echo-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

interface ChatWindowProps {
    conversation: ConversationDetail;
    initialMessages: Message[];
    currentUserId: number;
    onBack?: () => void;
}

export default function ChatWindow({
    conversation,
    initialMessages,
    currentUserId,
    onBack,
}: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        scrollToBottom('auto');
    }, []);

    useEffect(() => {
        if (messages.length > initialMessages.length) {
            scrollToBottom();
        }
    }, [messages.length, initialMessages.length]);

    useEffect(() => {
        const channel = echo().private(`conversation.${conversation.id}`);

        channel.listen('.MessageSent', (event: Message) => {
            setMessages((prev) => [...prev, event]);

            if (event.sender_id !== currentUserId) {
                axios
                    .post(`/chat/conversations/${conversation.id}/mark-as-read`)
                    .catch((error) => {
                        console.error('Failed to mark message as read:', error);
                    });
            }
        });

        channel.listen('.MessageRead', () => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.sender_id === currentUserId && !msg.read_at
                        ? { ...msg, read_at: new Date().toISOString() }
                        : msg,
                ),
            );
        });

        return () => {
            echo().leave(`conversation.${conversation.id}`);
        };
    }, [conversation.id, currentUserId]);

    const handleSendMessage = async (content: string) => {
        setSending(true);

        try {
            await axios.post('/chat/messages', {
                content,
                recipient_id: conversation.other_user.id,
            });
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="flex h-full flex-col overflow-hidden border-0 border-white/10 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 shadow-2xl md:rounded-3xl md:border md:bg-white/5 md:backdrop-blur-2xl md:backdrop-saturate-150 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
            style={{ touchAction: 'none' }}
        >
            {/* Header - Fixed to top */}
            <div
                className="flex shrink-0 items-center gap-2 border-b border-white/20 bg-white/10 p-3 shadow-lg backdrop-blur-2xl backdrop-saturate-150 md:gap-3 md:p-4 md:shadow-none"
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
                }}
            >
                {onBack && (
                    <button
                        onClick={onBack}
                        className="rounded-full p-1.5 transition-colors hover:bg-white/10 md:p-2"
                    >
                        <ArrowLeft className="size-5 text-gray-900 dark:text-white" />
                    </button>
                )}
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="size-9 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-purple-500 ring-2 ring-white/30 md:size-10 md:ring-0">
                        {conversation.other_user.avatar ? (
                            <img
                                src={conversation.other_user.avatar}
                                alt={conversation.other_user.name}
                                className="size-full object-cover"
                            />
                        ) : (
                            <div className="flex size-full items-center justify-center text-sm font-semibold text-white">
                                {conversation.other_user.name
                                    .charAt(0)
                                    .toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                            {conversation.other_user.name}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto overscroll-contain bg-transparent p-3 md:p-4"
                style={{
                    WebkitOverflowScrolling: 'touch',
                    minHeight: 0,
                    touchAction: 'pan-y',
                }}
            >
                <AnimatePresence initial={false}>
                    {messages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            isOwn={message.sender_id === currentUserId}
                        />
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input - Fixed to bottom */}
            <div
                className="shrink-0"
                style={{
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 10,
                    paddingBottom: 'max(0rem, env(safe-area-inset-bottom))',
                }}
            >
                <MessageInput onSend={handleSendMessage} disabled={sending} />
            </div>
        </motion.div>
    );
}
