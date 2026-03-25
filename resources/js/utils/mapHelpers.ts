export function getMinutesSinceLastSeen(
    lastSeenAt: string | null | undefined,
): number {
    if (!lastSeenAt) return Infinity;
    const lastSeen = new Date(lastSeenAt);
    const now = new Date();
    return Math.floor((now.getTime() - lastSeen.getTime()) / 1000 / 60);
}

export function createCircleGeoJSON(
    lng: number,
    lat: number,
    radiusInKm: number,
): GeoJSON.Feature<GeoJSON.Polygon> {
    const points = 64;
    const coords: [number, number][] = [];
    const distanceX = radiusInKm / (111.32 * Math.cos((lat * Math.PI) / 180));
    const distanceY = radiusInKm / 110.574;

    for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI);
        const x = distanceX * Math.cos(theta);
        const y = distanceY * Math.sin(theta);
        coords.push([lng + x, lat + y]);
    }
    coords.push(coords[0]);

    return {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'Polygon',
            coordinates: [coords],
        },
    };
}
