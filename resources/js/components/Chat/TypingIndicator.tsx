import { motion } from 'framer-motion';

interface TypingIndicatorProps {
    userName?: string;
    variant?: 'bubble' | 'inline';
}

export default function TypingIndicator({
    userName,
    variant = 'bubble',
}: TypingIndicatorProps) {
    const dotVariants = {
        initial: { y: 0 },
        animate: { y: -8 },
    };

    const dotTransition = {
        duration: 0.5,
        repeat: Infinity,
        repeatType: 'reverse' as const,
        ease: 'easeInOut',
    };

    if (variant === 'inline') {
        return (
            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                <span className="font-medium">typing</span>
                <div className="flex gap-0.5">
                    <motion.span
                        variants={dotVariants}
                        initial="initial"
                        animate="animate"
                        transition={{ ...dotTransition, delay: 0 }}
                        className="inline-block"
                    >
                        .
                    </motion.span>
                    <motion.span
                        variants={dotVariants}
                        initial="initial"
                        animate="animate"
                        transition={{ ...dotTransition, delay: 0.1 }}
                        className="inline-block"
                    >
                        .
                    </motion.span>
                    <motion.span
                        variants={dotVariants}
                        initial="initial"
                        animate="animate"
                        transition={{ ...dotTransition, delay: 0.2 }}
                        className="inline-block"
                    >
                        .
                    </motion.span>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="mb-3 flex items-end gap-2"
        >
            <div className="relative flex max-w-[70%] flex-col gap-1 rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-3 shadow-sm dark:from-blue-900/30 dark:to-blue-800/30">
                {userName && (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {userName}
                    </span>
                )}
                <div className="flex items-center gap-1">
                    <motion.div
                        variants={dotVariants}
                        initial="initial"
                        animate="animate"
                        transition={{ ...dotTransition, delay: 0 }}
                        className="size-2 rounded-full bg-blue-500"
                    />
                    <motion.div
                        variants={dotVariants}
                        initial="initial"
                        animate="animate"
                        transition={{ ...dotTransition, delay: 0.1 }}
                        className="size-2 rounded-full bg-blue-500"
                    />
                    <motion.div
                        variants={dotVariants}
                        initial="initial"
                        animate="animate"
                        transition={{ ...dotTransition, delay: 0.2 }}
                        className="size-2 rounded-full bg-blue-500"
                    />
                </div>
            </div>
        </motion.div>
    );
}
