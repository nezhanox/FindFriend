import UserList from '@/components/UserList';
import { UserMarker } from '@/types/location';
import { AnimatePresence, motion } from 'framer-motion';
import { Users } from 'lucide-react';

interface MapSidebarProps {
    allUsers: UserMarker[];
    nearby: UserMarker[];
    locationGranted: boolean;
    fetchingNearby: boolean;
    isAuthenticated: boolean;
    showSidebar: boolean;
    showOnlyFriends: boolean;
    radius: number;
    currentUserId: number | null;
    onUserClick: (user: UserMarker) => void;
    onToggleSidebar: () => void;
    onToggleFriendsFilter: (onlyFriends: boolean) => void;
}

export default function MapSidebar({
    allUsers,
    nearby,
    locationGranted,
    fetchingNearby,
    isAuthenticated,
    showSidebar,
    showOnlyFriends,
    radius,
    currentUserId,
    onUserClick,
    onToggleSidebar,
    onToggleFriendsFilter,
}: MapSidebarProps) {
    return (
        <>
            {/* Toggle button - mobile only */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                onClick={onToggleSidebar}
                className="absolute right-4 bottom-4 z-20 rounded-full bg-blue-600 p-3 text-white shadow-lg transition-colors hover:bg-blue-700 md:hidden"
                aria-label="Toggle user list"
            >
                <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    {showSidebar ? (
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    ) : (
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                    )}
                </svg>
            </motion.button>

            {/* Sidebar panel */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                    delay: 0.2,
                }}
                className={`fixed right-0 bottom-0 z-30 flex max-h-[70vh] w-full flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-in-out md:relative md:right-auto md:bottom-auto md:z-auto md:max-h-screen md:w-80 ${showSidebar ? 'translate-y-0' : 'translate-y-full md:translate-y-0'} rounded-t-2xl md:rounded-none`}
            >
                <div className="sticky top-0 z-20 border-b border-gray-200 bg-white px-3 py-2 md:px-4 md:py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <h2 className="text-base font-semibold text-gray-900 md:text-lg">
                                {locationGranted ? 'Nearby Users' : 'All Users'}
                            </h2>
                            <div className="mt-0.5 text-xs text-gray-500 md:mt-1 md:text-sm">
                                {fetchingNearby ? (
                                    <span className="inline-flex items-center gap-1">
                                        <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-gray-600"></div>
                                        Loading...
                                    </span>
                                ) : locationGranted ? (
                                    `${nearby.length} ${nearby.length === 1 ? 'person' : 'people'} within ${radius} km`
                                ) : (
                                    `${allUsers.length} ${allUsers.length === 1 ? 'user' : 'users'} nearby`
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onToggleSidebar}
                            className="p-1 text-gray-400 hover:text-gray-600 md:hidden"
                            aria-label="Close user list"
                        >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>

                    {isAuthenticated && (
                        <div className="mt-2 flex gap-2">
                            <button
                                onClick={() => onToggleFriendsFilter(false)}
                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${!showOnlyFriends ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Всі
                            </button>
                            <button
                                onClick={() => onToggleFriendsFilter(true)}
                                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${showOnlyFriends ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                <Users className="size-3" />
                                Друзі
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    <UserList
                        users={locationGranted ? nearby : allUsers}
                        isLoading={fetchingNearby}
                        onUserClick={onUserClick}
                        isAuthenticated={isAuthenticated}
                        showOnlyFriends={showOnlyFriends}
                        currentUserId={currentUserId}
                    />
                </div>
            </motion.div>

            {/* Mobile overlay */}
            <AnimatePresence>
                {showSidebar && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-20 bg-black/50 md:hidden"
                        onClick={onToggleSidebar}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
