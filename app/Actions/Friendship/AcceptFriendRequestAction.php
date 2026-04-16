<?php

declare(strict_types=1);

namespace App\Actions\Friendship;

use App\Domain\Activity\Events\FriendshipAccepted;
use App\Enums\FriendshipStatus;
use App\Exceptions\Friendship\FriendshipNotFoundException;
use App\Models\Friendship;
use App\Models\User;

class AcceptFriendRequestAction
{
    /**
     * Accept a pending friend request.
     *
     * @throws FriendshipNotFoundException
     */
    public function execute(User $user, int $requestId): Friendship
    {
        $friendship = Friendship::query()
            ->where('id', $requestId)
            ->where('friend_id', $user->getKey())
            ->where('status', FriendshipStatus::Pending)
            ->first();

        if ($friendship === null) {
            throw new FriendshipNotFoundException;
        }

        $friendship->update(['status' => FriendshipStatus::Accepted]);
        $friendship->refresh();

        event(FriendshipAccepted::fromFriendship($friendship));

        return $friendship;
    }
}
