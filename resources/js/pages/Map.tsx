import { useCallback, useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LocationUpdate, UserMarker, NearbyUsersResponse } from '@/types/location';
import UserList from '@/Components/UserList';
import { echo } from '@laravel/echo-react';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function Map() {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const userMarker = useRef<mapboxgl.Marker | null>(null);
    const nearbyMarkers = useRef<Map<number, mapboxgl.Marker>>(new globalThis.Map());
    const lastUpdateTime = useRef<number>(0);
    const [lng, setLng] = useState<number>(30.5234);
    const [lat, setLat] = useState<number>(50.4501);
    const [zoom] = useState<number>(12);
    const [radius, setRadius] = useState<number>(5);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchingNearby, setFetchingNearby] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [nearby, setNearby] = useState<UserMarker[]>([]);

    // Fetch nearby users
    const fetchNearbyUsers = useCallback(async (userLat: number, userLng: number, searchRadius: number) => {
        setFetchingNearby(true);
        try {
            const nearbyResponse = await fetch(
                `/api/location/nearby?lat=${userLat}&lng=${userLng}&radius=${searchRadius}`
            );

            if (!nearbyResponse.ok) {
                throw new Error('Failed to fetch nearby users');
            }

            const nearbyData: NearbyUsersResponse = await nearbyResponse.json();
            setNearby(nearbyData.users);
            console.log('Nearby users:', nearbyData.users);
        } catch (err) {
            console.error('Error fetching nearby users:', err);
        } finally {
            setFetchingNearby(false);
        }
    }, []);

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

        // Get user's geolocation
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;

                    setLat(userLat);
                    setLng(userLng);

                    // Create blue marker for user's position
                    const el = document.createElement('div');
                    el.className = 'user-marker';
                    el.style.backgroundColor = '#3b82f6';
                    el.style.width = '20px';
                    el.style.height = '20px';
                    el.style.borderRadius = '50%';
                    el.style.border = '3px solid white';
                    el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

                    // Add marker to map
                    if (map.current) {
                        userMarker.current = new mapboxgl.Marker(el)
                            .setLngLat([userLng, userLat])
                            .addTo(map.current);

                        // Fly to user's position
                        map.current.flyTo({
                            center: [userLng, userLat],
                            zoom: 14,
                            essential: true,
                            duration: 2000,
                        });
                    }

                    // Send location to server with throttle
                    const now = Date.now();
                    if (now - lastUpdateTime.current >= 30000) {
                        lastUpdateTime.current = now;

                        try {
                            const response = await fetch('/api/location/update', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json',
                                },
                                body: JSON.stringify({
                                    lat: userLat,
                                    lng: userLng,
                                }),
                            });

                            if (!response.ok) {
                                throw new Error('Failed to update location');
                            }

                            const data: LocationUpdate = await response.json();
                            console.log('Location updated:', data);
                        } catch (err) {
                            console.error('Error updating location:', err);
                            setError('Failed to update location on server');
                        }
                    }

                    // Fetch nearby users inline
                    try {
                        const nearbyResponse = await fetch(
                            `/api/location/nearby?lat=${userLat}&lng=${userLng}&radius=5`
                        );

                        if (nearbyResponse.ok) {
                            const nearbyData: NearbyUsersResponse = await nearbyResponse.json();
                            setNearby(nearbyData.users);
                            console.log('Nearby users:', nearbyData.users);
                        }
                    } catch (err) {
                        console.error('Error fetching nearby users:', err);
                    }

                    setLoading(false);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    setError('Unable to get your location. Please enable location services.');
                    setLoading(false);
                }
            );
        } else {
            setError('Geolocation is not supported by your browser');
            setLoading(false);
        }

        // Cleanup
        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

            // Create popup content
            const popupContent = `
                <div class="text-sm">
                    <div class="font-semibold text-gray-900">${user.name}</div>
                    <div class="text-gray-600 mt-1">
                        Distance: ${user.distance} km
                    </div>
                    ${user.age ? `<div class="text-gray-600">Age: ${user.age}</div>` : ''}
                    ${user.gender ? `<div class="text-gray-600 capitalize">Gender: ${user.gender}</div>` : ''}
                </div>
            `;

            const popup = new mapboxgl.Popup({
                offset: 25,
                closeButton: true,
                closeOnClick: false,
            }).setHTML(popupContent);

            // Create and add marker
            const marker = new mapboxgl.Marker(el)
                .setLngLat([user.lng, user.lat])
                .setPopup(popup)
                .addTo(map.current!);

            // Store marker reference
            nearbyMarkers.current.set(user.id, marker);
        });
    }, [nearby]);

    // Refetch nearby users when radius changes
    useEffect(() => {
        if (!loading && lat && lng) {
            fetchNearbyUsers(lat, lng, radius);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [radius, lat, lng, loading]);

    // Listen for real-time location updates
    useEffect(() => {
        const echoInstance = echo();
        const channel = echoInstance.channel('map');

        channel.listen('.LocationUpdated', (event: { userId: number; lat: number; lng: number }) => {
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
                        : user
                )
            );
        });

        return () => {
            channel.stopListening('.LocationUpdated');
            echoInstance.leaveChannel('map');
        };
    }, []);

    return (
        <div className="relative w-full h-screen flex">
            {/* Map Container */}
            <div ref={mapContainer} className="flex-1" />

            {loading && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-lg shadow-lg">
                    <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Getting your location...</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-4 py-2 rounded-lg shadow-lg z-10">
                    {error}
                </div>
            )}

            {/* Radius Control - Top Left */}
            <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10 w-64">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-gray-700">Search Radius</label>
                        <span className="text-sm font-medium text-blue-600">{radius} km</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(radius / 50) * 100}%, #e5e7eb ${(radius / 50) * 100}%, #e5e7eb 100%)`,
                        }}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>1 km</span>
                        <span>50 km</span>
                    </div>
                </div>
            </div>

            {/* Info Panel - Bottom Left */}
            <div className="absolute bottom-4 left-4 bg-gray-900/90 text-white px-4 py-2 rounded-lg shadow-lg text-sm space-y-1 z-10">
                <div>Lat: {lat.toFixed(4)}</div>
                <div>Lng: {lng.toFixed(4)}</div>
                <div>Zoom: {zoom.toFixed(2)}</div>
            </div>

            {/* User List Sidebar - Right */}
            <div className="w-80 bg-white shadow-2xl overflow-y-auto max-h-screen flex flex-col">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-20">
                    <h2 className="text-lg font-semibold text-gray-900">Nearby Users</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {fetchingNearby ? (
                            <span className="inline-flex items-center gap-1">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                                Loading...
                            </span>
                        ) : (
                            `${nearby.length} ${nearby.length === 1 ? 'person' : 'people'} within ${radius} km`
                        )}
                    </p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <UserList users={nearby} isLoading={fetchingNearby} onUserClick={handleUserClick} />
                </div>
            </div>
        </div>
    );
}
