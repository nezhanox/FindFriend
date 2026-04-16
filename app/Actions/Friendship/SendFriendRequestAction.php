<?php

declare(strict_types=1);

namespace App\Actions\Friendship;

use App\Domain\Activity\Events\FriendRequestSent;
use App\Enums\FriendshipStatus;
use App\Exceptions\Friendship\CannotAddSelfException;
use App\Exceptions\Friendship\FriendshipAlreadyExistsException;
use App\Models\Friendship;
use App\Models\User;

class SendFriendRequestAction
{
    /**
     * Send or re-send a friend request.
     *
     * @throws CannotAddSelfException
     * @throws FriendshipAlreadyExistsException
     */
    public function execute(User $user, int $friendId): Friendship
    {
        if ($user->getKey() === $friendId) {
            throw new CannotAddSelfException;
        }

        $existing = Friendship::query()
            ->withTrashed()
            ->where(function ($query) use ($user, $friendId): void {
                $query->where('user_id', $user->getKey())
                    ->where('friend_id', $friendId);
            })
            ->orWhere(function ($query) use ($user, $friendId): void {
                $query->where('user_id', $friendId)
                    ->where('friend_id', $user->getKey());
            })
            ->first();

        if ($existing) {
            return match ($existing->status) {
                FriendshipStatus::Pending => throw new FriendshipAlreadyExistsException('Запрошення вже надіслано'),
                FriendshipStatus::Accepted => throw new FriendshipAlreadyExistsException('Цей користувач вже у вашому списку друзів'),
                FriendshipStatus::Rejected => $this->restoreRejected($existing, $user, $friendId),
            };
        }

        /** @var Friendship $friendship */
        $friendship = Friendship::query()->create([
            'user_id' => $user->getKey(),
            'friend_id' => $friendId,
            'status' => FriendshipStatus::Pending,
        ]);

        /** @var User $receiver */
        $receiver = User::query()->findOrFail($friendId);
        event(new FriendRequestSent(sender: $user, receiver: $receiver));

        return $friendship;
    }

    private function restoreRejected(Friendship $existing, User $user, int $friendId): Friendship
    {
        $existing->restore();
        $existing->update(['status' => FriendshipStatus::Pending]);

        /** @var User $receiver */
        $receiver = User::query()->findOrFail($friendId);
        event(new FriendRequestSent(sender: $user, receiver: $receiver));

        return $existing->fresh();
    }
}
