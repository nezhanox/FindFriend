import AppLayout from '@/Layouts/AppLayout';
import PageTransition from '@/components/PageTransition';
import UserList from '@/components/UserList';
import {
    LocationUpdate,
    NearbyUsersResponse,
    UserMarker,
} from '@/types/location';
import { router, usePage } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import { AnimatePresence, motion } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function getMinutesSinceLastSeen(
    lastSeenAt: string | null | undefined,
): number {
    if (!lastSeenAt) return Infinity;
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    return Math.floor((now.getTime() - lastSeen.getTime()) / 1000 / 60);
}

interface PageProps {
    auth?: {
        user?: {
            id: number;
            name: string;
            email: string;
        };
    };
    allUsers: UserMarker[];
    currentUserId: number | null;
    sessionId: string;
}

export default function Map() {
    const { auth, allUsers, currentUserId } = usePage<PageProps>().props;
    const isAuthenticated = !!auth?.user;
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const userMarker = useRef<mapboxgl.Marker | null>(null);
    const nearbyMarkers = useRef<Map<number, mapboxgl.Marker>>(
        new globalThis.Map(),
    );
    const lastUpdateTime = useRef<number>(0);
    const [lng, setLng] = useState<number>(30.5234);
    const [lat, setLat] = useState<number>(50.4501);
    const [zoom] = useState<number>(12);
    const [radius, setRadius] = useState<number>(5);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchingNearby, setFetchingNearby] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [nearby, setNearby] = useState<UserMarker[]>([]);
    const [locationRequested, setLocationRequested] = useState<boolean>(false);
    const [locationGranted, setLocationGranted] = useState<boolean>(false);
    const [showSidebar, setShowSidebar] = useState<boolean>(false);

    // Filter users for map display - only show users online within the last hour
    const onlineUsers = useMemo(() => {
        return allUsers.filter((user) => {
            const minutes = getMinutesSinceLastSeen(user.last_seen_at);
            return minutes < 60;
        });
    }, [allUsers]);

    // Request user location
    const requestLocation = useCallback(() => {
        // Check if user is authenticated
        if (!isAuthenticated) {
            router.visit('/login');
            return;
        }

        setLoading(true);
        setError(null);
        setLocationRequested(true);

        const geoOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        };

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;

                setLat(userLat);
                setLng(userLng);
                setLocationGranted(true);

                // Update or create marker
                if (userMarker.current) {
                    userMarker.current.setLngLat([userLng, userLat]);
                } else if (map.current) {
                    const el = document.createElement('div');
                    el.className = 'user-marker';
                    el.style.backgroundColor = '#3b82f6';
                    el.style.width = '20px';
                    el.style.height = '20px';
                    el.style.borderRadius = '50%';
                    el.style.border = '3px solid white';
                    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

                    userMarker.current = new mapboxgl.Marker(el)
                        .setLngLat([userLng, userLat])
                        .addTo(map.current);
                }

                // Fly to user's position
                if (map.current) {
                    map.current.flyTo({
                        center: [userLng, userLat],
                        zoom: 14,
                        essential: true,
                        duration: 2000,
                    });
                }

                // Update location on server
                const now = Date.now();
                if (now - lastUpdateTime.current >= 30000) {
                    lastUpdateTime.current = now;

                    try {
                        const response = await fetch('/api/location/update', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Accept: 'application/json',
                            },
                            body: JSON.stringify({
                                lat: userLat,
                                lng: userLng,
                            }),
                        });

                        if (!response.ok) {
                            if (response.status === 401) {
                                setError(
                                    'Please log in to share your location',
                                );
                                router.visit('/login');
                                return;
                            }
                            throw new Error('Failed to update location');
                        }

                        const data: LocationUpdate = await response.json();
                        console.log('Location updated:', data);
                    } catch (err) {
                        console.error('Error updating location:', err);
                        setError('Failed to update location on server');
                    }
                }

                // Fetch nearby users
                try {
                    const nearbyResponse = await fetch(
                        `/api/location/nearby?lat=${userLat}&lng=${userLng}&radius=${radius}`,
                    );

                    if (nearbyResponse.ok) {
                        const nearbyData: NearbyUsersResponse =
                            await nearbyResponse.json();
                        setNearby(nearbyData.users);
                    }
                } catch (err) {
                    console.error('Error fetching nearby users:', err);
                }

                setLoading(false);
            },
            (error) => {
                console.error('Geolocation error:', error);

                let errorMessage = 'Unable to get your location. ';

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage +=
                            'Location permission was denied. Please allow location access in your browser settings.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage +=
                            "Your device cannot determine your location. On Mac: Open System Settings → Privacy & Security → Location Services and ensure it's enabled for your browser. Using default location (Kyiv, Ukraine) for now.";
                        break;
                    case error.TIMEOUT:
                        errorMessage +=
                            'Location request timed out. Please try again.';
                        break;
                    default:
                        errorMessage +=
                            'An unknown error occurred: ' + error.message;
                }

                setError(errorMessage);
                setLoading(false);

                // If location is unavailable, use default coordinates and fetch nearby users
                if (error.code === error.POSITION_UNAVAILABLE) {
                    setLocationGranted(true); // Allow showing the map with default location

                    // Fetch nearby users with default coordinates (Kyiv, Ukraine)
                    fetch(
                        `/api/location/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
                    )
                        .then((res) => (res.ok ? res.json() : Promise.reject()))
                        .then((data: NearbyUsersResponse) => {
                            setNearby(data.users);
                        })
                        .catch((err) =>
                            console.error('Error fetching nearby users:', err),
                        );
                }
            },
            geoOptions,
        );
    }, [radius, lat, lng, isAuthenticated]);

    // Fetch nearby users
    const fetchNearbyUsers = useCallback(
        async (userLat: number, userLng: number, searchRadius: number) => {
            setFetchingNearby(true);
            try {
                const nearbyResponse = await fetch(
                    `/api/location/nearby?lat=${userLat}&lng=${userLng}&radius=${searchRadius}`,
                );

                if (!nearbyResponse.ok) {
                    throw new Error('Failed to fetch nearby users');
                }

                const nearbyData: NearbyUsersResponse =
                    await nearbyResponse.json();
                setNearby(nearbyData.users);
            } catch (err) {
                console.error('Error fetching nearby users:', err);
            } finally {
                setFetchingNearby(false);
            }
        },
        [],
    );

    // Handle start chat
    const handleStartChat = useCallback(
        async (userId: number) => {
            if (!isAuthenticated) {
                router.visit('/login');
                return;
            }

            try {
                const response = await fetch('/chat/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({
                        recipient_id: userId,
                        content: 'Hi! 👋',
                    }),
                });

                if (response.ok) {
                    router.visit('/chat');
                } else {
                    console.error('Failed to start chat');
                }
            } catch (error) {
                console.error('Error starting chat:', error);
            }
        },
        [isAuthenticated],
    );

    // Handle user click from list
    const handleUserClick = useCallback((user: UserMarker) => {
        if (!map.current) return;

        // Fly to user's location
        map.current.flyTo({
            center: [user.lng, user.lat],
            zoom: 15,
            essential: true,
            duration: 1500,
        });

        // Open the marker's popup
        const marker = nearbyMarkers.current.get(user.id);
        if (marker) {
            marker.togglePopup();
        }
    }, []);

    useEffect(() => {
        if (!mapContainer.current) return;
        if (map.current) return; // Initialize map only once

        // Initialize map
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: [lng, lat],
            zoom: zoom,
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Don't auto-request location - wait for user gesture
        setLoading(false);

        if (!('geolocation' in navigator)) {
            setError('Geolocation is not supported by your browser');
        }

        // Cleanup
        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestLocation]);

    // Render all users on map initialization
    useEffect(() => {
        if (!map.current || !onlineUsers || onlineUsers.length === 0) return;

        // Clear existing markers first
        nearbyMarkers.current.forEach((marker) => marker.remove());
        nearbyMarkers.current.clear();

        // Create markers for online users only (< 60 minutes)
        onlineUsers.forEach((user) => {
            const isCurrentUser = user.id === currentUserId;

            // Create marker element with different styling for current user
            const el = document.createElement('div');
            el.className = isCurrentUser
                ? 'current-user-marker'
                : 'user-marker';
            el.style.backgroundColor = isCurrentUser ? '#3b82f6' : '#ef4444';
            el.style.width = isCurrentUser ? '20px' : '16px';
            el.style.height = isCurrentUser ? '20px' : '16px';
            el.style.borderRadius = '50%';
            el.style.border = isCurrentUser
                ? '3px solid white'
                : '2px solid white';
            el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            el.style.cursor = 'pointer';

            // Create popup content
            const popupContent = document.createElement('div');
            popupContent.className = 'text-sm';

            if (isCurrentUser) {
                popupContent.innerHTML = `
                    <div class="font-semibold text-gray-900">You${user.name ? ` (${user.name})` : ''}</div>
                    <div class="text-gray-600 mt-1 text-xs">This is your location</div>
                `;
            } else {
                popupContent.innerHTML = `
                    <div class="font-semibold text-gray-900">${user.name}</div>
                    ${user.age ? `<div class="text-gray-600 text-xs mt-1">Age: ${user.age}</div>` : ''}
                    ${user.gender ? `<div class="text-gray-600 text-xs capitalize">Gender: ${user.gender}</div>` : ''}
                `;

                // Add chat button for other users
                const chatButton = document.createElement('button');
                chatButton.className =
                    'mt-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:scale-105 hover:shadow-md w-full justify-center';
                chatButton.innerHTML = `
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    Chat
                `;
                chatButton.onclick = (e) => {
                    e.stopPropagation();
                    handleStartChat(user.id);
                };
                popupContent.appendChild(chatButton);
            }

            const popup = new mapboxgl.Popup({
                offset: 25,
                closeButton: true,
                closeOnClick: false,
            }).setDOMContent(popupContent);

            // Create and add marker
            const marker = new mapboxgl.Marker(el)
                .setLngLat([user.lng, user.lat])
                .setPopup(popup)
                .addTo(map.current!);

            // Store marker reference
            nearbyMarkers.current.set(user.id, marker);

            // If this is the current user, store in userMarker ref and fly to location
            if (isCurrentUser) {
                userMarker.current = marker;
                map.current!.flyTo({
                    center: [user.lng, user.lat],
                    zoom: 14,
                    essential: true,
                    duration: 2000,
                });
            }
        });
    }, [onlineUsers, currentUserId, handleStartChat]);

    // Update nearby users markers when nearby state changes
    useEffect(() => {
        if (!map.current) return;

        // Get current user IDs in nearby list
        const currentUserIds = new Set(nearby.map((user) => user.id));

        // Remove markers that are no longer in the nearby list
        nearbyMarkers.current.forEach((marker, userId) => {
            if (!currentUserIds.has(userId)) {
                marker.remove();
                nearbyMarkers.current.delete(userId);
            }
        });

        // Add or update markers for nearby users
        nearby.forEach((user) => {
            // Skip if marker already exists for this user
            if (nearbyMarkers.current.has(user.id)) {
                return;
            }

            // Create red marker element
            const el = document.createElement('div');
            el.className = 'nearby-user-marker';
            el.style.backgroundColor = '#ef4444';
            el.style.width = '16px';
            el.style.height = '16px';
            el.style.borderRadius = '50%';
            el.style.border = '2px solid white';
            el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            el.style.cursor = 'pointer';

            // Create popup content with chat button
            const popupContent = document.createElement('div');
            popupContent.className = 'text-sm';
            popupContent.innerHTML = `
                <div class="font-semibold text-gray-900">${user.name}</div>
                <div class="text-gray-600 mt-1">
                    Distance: ${user.distance} km
                </div>
                ${user.age ? `<div class="text-gray-600">Age: ${user.age}</div>` : ''}
                ${user.gender ? `<div class="text-gray-600 capitalize">Gender: ${user.gender}</div>` : ''}
            `;

            // Add chat button
            const chatButton = document.createElement('button');
            chatButton.className =
                'mt-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:scale-105 hover:shadow-md w-full justify-center';
            chatButton.innerHTML = `
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                Chat
            `;
            chatButton.onclick = (e) => {
                e.stopPropagation();
                handleStartChat(user.id);
            };
            popupContent.appendChild(chatButton);

            const popup = new mapboxgl.Popup({
                offset: 25,
                closeButton: true,
                closeOnClick: false,
            }).setDOMContent(popupContent);

            // Create and add marker
            const marker = new mapboxgl.Marker(el)
                .setLngLat([user.lng, user.lat])
                .setPopup(popup)
                .addTo(map.current!);

            // Store marker reference
            nearbyMarkers.current.set(user.id, marker);
        });
    }, [nearby, handleStartChat]);

    // Refetch nearby users when radius changes
    useEffect(() => {
        if (!loading && lat && lng) {
            void fetchNearbyUsers(lat, lng, radius);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [radius, lat, lng, loading]);

    // Listen for real-time location updates
    useEffect(() => {
        const echoInstance = echo();
        const channel = echoInstance.channel('map');

        channel.listen(
            '.LocationUpdated',
            (event: { userId: number; lat: number; lng: number }) => {
                console.log('Location update received:', event);

                // Update the marker position if it exists
                const marker = nearbyMarkers.current.get(event.userId);
                if (marker) {
                    marker.setLngLat([event.lng, event.lat]);
                }

                // Update the user in nearby list
                setNearby((prevNearby) =>
                    prevNearby.map((user) =>
                        user.id === event.userId
                            ? { ...user, lat: event.lat, lng: event.lng }
                            : user,
                    ),
                );
            },
        );

        return () => {
            channel.stopListening('.LocationUpdated');
            echoInstance.leaveChannel('map');
        };
    }, []);

    return (
        <AppLayout>
            <PageTransition className="relative flex h-screen w-full flex-col md:flex-row">
                {/* Map Container */}
                <div ref={mapContainer} className="flex-1" />

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
                                        onClick={requestLocation}
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
                                    <p className="text-xs md:text-sm">
                                        {error}
                                    </p>
                                    {locationRequested && !locationGranted && (
                                        <button
                                            onClick={requestLocation}
                                            className="rounded bg-white px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 md:px-3 md:text-sm"
                                        >
                                            Try Again
                                        </button>
                                    )}
                                    {locationGranted && (
                                        <p className="text-xs opacity-90">
                                            You can still browse the map and
                                            search for users in other locations.
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setError(null)}
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

                {/* Radius Control - Top Left */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                        delay: 0.1,
                    }}
                    className="absolute top-16 left-2 z-10 w-[calc(100%-1rem)] max-w-[200px] rounded-lg bg-white p-2 shadow-lg md:top-4 md:left-4 md:max-w-xs md:p-4"
                >
                    <div className="space-y-1 md:space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-gray-700 md:text-sm">
                                Radius
                            </label>
                            <span className="text-xs font-medium text-blue-600 md:text-sm">
                                {radius} km
                            </span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={radius}
                            onChange={(e) => setRadius(Number(e.target.value))}
                            className="slider h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 md:h-2"
                            style={{
                                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(radius / 50) * 100}%, #e5e7eb ${(radius / 50) * 100}%, #e5e7eb 100%)`,
                            }}
                        />
                        <div className="flex justify-between text-[10px] text-gray-500 md:text-xs">
                            <span>1 km</span>
                            <span>50 km</span>
                        </div>
                    </div>
                </motion.div>

                {/* Info Panel - Bottom Left (hidden on mobile) */}
                <div className="absolute bottom-4 left-4 z-10 hidden space-y-0.5 rounded-lg bg-gray-900/90 px-3 py-1.5 text-xs text-white shadow-lg md:block">
                    <div>Lat: {lat.toFixed(4)}</div>
                    <div>Lng: {lng.toFixed(4)}</div>
                    <div>Zoom: {zoom.toFixed(2)}</div>
                </div>

                {/* Toggle Sidebar Button - Mobile Only */}
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    onClick={() => setShowSidebar(!showSidebar)}
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

                {/* User List Sidebar - Right */}
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
                                    {locationGranted
                                        ? 'Nearby Users'
                                        : 'All Users'}
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
                                onClick={() => setShowSidebar(false)}
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
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <UserList
                            users={locationGranted ? nearby : allUsers}
                            isLoading={fetchingNearby}
                            onUserClick={handleUserClick}
                            isAuthenticated={isAuthenticated}
                        />
                    </div>
                </motion.div>

                {/* Overlay for mobile sidebar */}
                <AnimatePresence>
                    {showSidebar && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-20 bg-black/50 md:hidden"
                            onClick={() => setShowSidebar(false)}
                        />
                    )}
                </AnimatePresence>
            </PageTransition>
        </AppLayout>
    );
}
