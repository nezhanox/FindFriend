import PageTransition from '@/components/PageTransition';
import AppLayout from '@/Layouts/AppLayout';
import { ActivityFeedItem, ActivityType } from '@/types/feed';
import { Head, Link } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { MessageCircle, Rss, UserCheck, UserPlus, Users } from 'lucide-react';
import { ReactNode } from 'react';

interface Props {
    items: ActivityFeedItem[];
}

const iconMap: Record<ActivityType, ReactNode> = {
    friendship_accepted: <UserCheck className="h-4 w-4" />,
    friend_request_sent: <UserPlus className="h-4 w-4" />,
    message_sent: <MessageCircle className="h-4 w-4" />,
    user_joined: <Users className="h-4 w-4" />,
};

const colorMap: Record<ActivityType, string> = {
    friendship_accepted: 'bg-green-500/20 text-green-400',
    friend_request_sent: 'bg-blue-500/20 text-blue-400',
    message_sent: 'bg-purple-500/20 text-purple-400',
    user_joined: 'bg-orange-500/20 text-orange-400',
};

function Avatar({
    name,
    avatarUrl,
}: {
    name: string;
    avatarUrl: string | null;
}) {
    if (avatarUrl) {
        return (
            <img
                src={`/storage/${avatarUrl}`}
                alt={name}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-white/10"
            />
        );
    }
    return (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white ring-2 ring-white/10">
            {name.charAt(0).toUpperCase()}
        </div>
    );
}

function FeedItem({ item, index }: { item: ActivityFeedItem; index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.3 }}
            className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm"
        >
            {/* Icon badge */}
            <div
                className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${colorMap[item.type]}`}
            >
                {iconMap[item.type]}
            </div>

            {/* Content */}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-1 text-sm">
                    <Link
                        href={`/users/${item.actor.id}`}
                        className="font-semibold text-white hover:underline"
                    >
                        {item.actor.name}
                    </Link>
                    <span className="text-white/60">{item.label}</span>
                    {item.subject && (
                        <Link
                            href={`/users/${item.subject.id}`}
                            className="font-semibold text-white hover:underline"
                        >
                            {item.subject.name}
                        </Link>
                    )}
                </div>
                <span className="text-xs text-white/40">
                    {formatDistanceToNow(new Date(item.occurred_at), {
                        addSuffix: true,
                        locale: uk,
                    })}
                </span>
            </div>

            {/* Avatars */}
            <div className="flex flex-shrink-0 -space-x-2">
                <Avatar
                    name={item.actor.name}
                    avatarUrl={item.actor.avatar_url}
                />
                {item.subject && (
                    <Avatar
                        name={item.subject.name}
                        avatarUrl={item.subject.avatar_url}
                    />
                )}
            </div>
        </motion.div>
    );
}

export default function FeedIndex({ items }: Props) {
    return (
        <AppLayout>
            <Head title="Стрічка активності" />
            <PageTransition>
                <div className="min-h-screen px-4 py-8">
                    <div className="mx-auto max-w-2xl">
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 flex items-center gap-3"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                                <Rss className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">
                                    Стрічка активності
                                </h1>
                                <p className="text-sm text-white/50">
                                    Останні події у FindFriend
                                </p>
                            </div>
                        </motion.div>

                        {/* Feed list */}
                        {items.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-20 text-center"
                            >
                                <Rss className="mx-auto mb-4 h-12 w-12 text-white/20" />
                                <p className="text-white/40">
                                    Поки немає активності
                                </p>
                            </motion.div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {items.map((item, i) => (
                                    <FeedItem
                                        key={item.id}
                                        item={item}
                                        index={i}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </PageTransition>
        </AppLayout>
    );
}
