import { AnimatePresence, motion } from 'framer-motion';

interface LocationPromptProps {
    isAuthenticated: boolean;
    locationGranted: boolean;
    loading: boolean;
    error: string | null;
    locationRequested: boolean;
    onRequestLocation: () => void;
    onDismissError: () => void;
}

export default function LocationPrompt({
    isAuthenticated,
    locationGranted,
    loading,
    error,
    locationRequested,
    onRequestLocation,
    onDismissError,
}: LocationPromptProps) {
    return (
        <>
            <AnimatePresence>
                {!locationGranted && !loading && !error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                        }}
                        className="absolute top-4 left-1/2 z-10 w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 rounded-lg bg-white p-3 shadow-lg md:top-20 md:left-4 md:w-auto md:translate-x-0 md:p-4"
                    >
                        <div className="flex items-start gap-2 md:gap-3">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-5 w-5 text-blue-600 md:h-6 md:w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h4 className="mb-1 text-xs font-semibold text-gray-900 md:text-sm">
                                    {isAuthenticated
                                        ? 'Enable Location'
                                        : 'Share Your Location'}
                                </h4>
                                <p className="mb-2 text-xs text-gray-600 md:mb-3">
                                    {isAuthenticated
                                        ? 'Find users near you by enabling location access'
                                        : 'Log in to share your location and find people nearby'}
                                </p>
                                <button
                                    onClick={onRequestLocation}
                                    className="w-full rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700 md:px-4 md:py-2 md:text-sm"
                                >
                                    {isAuthenticated
                                        ? 'Enable Location'
                                        : 'Log In'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {loading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                        }}
                        className="absolute top-4 left-1/2 z-30 -translate-x-1/2 rounded-lg bg-gray-900/90 px-3 py-2 text-xs text-white shadow-lg md:px-4 md:text-sm"
                    >
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-white md:h-4 md:w-4"></div>
                            <span className="whitespace-nowrap">
                                Getting your location...
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                        }}
                        className="absolute top-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-lg bg-red-600/90 px-3 py-2 text-white shadow-lg md:px-4 md:py-3"
                    >
                        <div className="flex gap-2 md:gap-3">
                            <svg
                                className="mt-0.5 h-4 w-4 flex-shrink-0 md:h-5 md:w-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                            <div className="flex-1 space-y-1 md:space-y-2">
                                <p className="text-xs md:text-sm">{error}</p>
                                {locationRequested && !locationGranted && (
                                    <button
                                        onClick={onRequestLocation}
                                        className="rounded bg-white px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 md:px-3 md:text-sm"
                                    >
                                        Try Again
                                    </button>
                                )}
                                {locationGranted && (
                                    <p className="text-xs opacity-90">
                                        You can still browse the map and search
                                        for users in other locations.
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={onDismissError}
                                className="flex-shrink-0 text-white transition-colors hover:text-gray-200"
                            >
                                <svg
                                    className="h-4 w-4 md:h-5 md:w-5"
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
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
