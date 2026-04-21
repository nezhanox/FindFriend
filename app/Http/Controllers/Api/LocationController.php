<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Location\NearbyUsersRequest;
use App\Http\Requests\Location\UpdateLocationRequest;
use App\Services\LocationService;
use Illuminate\Http\JsonResponse;

class LocationController extends Controller
{
    public function __construct(
        private readonly LocationService $locationService
    ) {}

    /**
     * Update user location.
     *
     * POST /api/location/update
     * Body: { "lat": 50.4501, "lng": 30.5234, "address": "вул. Хрещатик, 1, Київ" }
     * Response: { "user_id": 123, "message": "Location updated successfully" }
     *
     * Requires authentication.
     */
    public function update(UpdateLocationRequest $request): JsonResponse
    {
        $userId = $this->locationService->updateLocation(
            lat: (float) $request->validated('lat'),
            lng: (float) $request->validated('lng'),
            address: $request->validated('address'),
        );

        return response()->json([
            'user_id' => $userId,
            'message' => 'Location updated successfully',
        ]);
    }

    /**
     * Find nearby users.
     *
     * GET /api/location/nearby?lat=50.4501&lng=30.5234&radius=5
     * Response: { "users": [...], "count": 10 }
     */
    public function nearby(NearbyUsersRequest $request): JsonResponse
    {
        $users = $this->locationService->findNearby(
            lat: (float) $request->validated('lat'),
            lng: (float) $request->validated('lng'),
            radius: (int) ($request->validated('radius') ?? 5),
        );

        return response()->json([
            'users' => $users,
            'count' => count($users),
        ]);
    }
}
