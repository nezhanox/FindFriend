import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

interface MessageInputProps {
    onSend: (content: string) => void;
    disabled?: boolean;
}

export default function MessageInput({ onSend, disabled = false }: MessageInputProps) {
    const [content, setContent] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (content.trim() === '' || disabled) {
            return;
        }

        onSend(content.trim());
        setContent('');
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="border-t border-white/10 bg-white/5 p-4 backdrop-blur-xl"
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
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                        placeholder="Type a message..."
                        disabled={disabled}
                        rows={1}
                        className="
                            w-full resize-none rounded-3xl border border-white/20
                            bg-white/10 px-6 py-3 text-sm text-gray-900
                            placeholder-gray-500 backdrop-blur-2xl backdrop-saturate-150
                            transition-all duration-200
                            focus:border-blue-500/50 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20
                            disabled:cursor-not-allowed disabled:opacity-50
                            dark:text-white dark:placeholder-gray-400
                        "
                    />
                </motion.div>

                <motion.button
                    type="submit"
                    disabled={disabled || content.trim() === ''}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="
                        flex size-12 shrink-0 items-center justify-center
                        rounded-full bg-gradient-to-br from-blue-500 to-blue-600
                        text-white shadow-lg shadow-blue-500/30
                        transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40
                        disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none
                    "
                >
                    <Send className="size-5" />
                </motion.button>
            </div>
        </form>
    );
}
