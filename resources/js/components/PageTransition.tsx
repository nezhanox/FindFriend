import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}

/**
 * PageTransition component for consistent page animations
 * Uses the same spring configuration as the chat feature
 */
export default function PageTransition({
    children,
    className = '',
}: PageTransitionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30,
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
