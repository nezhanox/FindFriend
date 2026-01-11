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

    private const TEMP_USER_PREFIX = 'temp_';

    /**
     * Update user location in Redis and database.
     * Creates anonymous location, returns temp user ID.
     */
    public function updateLocation(float $lat, float $lng, ?string $sessionId = null): int
    {
        $sessionId = $sessionId ?? (session()->isStarted() ? session()->getId() : str()->random(32));

        // Find or create temporary user
        $user = User::query()
            ->where('email', self::TEMP_USER_PREFIX.$sessionId.'@temp.local')
            ->first();

        if (! $user) {
            $user = User::query()->create([
                'name' => 'Anonymous User',
                'email' => self::TEMP_USER_PREFIX.$sessionId.'@temp.local',
                'password' => bcrypt(str()->random(32)),
                'age' => null,
                'gender' => null,
            ]);
        }

        // Update or create location in database
        UserLocation::query()->updateOrCreate(
            ['user_id' => $user->getKey()],
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
            (string) $user->getKey()
        );

        // Broadcast location update
        broadcast(new LocationUpdated(
            userId: (int) $user->getKey(),
            lat: $lat,
            lng: $lng
        ));

        return (int) $user->getKey();
    }

    /**
     * Find nearby users within given radius (in kilometers).
     *
     * @return array<int, array{id: int, name: string, age: int|null, gender: string|null, avatar: string|null, distance: float, lat: float, lng: float}>
     */
    public function findNearby(float $lat, float $lng, int $radius = 5): array
    {
        $cacheKey = sprintf('nearby:%f:%f:%d', $lat, $lng, $radius);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($lat, $lng, $radius): array {
            // Get nearby user IDs from Redis using GEORADIUS
            /** @var array<int, array{0: string, 1: string, 2: array{0: string, 1: string}}> $nearbyUserIds */
            $nearbyUserIds = Redis::georadius(
                self::REDIS_GEO_KEY,
                $lng,
                $lat,
                $radius,
                'km',
                ['WITHDIST', 'WITHCOORD']
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
