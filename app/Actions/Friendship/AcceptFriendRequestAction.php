<?php

declare(strict_types=1);

namespace App\Actions\Friendship;

use App\Domain\Activity\Events\FriendshipAccepted;
use App\Enums\FriendshipStatus;
use App\Models\Friendship;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AcceptFriendRequestAction
{
    /**
     * Accept a pending friend request.
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

        $friendship->update(['status' => FriendshipStatus::Accepted]);

        event(FriendshipAccepted::fromFriendship($friendship));

        return response()->json(['message' => 'Запрошення прийнято']);
    }
}
