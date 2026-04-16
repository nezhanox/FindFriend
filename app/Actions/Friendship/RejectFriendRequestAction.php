<?php

declare(strict_types=1);

namespace App\Actions\Friendship;

use App\Enums\FriendshipStatus;
use App\Exceptions\Friendship\FriendshipNotFoundException;
use App\Models\Friendship;
use App\Models\User;

class RejectFriendRequestAction
{
    /**
     * Reject a pending friend request (soft delete).
     *
     * @throws FriendshipNotFoundException
     */
    public function execute(User $user, int $requestId): void
    {
        $friendship = Friendship::query()
            ->where('id', $requestId)
            ->where('friend_id', $user->getKey())
            ->where('status', FriendshipStatus::Pending)
            ->first();

        if ($friendship === null) {
            throw new FriendshipNotFoundException;
        }

        $friendship->update(['status' => FriendshipStatus::Rejected]);
        $friendship->delete();
    }
}
