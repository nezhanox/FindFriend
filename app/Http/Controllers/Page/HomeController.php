<?php

declare(strict_types=1);

namespace App\Http\Controllers\Page;

use App\Http\Controllers\Controller;
use App\Models\UserLocation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(Request $request): Response
    {
        $allUsers = UserLocation::query()
            ->where('is_visible', true)
            ->whereNotNull('user_id')
            ->with('user:id,name,avatar,age,gender,last_seen_at')
            ->get()
            ->map(fn ($location) => [
                'id' => $location->user?->getKey(),
                'name' => $location->user?->name,
                'avatar' => $location->user?->avatar,
                'age' => $location->user?->age,
                'gender' => $location->user?->gender,
                'lat' => $location->lat,
                'lng' => $location->lng,
                'last_seen_at' => $location->user?->last_seen_at?->toISOString(),
            ])
            ->filter(fn ($user) => $user['id'] !== null)
            ->values();

        $currentUserId = auth()->id();

        // Get saved location for authenticated user
        $savedLocation = null;
        if ($currentUserId) {
            $userLocation = UserLocation::query()
                ->where('user_id', $currentUserId)
                ->first();

            if ($userLocation) {
                $savedLocation = [
                    'lat' => $userLocation->lat,
                    'lng' => $userLocation->lng,
                ];
            }
        }

        return Inertia::render('Map', [
            'allUsers' => $allUsers,
            'currentUserId' => $currentUserId,
            'savedLocation' => $savedLocation,
        ]);
    }
}
