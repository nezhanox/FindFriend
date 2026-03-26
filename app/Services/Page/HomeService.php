<?php

declare(strict_types=1);

namespace App\Services\Page;

use App\Models\UserLocation;

class HomeService
{
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
