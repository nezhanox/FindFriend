<?php

declare(strict_types=1);

namespace App\Actions\Friendship;

use App\Enums\FriendshipStatus;
use App\Models\Friendship;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class RejectFriendRequestAction
{
    /**
     * Reject a pending friend request (soft delete).
     *
     * Returns JsonResponse with 404 if not found or success.
     */
    public function execute(User $user, int $requestId): JsonResponse
    {
        $friendship = Friendship::query()
            ->where('id', $requestId)
            ->where('friend_id', $user->getKey())
            ->where('status', FriendshipStatus::Pending)
            ->first();

        if (! $friendship) {
            return response()->json(['message' => 'Запрошення не знайдено'], 404);
        }

        $friendship->update(['status' => FriendshipStatus::Rejected]);
        $friendship->delete();

        return response()->json(['message' => 'Запрошення відхилено']);
    }
}
