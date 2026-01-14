import { NotificationBell } from '@/components/Notifications';
import { usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        } | null;
    };
}

interface AppLayoutProps {
    children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
    const { auth } = usePage<PageProps>().props;
    const isAuthenticated = !!auth.user;

    return (
        <div className="relative min-h-screen">
            {/* Notification Bell - Fixed in top right corner for authenticated users */}
            {isAuthenticated && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                        delay: 0.2,
                    }}
                    className="fixed top-4 right-4 z-[9000]"
                >
                    <NotificationBell />
                </motion.div>
            )}

            {/* Page Content */}
            {children}
        </div>
    );
}
