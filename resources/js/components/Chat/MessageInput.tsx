import axios from '@/bootstrap';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

interface MessageInputProps {
    conversationId: number;
    onSend: (content: string) => void;
    disabled?: boolean;
}

export default function MessageInput({
    conversationId,
    onSend,
    disabled = false,
}: MessageInputProps) {
    const [content, setContent] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const sendTypingEvent = (typing: boolean) => {
        axios
            .post(`/chat/conversations/${conversationId}/typing`, { typing })
            .catch((error) => {
                console.error('Failed to send typing status:', error);
            });
    };

    const handleTyping = () => {
        if (!isTyping) {
            setIsTyping(true);
            sendTypingEvent(true);
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            sendTypingEvent(false);
        }, 3000);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (content.trim() === '' || disabled) {
            return;
        }

        // Stop typing indicator
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        setIsTyping(false);
        sendTypingEvent(false);

        onSend(content.trim());
        setContent('');
    };

    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (isTyping) {
                sendTypingEvent(false);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <form
            onSubmit={handleSubmit}
            className="border-t border-white/20 bg-white/10 p-3 shadow-lg backdrop-blur-2xl backdrop-saturate-150 md:p-4 md:shadow-none"
        >
            <div className="flex items-end gap-2">
                <motion.div
                    className="relative flex-1"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                    <textarea
                        value={content}
                        onChange={(e) => {
                            setContent(e.target.value);
                            handleTyping();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder="Type a message..."
                        disabled={disabled}
                        rows={1}
                        className="w-full resize-none rounded-2xl border border-white/30 bg-white px-4 py-2.5 text-[15px] text-gray-900 placeholder-gray-500 transition-all duration-200 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-400/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:rounded-3xl md:border-white/20 md:bg-white/10 md:px-6 md:py-3 md:text-sm md:backdrop-blur-2xl md:backdrop-saturate-150 md:focus:border-blue-500/50 md:focus:bg-white/20 md:focus:ring-blue-500/20 md:dark:text-white md:dark:placeholder-gray-400"
                        style={{ maxHeight: '120px' }}
                    />
                </motion.div>

                <motion.button
                    type="submit"
                    disabled={disabled || content.trim() === ''}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-lg shadow-white/30 transition-all duration-200 hover:shadow-xl hover:shadow-white/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none md:size-12 md:bg-gradient-to-br md:from-blue-500 md:to-blue-600 md:text-white md:shadow-blue-500/30 md:hover:shadow-blue-500/40"
                >
                    <Send className="size-5 md:size-5" />
                </motion.button>
            </div>
        </form>
    );
}
