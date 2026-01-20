import axios from '@/bootstrap';
import { motion } from 'framer-motion';
import { Check, User as UserIcon, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface FriendRequest {
    id: number;
    user: {
        id: number;
        name: string;
        avatar: string | null;
        age: number | null;
        gender: string | null;
    };
    created_at: string;
}

export default function FriendRequestList() {
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    const loadRequests = () => {
        setLoading(true);
        axios
            .get<{ requests: FriendRequest[]; count: number }>(
                '/friends/requests/pending',
            )
            .then((response) => {
                setRequests(response.data.requests);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Failed to load friend requests:', error);
                setLoading(false);
            });
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const handleAccept = async (requestId: number) => {
        setProcessingId(requestId);
        try {
            await axios.post(`/friends/requests/${requestId}/accept`);
            // Remove from list after accepting
            setRequests((prev) => prev.filter((req) => req.id !== requestId));
        } catch (error) {
            console.error('Failed to accept request:', error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId: number) => {
        setProcessingId(requestId);
        try {
            await axios.post(`/friends/requests/${requestId}/reject`);
            // Remove from list after rejecting
            setRequests((prev) => prev.filter((req) => req.id !== requestId));
        } catch (error) {
            console.error('Failed to reject request:', error);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <UserIcon className="mb-4 h-12 w-12 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Немає запрошень в друзі
                </p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {requests.map((request, index) => (
                <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        delay: index * 0.05,
                        duration: 0.3,
                    }}
                    className="flex items-center gap-3 p-4"
                >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        {request.user.avatar ? (
                            <img
                                src={`/storage/${request.user.avatar}`}
                                alt={request.user.name}
                                className="h-12 w-12 rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                                <UserIcon className="h-6 w-6 text-white" />
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                            {request.user.name}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            {request.user.age && (
                                <span>{request.user.age} років</span>
                            )}
                            {request.user.gender && (
                                <>
                                    {request.user.age && <span>•</span>}
                                    <span className="capitalize">
                                        {request.user.gender}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleAccept(request.id)}
                            disabled={processingId === request.id}
                            className="flex items-center justify-center rounded-full bg-green-100 p-2 text-green-600 transition-colors hover:bg-green-200 disabled:opacity-50 dark:bg-green-900/30 dark:text-green-400"
                        >
                            {processingId === request.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
                            ) : (
                                <Check className="h-4 w-4" />
                            )}
                        </button>
                        <button
                            onClick={() => handleReject(request.id)}
                            disabled={processingId === request.id}
                            className="flex items-center justify-center rounded-full bg-red-100 p-2 text-red-600 transition-colors hover:bg-red-200 disabled:opacity-50 dark:bg-red-900/30 dark:text-red-400"
                        >
                            {processingId === request.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                            ) : (
                                <X className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
