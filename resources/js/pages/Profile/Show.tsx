import PageTransition from '@/components/PageTransition';
import AppLayout from '@/Layouts/AppLayout';
import { router, usePage } from '@inertiajs/react';

interface ProfileUser {
    id: number;
    name: string;
    avatar: string | null;
    age: number | null;
    gender: string | null;
    last_seen_at: string | null;
}

interface PageProps {
    profileUser: ProfileUser;
    isFriend: boolean;
    isOwn: boolean;
    auth?: { user?: { id: number } };
}

function getLastSeenText(lastSeenAt: string | null): string {
    if (!lastSeenAt) return 'Never';
    const diff = Math.floor(
        (Date.now() - new Date(lastSeenAt).getTime()) / 1000 / 60,
    );
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
}

export default function ProfileShow() {
    const { profileUser, isFriend, isOwn, auth } = usePage<PageProps>().props;
    const isAuthenticated = !!auth?.user;

    const handleStartChat = async () => {
        const { default: axios } = await import('@/bootstrap');
        try {
            await axios.post('/chat/messages', {
                recipient_id: profileUser.id,
                content: 'Hi! 👋',
            });
            router.visit('/chat');
        } catch {
            // ignore
        }
    };

    const handleFriendRequest = async () => {
        const { default: axios } = await import('@/bootstrap');
        try {
            await axios.post('/friends', { friend_id: profileUser.id });
            router.reload();
        } catch {
            // ignore
        }
    };

    return (
        <AppLayout>
            <PageTransition className="flex min-h-screen items-start justify-center bg-gray-50 px-4 py-12">
                <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
                    {/* Avatar */}
                    <div className="mb-6 flex flex-col items-center gap-3">
                        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-4xl font-bold text-white shadow-md">
                            {profileUser.avatar ? (
                                <img
                                    src={`/storage/${profileUser.avatar}`}
                                    alt={profileUser.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                profileUser.name.charAt(0).toUpperCase()
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {profileUser.name}
                        </h1>
                        <p className="text-sm text-gray-500">
                            Last seen:{' '}
                            {getLastSeenText(profileUser.last_seen_at)}
                        </p>
                    </div>

                    {/* Details */}
                    <div className="mb-6 space-y-3">
                        {profileUser.age && (
                            <div className="flex justify-between rounded-lg bg-gray-50 px-4 py-2.5 text-sm">
                                <span className="text-gray-500">Age</span>
                                <span className="font-medium text-gray-900">
                                    {profileUser.age}
                                </span>
                            </div>
                        )}
                        {profileUser.gender && (
                            <div className="flex justify-between rounded-lg bg-gray-50 px-4 py-2.5 text-sm">
                                <span className="text-gray-500">Gender</span>
                                <span className="font-medium text-gray-900 capitalize">
                                    {profileUser.gender}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {!isOwn && isAuthenticated && (
                        <div className="flex gap-3">
                            <button
                                onClick={handleStartChat}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                            >
                                <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                                Message
                            </button>

                            {!isFriend && (
                                <button
                                    onClick={handleFriendRequest}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
                                >
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                        />
                                    </svg>
                                    Add Friend
                                </button>
                            )}

                            {isFriend && (
                                <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700">
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    Friends
                                </div>
                            )}
                        </div>
                    )}

                    {isOwn && (
                        <button
                            onClick={() => router.visit('/')}
                            className="w-full rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                        >
                            Back to Map
                        </button>
                    )}
                </div>
            </PageTransition>
        </AppLayout>
    );
}
