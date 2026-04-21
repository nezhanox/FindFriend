<?php

declare(strict_types=1);

namespace App\Actions\Friendship;

use App\Exceptions\Friendship\FriendshipNotFoundException;
use App\Models\Friendship;
use App\Models\User;

class RemoveFriendAction
{
    /**
     * Remove an accepted friendship or cancel an outgoing request.
     *
     * @throws FriendshipNotFoundException
     */
    public function execute(User $user, int $friendId): bool
    {
        $deleted = Friendship::query()
            ->where(function ($query) use ($user, $friendId): void {
                $query->where('user_id', $user->getKey())
                    ->where('friend_id', $friendId);
            })
            ->orWhere(function ($query) use ($user, $friendId): void {
                $query->where('user_id', $friendId)
                    ->where('friend_id', $user->getKey());
            })
            ->delete();

        if ($deleted === 0) {
            throw new FriendshipNotFoundException;
        }

        return true;
    }
}
