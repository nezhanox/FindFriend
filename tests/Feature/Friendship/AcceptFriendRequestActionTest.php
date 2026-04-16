<?php

declare(strict_types=1);

use App\Actions\Friendship\AcceptFriendRequestAction;
use App\Enums\FriendshipStatus;
use App\Exceptions\Friendship\FriendshipNotFoundException;
use App\Models\Friendship;
use App\Models\User;

describe('AcceptFriendRequestAction', function (): void {
    it('accepts a pending friend request', function (): void {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $friendship = Friendship::factory()->create([
            'user_id' => $sender->getKey(),
            'friend_id' => $receiver->getKey(),
            'status' => FriendshipStatus::Pending,
        ]);

        $action = app(AcceptFriendRequestAction::class);
        $result = $action->execute($receiver, $friendship->getKey());

        expect($result)->toBeInstanceOf(Friendship::class)
            ->and($result->status)->toBe(FriendshipStatus::Accepted);
    });

    it('throws FriendshipNotFoundException when request not found', function (): void {
        $user = User::factory()->create();
        $action = app(AcceptFriendRequestAction::class);

        expect(fn () => $action->execute($user, 99999))
            ->toThrow(FriendshipNotFoundException::class);
    });
});
