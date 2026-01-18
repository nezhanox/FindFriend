<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\LocationUpdated;
use App\Models\User;
use App\Models\UserLocation;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

class LocationService
{
    private const REDIS_GEO_KEY = 'user_locations';

    private const CACHE_TTL = 30; // seconds

    /**
     * Update user location in Redis and database.
     * Requires authenticated user.
     *
     * @throws \RuntimeException if user is not authenticated
     */
    public function updateLocation(float $lat, float $lng): int
    {
        $userId = auth()->id();

        if (! $userId) {
            throw new \RuntimeException('User must be authenticated to update location');
        }

        // Update or create location in database
        UserLocation::query()->updateOrCreate(
            ['user_id' => $userId],
            [
                'lat' => $lat,
                'lng' => $lng,
                'is_visible' => true,
                'last_updated' => now(),
            ]
        );

        // Add to Redis GEO
        Redis::geoadd(
            self::REDIS_GEO_KEY,
            $lng,
            $lat,
            (string) $userId
        );

        // Broadcast location update
        broadcast(new LocationUpdated(
            userId: (int) $userId,
            lat: $lat,
            lng: $lng
        ));

        return (int) $userId;
    }

    /**
     * Find nearby users within given radius (in kilometers).
     *
     * @return array<int, array{id: int, name: string, age: int|null, gender: string|null, avatar: string|null, distance: float, lat: float, lng: float, last_seen_at: string|null}>
     */
    public function findNearby(float $lat, float $lng, int $radius = 5): array
    {
        $cacheKey = sprintf('nearby:%f:%f:%d', $lat, $lng, $radius);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($lat, $lng, $radius): array {
            // Get nearby user IDs from Redis using GEORADIUS
            // Note: PHPRedis requires options as indexed array ['WITHDIST', 'WITHCOORD'], not associative
            /** @var array<int, array{0: string, 1: string, 2: array{0: string, 1: string}}> $nearbyUserIds */
            $nearbyUserIds = Redis::georadius(
                self::REDIS_GEO_KEY,
                $lng,
                $lat,
                $radius,
                'km',
                ['WITHDIST', 'WITHCOORD'] // @phpstan-ignore-line argument.type - PHPStan stub is incorrect
            );

            if (empty($nearbyUserIds)) {
                return [];
            }

            // Extract user IDs
            $userIds = collect($nearbyUserIds)->pluck(0)->map(fn ($id) => (int) $id)->toArray();

            // Fetch user details from database with locations
            $users = User::query()
                ->with('location')
                ->whereIn('id', $userIds)
                ->get()
                ->keyBy('id');

            // Build result array with distance information
            $results = [];
            foreach ($nearbyUserIds as $item) {
                // item = [userId, distance, [lng, lat]]
                $userId = (int) $item[0];
                $distance = (float) $item[1];
                $coords = $item[2];

                if (! isset($users[$userId])) {
                    continue;
                }

                $user = $users[$userId];
                $location = $user->location;

                $results[] = [
                    'id' => $userId,
                    'name' => $user->name,
                    'age' => $user->age,
                    'gender' => $user->gender,
                    'avatar' => $user->avatar,
                    'distance' => round($distance, 2),
                    'lat' => $location->lat ?? (float) $coords[1],
                    'lng' => $location->lng ?? (float) $coords[0],
                    'last_seen_at' => $user->last_seen_at?->toISOString(),
                ];
            }

            // Sort by distance
            usort($results, fn ($a, $b) => $a['distance'] <=> $b['distance']);

            return $results;
        });
    }

    /**
     * Sync all user locations from database to Redis.
     */
    public function syncLocationsToRedis(): int
    {
        $locations = UserLocation::query()
            ->where('is_visible', true)
            ->get();

        $synced = 0;
        foreach ($locations as $location) {
            if ($location->user_id && $location->lat && $location->lng) {
                Redis::geoadd(
                    self::REDIS_GEO_KEY,
                    $location->lng,
                    $location->lat,
                    (string) $location->user_id
                );
                $synced++;
            }
        }

        return $synced;
    }

    /**
     * Remove user location from Redis.
     */
    public function removeLocation(int $userId): bool
    {
        return (bool) Redis::zrem(self::REDIS_GEO_KEY, (string) $userId);
    }

    /**
     * Clear nearby search cache.
     */
    public function clearCache(): void
    {
        Cache::tags(['nearby'])->flush();
    }
}
