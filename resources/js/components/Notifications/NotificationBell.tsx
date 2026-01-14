import type { Notification } from '@/types/notification';
import { router, usePage } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NotificationList } from './NotificationList';

interface PageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
        } | null;
    };
}

export function NotificationBell() {
    const { auth } = usePage<PageProps>().props;
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch notifications on mount
    useEffect(() => {
        if (auth.user) {
            fetchNotifications();
        } else {
            setIsLoading(false);
        }
    }, [auth.user]);

    // Listen for new notifications via Echo
    useEffect(() => {
        if (!auth.user) return;
        const userId = auth.user.id;

        const channel = echo().private(`user.${userId}`);

        channel.listen(
            '.NewNotification',
            (event: { notification: Notification }) => {
                const newNotification = event.notification;

                // Validate notification has required fields
                if (
                    newNotification &&
                    typeof newNotification.id !== 'undefined'
                ) {
                    setNotifications((prev) => [newNotification, ...prev]);
                    setUnreadCount((prev) => prev + 1);
                } else {
                    console.warn(
                        'Received invalid notification:',
                        newNotification,
                    );
                }
            },
        );

        return () => {
            channel.stopListening('.NewNotification');
            echo().leave(`user.${userId}`);
        };
    }, [auth.user]);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('/notifications');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Ensure we have a valid array of notifications
            const notificationsList = Array.isArray(data.notifications)
                ? data.notifications.filter(
                      (n: unknown): n is Notification =>
                          typeof n === 'object' &&
                          n !== null &&
                          'id' in n &&
                          typeof (n as { id: unknown }).id !== 'undefined',
                  )
                : [];

            setNotifications(notificationsList);
            setUnreadCount(data.unread_count || 0);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId: number) => {
        try {
            await fetch(`/notifications/${notificationId}/mark-as-read`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
            });

            setNotifications((prev) =>
                prev
                    .filter((n) => n && typeof n.id !== 'undefined')
                    .map((n) =>
                        n.id === notificationId
                            ? { ...n, read_at: new Date().toISOString() }
                            : n,
                    ),
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await fetch('/notifications/mark-all-as-read', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
            });

            setNotifications((prev) =>
                prev
                    .filter((n) => n && typeof n.id !== 'undefined')
                    .map((n) => ({
                        ...n,
                        read_at: n.read_at || new Date().toISOString(),
                    })),
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read_at) {
            handleMarkAsRead(notification.id);
        }

        if (notification.action_url) {
            setIsOpen(false);
            router.visit(notification.action_url);
        }
    };

    return (
        <div className="relative">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="relative rounded-full border border-white/20 bg-white/10 p-2 backdrop-blur-2xl transition-colors hover:bg-white/20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Bell className="h-5 w-5 text-gray-700 dark:text-gray-200" />

                {unreadCount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 px-1.5 text-xs font-bold text-white shadow-lg"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.div>
                )}
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9998]"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Notification Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{
                                type: 'spring',
                                stiffness: 300,
                                damping: 30,
                            }}
                            className="absolute right-0 z-[9999] mt-2 max-h-[600px] w-96 overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-2xl backdrop-saturate-150"
                        >
                            <div className="flex items-center justify-between border-b border-white/20 p-4">
                                <h3 className="font-semibold text-gray-800 dark:text-white">
                                    Сповіщення
                                </h3>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                                    >
                                        Позначити всі прочитаними
                                    </button>
                                )}
                            </div>

                            <NotificationList
                                notifications={notifications}
                                isLoading={isLoading}
                                onNotificationClick={handleNotificationClick}
                            />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
