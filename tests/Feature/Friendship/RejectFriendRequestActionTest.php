<?php

declare(strict_types=1);

use App\Actions\Friendship\RejectFriendRequestAction;
use App\Enums\FriendshipStatus;
use App\Exceptions\Friendship\FriendshipNotFoundException;
use App\Models\Friendship;
use App\Models\User;

describe('RejectFriendRequestAction', function (): void {
    it('rejects and soft-deletes a pending friend request', function (): void {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $friendship = Friendship::factory()->create([
            'user_id' => $sender->getKey(),
            'friend_id' => $receiver->getKey(),
            'status' => FriendshipStatus::Pending,
        ]);

        $action = app(RejectFriendRequestAction::class);
        $action->execute($receiver, $friendship->getKey());

        expect(Friendship::find($friendship->getKey()))->toBeNull()
            ->and(Friendship::withTrashed()->find($friendship->getKey())->status)
            ->toBe(FriendshipStatus::Rejected);
    });

    it('throws FriendshipNotFoundException when request not found', function (): void {
        $user = User::factory()->create();
        $action = app(RejectFriendRequestAction::class);

        expect(fn () => $action->execute($user, 99999))
            ->toThrow(FriendshipNotFoundException::class);
    });
});
