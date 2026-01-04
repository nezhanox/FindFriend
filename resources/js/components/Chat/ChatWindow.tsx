import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { router } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { Message, ConversationDetail } from '@/types/chat';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { ArrowLeft } from 'lucide-react';

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
    }, [messages.length]);

    // Listen for new messages via Echo
    useEffect(() => {
        const channel = echo().private(`conversation.${conversation.id}`);

        channel.listen('.MessageSent', (event: { message: Message }) => {
            setMessages((prev) => [...prev, event.message]);

            // Mark as read if message is from other user
            if (event.message.sender_id !== currentUserId) {
                router.post(
                    `/chat/conversations/${conversation.id}/mark-as-read`,
                    {},
                    { preserveScroll: true },
                );
            }
        });

        channel.listen('.MessageRead', () => {
            // Update read status for own messages
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
            const response = await fetch('/chat/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    content,
                    recipient_id: conversation.other_user.id,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            // Message will be added via Echo event
        } catch (error) {
            console.error('Error sending message:', error);
            // TODO: Show error toast
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
            className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-2xl backdrop-saturate-150"
        >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="rounded-full p-2 transition-colors hover:bg-white/10"
                    >
                        <ArrowLeft className="size-5" />
                    </button>
                )}
                <div className="flex items-center gap-3">
                    <div className="size-10 overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
                        {conversation.other_user.avatar ? (
                            <img
                                src={conversation.other_user.avatar}
                                alt={conversation.other_user.name}
                                className="size-full object-cover"
                            />
                        ) : (
                            <div className="flex size-full items-center justify-center text-sm font-semibold text-white">
                                {conversation.other_user.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <h2 className="font-semibold text-gray-900 dark:text-white">
                            {conversation.other_user.name}
                        </h2>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4">
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

            {/* Input */}
            <MessageInput onSend={handleSendMessage} disabled={sending} />
        </motion.div>
    );
}
