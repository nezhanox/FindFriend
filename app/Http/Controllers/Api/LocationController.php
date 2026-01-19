<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function __construct(
        private readonly LocationService $locationService
    ) {}

    /**
     * Update user location.
     *
     * POST /api/location/update
     * Body: { "lat": 50.4501, "lng": 30.5234 }
     * Response: { "user_id": 123, "message": "Location updated successfully" }
     *
     * Requires authentication.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lat' => ['required', 'numeric', 'min:-90', 'max:90'],
            'lng' => ['required', 'numeric', 'min:-180', 'max:180'],
        ]);

        try {
            $userId = $this->locationService->updateLocation(
                lat: (float) $validated['lat'],
                lng: (float) $validated['lng']
            );

            return response()->json([
                'user_id' => $userId,
                'message' => 'Location updated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update location',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Find nearby users.
     *
     * GET /api/location/nearby?lat=50.4501&lng=30.5234&radius=5
     * Response: { "users": [...], "count": 10 }
     */
    public function nearby(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lat' => ['required', 'numeric', 'min:-90', 'max:90'],
            'lng' => ['required', 'numeric', 'min:-180', 'max:180'],
            'radius' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        try {
            $users = $this->locationService->findNearby(
                lat: (float) $validated['lat'],
                lng: (float) $validated['lng'],
                radius: (int) ($validated['radius'] ?? 5)
            );

            return response()->json([
                'users' => $users,
                'count' => count($users),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to find nearby users',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
