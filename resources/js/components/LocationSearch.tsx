import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';

interface LocationSearchProps {
    lat: number;
    lng: number;
    onLocationSelect: (lat: number, lng: number, address: string) => void;
    onCurrentLocation: () => void;
}

interface GeocodeFeature {
    place_name: string;
    center: [number, number];
}

export default function LocationSearch({
    lat,
    lng,
    onLocationSelect,
    onCurrentLocation,
}: LocationSearchProps) {
    const [address, setAddress] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [suggestions, setSuggestions] = useState<GeocodeFeature[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const searchTimeout = useRef<NodeJS.Timeout>();
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Reverse geocode current coordinates to get address
    const reverseGeocode = useCallback(
        async (latitude: number, longitude: number) => {
            try {
                const response = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`,
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch address');
                }

                const data = await response.json();
                if (data.features && data.features.length > 0) {
                    setAddress(data.features[0].place_name);
                }
            } catch (error) {
                console.error('Reverse geocoding error:', error);
                setAddress('Unable to determine address');
            }
        },
        [],
    );

    // Forward geocode search query to get suggestions
    const forwardGeocode = useCallback(async (query: string) => {
        if (!query || query.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsSearching(true);

        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}&limit=5`,
            );

            if (!response.ok) {
                throw new Error('Failed to search address');
            }

            const data = await response.json();
            setSuggestions(data.features || []);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Forward geocoding error:', error);
            setSuggestions([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Debounce search
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        searchTimeout.current = setTimeout(() => {
            void forwardGeocode(value);
        }, 300);
    };

    // Handle suggestion selection
    const handleSuggestionSelect = (feature: GeocodeFeature) => {
        const [longitude, latitude] = feature.center;
        setSearchQuery(feature.place_name);
        setAddress(feature.place_name);
        setSuggestions([]);
        setShowSuggestions(false);
        onLocationSelect(latitude, longitude, feature.place_name);
    };

    // Handle Enter key
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && suggestions.length > 0) {
            handleSuggestionSelect(suggestions[0]);
        }
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update address when coordinates change
    useEffect(() => {
        void reverseGeocode(lat, lng);
    }, [lat, lng, reverseGeocode]);

    return (
        <div ref={wrapperRef} className="relative w-full max-w-2xl">
            <div className="flex items-center gap-2 rounded-lg bg-white p-2 shadow-lg">
                {/* Search Input */}
                <div className="relative flex-1">
                    <input
                        type="text"
                        value={searchQuery || address}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            if (suggestions.length > 0) {
                                setShowSuggestions(true);
                            }
                        }}
                        placeholder="Search for a location..."
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                    {isSearching && (
                        <div className="absolute top-1/2 right-3 -translate-y-1/2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                        </div>
                    )}
                </div>

                {/* Current Location Button */}
                <button
                    onClick={onCurrentLocation}
                    className="flex-shrink-0 rounded-md bg-blue-600 p-2 text-white transition-colors hover:bg-blue-700"
                    title="Use my current location"
                >
                    <svg
                        className="h-5 w-5"
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
                </button>

                {/* Apply Button */}
                {searchQuery && searchQuery !== address && (
                    <button
                        onClick={() => {
                            if (suggestions.length > 0) {
                                handleSuggestionSelect(suggestions[0]);
                            }
                        }}
                        className="flex-shrink-0 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                    >
                        Apply
                    </button>
                )}
            </div>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full z-50 mt-2 w-full rounded-lg bg-white shadow-xl"
                    >
                        <ul className="max-h-64 overflow-y-auto rounded-lg">
                            {suggestions.map((feature, index) => (
                                <li key={index}>
                                    <button
                                        onClick={() =>
                                            handleSuggestionSelect(feature)
                                        }
                                        className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-gray-100"
                                    >
                                        <div className="flex items-start gap-2">
                                            <svg
                                                className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400"
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
                                            <span className="text-gray-900">
                                                {feature.place_name}
                                            </span>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
