<?php

declare(strict_types=1);

namespace App\Services\Page;

use App\Models\UserLocation;
use Illuminate\Database\Eloquent\Collection;

class HomeService
{
    /** @return Collection<int, UserLocation> */
    public function getVisibleUsers(): Collection
    {
        return UserLocation::query()
            ->where('is_visible', true)
            ->whereHas('user')
            ->with('user:id,name,avatar,age,gender,last_seen_at')
            ->get();
    }

    /** @return array{lat: mixed, lng: mixed}|null */
    public function getSavedLocation(?int $currentUserId): ?array
    {
        $userLocation = UserLocation::query()
            ->where('user_id', $currentUserId)
            ->first();

        if ($userLocation) {
            return [
                'lat' => $userLocation->lat,
                'lng' => $userLocation->lng,
            ];
        }

        return null;
    }
}
