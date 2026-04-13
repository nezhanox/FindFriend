import axios from '@/bootstrap';
import LocationSearch from '@/components/LocationSearch';
import LocationPrompt from '@/components/Map/LocationPrompt';
import MapSidebar from '@/components/Map/MapSidebar';
import RadiusControl from '@/components/Map/RadiusControl';
import PageTransition from '@/components/PageTransition';
import AppLayout from '@/Layouts/AppLayout';
import { NearbyUsersResponse, UserMarker } from '@/types/location';
import {
    createCircleGeoJSON,
    getMinutesSinceLastSeen,
} from '@/utils/mapHelpers';
import { router, usePage } from '@inertiajs/react';
import { echo } from '@laravel/echo-react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

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
    savedLocation?: {
        lat: number;
        lng: number;
    } | null;
}

export default function Map() {
    const { auth, allUsers, currentUserId, savedLocation } =
        usePage<PageProps>().props;
    const isAuthenticated = !!auth?.user;
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const userMarker = useRef<mapboxgl.Marker | null>(null);
    const nearbyMarkers = useRef<Map<number, mapboxgl.Marker>>(
        new globalThis.Map(),
    );
    const lastUpdateTime = useRef<number>(0);

    // Use saved location or default to Kyiv
    const defaultLat = savedLocation?.lat ?? 50.4501;
    const defaultLng = savedLocation?.lng ?? 30.5234;

    const [lng, setLng] = useState<number>(defaultLng);
    const [lat, setLat] = useState<number>(defaultLat);
    const [zoom] = useState<number>(12);
    const [radius, setRadius] = useState<number>(5);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchingNearby, setFetchingNearby] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [nearby, setNearby] = useState<UserMarker[]>([]);
    const [locationRequested, setLocationRequested] = useState<boolean>(false);
    const [locationGranted, setLocationGranted] =
        useState<boolean>(!!savedLocation);
    const [showSidebar, setShowSidebar] = useState<boolean>(false);
    const [showOnlyFriends, setShowOnlyFriends] = useState<boolean>(false);

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
                        // Get address from reverse geocoding
                        let address = null;
                        try {
                            const geocodeResponse = await fetch(
                                `https://api.mapbox.com/geocoding/v5/mapbox.places/${userLng},${userLat}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`,
                            );
                            if (geocodeResponse.ok) {
                                const geocodeData =
                                    await geocodeResponse.json();
                                if (
                                    geocodeData.features &&
                                    geocodeData.features.length > 0
                                ) {
                                    address =
                                        geocodeData.features[0].place_name;
                                }
                            }
                        } catch (geocodeErr) {
                            console.error(
                                'Reverse geocoding error:',
                                geocodeErr,
                            );
                        }

                        await axios.post('/api/location/update', {
                            lat: userLat,
                            lng: userLng,
                            address: address,
                        });
                    } catch (err: unknown) {
                        console.error('Error updating location:', err);
                        if (
                            err &&
                            typeof err === 'object' &&
                            'response' in err &&
                            err.response &&
                            typeof err.response === 'object' &&
                            'status' in err.response &&
                            err.response.status === 401
                        ) {
                            setError('Please log in to share your location');
                            router.visit('/login');
                            return;
                        }
                        setError('Failed to update location on server');
                    }
                }

                // Fetch nearby users
                try {
                    const nearbyResponse = await axios.get<NearbyUsersResponse>(
                        `/api/location/nearby?lat=${userLat}&lng=${userLng}&radius=${radius}`,
                    );

                    setNearby(nearbyResponse.data.users);
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
                    axios
                        .get<NearbyUsersResponse>(
                            `/api/location/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
                        )
                        .then((response) => {
                            setNearby(response.data.users);
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
                const nearbyResponse = await axios.get<NearbyUsersResponse>(
                    `/api/location/nearby?lat=${userLat}&lng=${userLng}&radius=${searchRadius}`,
                );

                setNearby(nearbyResponse.data.users);
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
                await axios.post('/chat/messages', {
                    recipient_id: userId,
                    content: 'Hi! 👋',
                });

                router.visit('/chat');
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

    // Handle location selection from search
    const handleLocationSelect = useCallback(
        async (selectedLat: number, selectedLng: number, address: string) => {
            if (!isAuthenticated) {
                router.visit('/login');
                return;
            }

            setLat(selectedLat);
            setLng(selectedLng);
            setLocationGranted(true);

            // Update marker position
            if (userMarker.current) {
                userMarker.current.setLngLat([selectedLng, selectedLat]);
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
                    .setLngLat([selectedLng, selectedLat])
                    .addTo(map.current);
            }

            // Fly to selected location
            if (map.current) {
                map.current.flyTo({
                    center: [selectedLng, selectedLat],
                    zoom: 14,
                    essential: true,
                    duration: 2000,
                });
            }

            // Update location on server
            try {
                await axios.post('/api/location/update', {
                    lat: selectedLat,
                    lng: selectedLng,
                    address: address,
                });

                // Fetch nearby users
                const nearbyResponse = await axios.get<NearbyUsersResponse>(
                    `/api/location/nearby?lat=${selectedLat}&lng=${selectedLng}&radius=${radius}`,
                );

                setNearby(nearbyResponse.data.users);
            } catch (err: unknown) {
                console.error('Error updating location:', err);
                if (
                    err &&
                    typeof err === 'object' &&
                    'response' in err &&
                    err.response &&
                    typeof err.response === 'object' &&
                    'status' in err.response &&
                    err.response.status === 401
                ) {
                    setError('Please log in to share your location');
                    router.visit('/login');
                    return;
                }
                setError('Failed to update location on server');
            }
        },
        [isAuthenticated, radius],
    );

    // Handle current location button click
    const handleCurrentLocation = useCallback(() => {
        requestLocation();
    }, [requestLocation]);

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

        // Add radius circle source and layer when map loads
        map.current.on('load', () => {
            if (!map.current) return;

            // Add source for radius circle
            map.current.addSource('radius-circle', {
                type: 'geojson',
                data: createCircleGeoJSON(lng, lat, radius),
            });

            // Add fill layer for the circle
            map.current.addLayer({
                id: 'radius-circle-fill',
                type: 'fill',
                source: 'radius-circle',
                paint: {
                    'fill-color': '#3b82f6',
                    'fill-opacity': 0.1,
                },
            });

            // Add outline layer for the circle
            map.current.addLayer({
                id: 'radius-circle-outline',
                type: 'line',
                source: 'radius-circle',
                paint: {
                    'line-color': '#3b82f6',
                    'line-width': 2,
                    'line-opacity': 0.6,
                },
            });

            // If there's a saved location, add user marker and fetch nearby users
            if (savedLocation) {
                const el = document.createElement('div');
                el.className = 'user-marker';
                el.style.backgroundColor = '#3b82f6';
                el.style.width = '20px';
                el.style.height = '20px';
                el.style.borderRadius = '50%';
                el.style.border = '3px solid white';
                el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

                userMarker.current = new mapboxgl.Marker(el)
                    .setLngLat([savedLocation.lng, savedLocation.lat])
                    .addTo(map.current);

                // Fetch nearby users for saved location
                void fetchNearbyUsers(
                    savedLocation.lat,
                    savedLocation.lng,
                    radius,
                );
            }
        });

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
                const nameEl = document.createElement('div');
                nameEl.className = 'font-semibold text-gray-900';
                nameEl.textContent = user.name;
                popupContent.appendChild(nameEl);

                if (user.age) {
                    const ageEl = document.createElement('div');
                    ageEl.className = 'text-gray-600 text-xs mt-1';
                    ageEl.textContent = `Age: ${user.age}`;
                    popupContent.appendChild(ageEl);
                }

                if (user.gender) {
                    const genderEl = document.createElement('div');
                    genderEl.className = 'text-gray-600 text-xs capitalize';
                    genderEl.textContent = `Gender: ${user.gender}`;
                    popupContent.appendChild(genderEl);
                }

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
            const nameEl = document.createElement('div');
            nameEl.className = 'font-semibold text-gray-900';
            nameEl.textContent = user.name;
            popupContent.appendChild(nameEl);

            const distanceEl = document.createElement('div');
            distanceEl.className = 'text-gray-600 mt-1';
            distanceEl.textContent = `Distance: ${user.distance} km`;
            popupContent.appendChild(distanceEl);

            if (user.age) {
                const ageEl = document.createElement('div');
                ageEl.className = 'text-gray-600';
                ageEl.textContent = `Age: ${user.age}`;
                popupContent.appendChild(ageEl);
            }

            if (user.gender) {
                const genderEl = document.createElement('div');
                genderEl.className = 'text-gray-600 capitalize';
                genderEl.textContent = `Gender: ${user.gender}`;
                popupContent.appendChild(genderEl);
            }

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

    // Update radius circle when position or radius changes
    useEffect(() => {
        if (!map.current || !locationGranted) return;

        const source = map.current.getSource('radius-circle') as
            | mapboxgl.GeoJSONSource
            | undefined;

        if (source) {
            source.setData(createCircleGeoJSON(lng, lat, radius));
        }
    }, [lat, lng, radius, locationGranted]);

    // Listen for real-time location updates
    useEffect(() => {
        const echoInstance = echo();
        const channel = echoInstance.channel('map');

        channel.listen(
            '.LocationUpdated',
            (event: { userId: number; lat: number; lng: number }) => {
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

                {/* Location Search - Top Center */}
                {locationGranted && (
                    <div className="absolute top-4 left-1/2 z-20 w-[calc(100%-2rem)] -translate-x-1/2 md:w-auto md:min-w-[600px]">
                        <LocationSearch
                            lat={lat}
                            lng={lng}
                            onLocationSelect={handleLocationSelect}
                            onCurrentLocation={handleCurrentLocation}
                        />
                    </div>
                )}

                <LocationPrompt
                    isAuthenticated={isAuthenticated}
                    locationGranted={locationGranted}
                    loading={loading}
                    error={error}
                    locationRequested={locationRequested}
                    onRequestLocation={requestLocation}
                    onDismissError={() => setError(null)}
                />

                {/* Radius Control - Top Left */}
                <RadiusControl radius={radius} onChange={setRadius} />

                {/* Info Panel - Bottom Left (hidden on mobile) */}
                <div className="absolute bottom-4 left-4 z-10 hidden space-y-0.5 rounded-lg bg-gray-900/90 px-3 py-1.5 text-xs text-white shadow-lg md:block">
                    <div>Lat: {lat.toFixed(4)}</div>
                    <div>Lng: {lng.toFixed(4)}</div>
                    <div>Zoom: {zoom.toFixed(2)}</div>
                </div>

                <MapSidebar
                    allUsers={allUsers}
                    nearby={nearby}
                    locationGranted={locationGranted}
                    fetchingNearby={fetchingNearby}
                    isAuthenticated={isAuthenticated}
                    showSidebar={showSidebar}
                    showOnlyFriends={showOnlyFriends}
                    radius={radius}
                    currentUserId={currentUserId}
                    onUserClick={handleUserClick}
                    onToggleSidebar={() => setShowSidebar(!showSidebar)}
                    onToggleFriendsFilter={setShowOnlyFriends}
                />
            </PageTransition>
        </AppLayout>
    );
}
