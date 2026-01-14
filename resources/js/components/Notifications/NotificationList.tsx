import type { Notification } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Bell, MessageCircle } from 'lucide-react';

interface NotificationListProps {
    notifications: Notification[];
    isLoading: boolean;
    onNotificationClick: (notification: Notification) => void;
}

export function NotificationList({
    notifications,
    isLoading,
    onNotificationClick,
}: NotificationListProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    // Filter out any undefined or null notifications
    const validNotifications = (notifications || []).filter(
        (notification): notification is Notification =>
            notification !== null &&
            notification !== undefined &&
            typeof notification.id !== 'undefined',
    );

    if (validNotifications.length === 0) {
        return (
            <div className="p-8 text-center">
                <Bell className="mx-auto mb-3 h-12 w-12 text-gray-400 dark:text-gray-500" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Поки немає сповіщень
                </p>
            </div>
        );
    }

    return (
        <div className="max-h-[500px] overflow-y-auto">
            {validNotifications.map((notification, index) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => onNotificationClick(notification)}
                    index={index}
                />
            ))}
        </div>
    );
}

interface NotificationItemProps {
    notification: Notification;
    onClick: () => void;
    index: number;
}

function NotificationItem({
    notification,
    onClick,
    index,
}: NotificationItemProps) {
    const isUnread = !notification.read_at;

    const getIcon = () => {
        switch (notification.type) {
            case 'new_message':
                return <MessageCircle className="h-5 w-5" />;
            default:
                return <Bell className="h-5 w-5" />;
        }
    };

    const getIconColor = () => {
        switch (notification.type) {
            case 'new_message':
                return 'text-blue-500';
            default:
                return 'text-gray-500';
        }
    };

    return (
        <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={onClick}
            className={`w-full border-b border-white/10 p-4 text-left transition-colors hover:bg-white/10 ${
                isUnread ? 'bg-blue-50/10' : ''
            }`}
        >
            <div className="flex gap-3">
                <div
                    className={`mt-1 flex-shrink-0 rounded-full bg-white/10 p-2 ${getIconColor()}`}
                >
                    {getIcon()}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <h4
                            className={`text-sm font-medium ${
                                isUnread
                                    ? 'text-gray-900 dark:text-white'
                                    : 'text-gray-700 dark:text-gray-300'
                            }`}
                        >
                            {notification.title}
                        </h4>
                        {isUnread && (
                            <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                        )}
                    </div>

                    <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                        {notification.message}
                    </p>

                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                        {formatDistanceToNow(
                            new Date(notification.created_at),
                            {
                                addSuffix: true,
                                locale: uk,
                            },
                        )}
                    </p>
                </div>
            </div>
        </motion.button>
    );
}
