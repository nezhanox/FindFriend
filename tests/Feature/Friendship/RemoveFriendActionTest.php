<?php

declare(strict_types=1);

use App\Actions\Friendship\RemoveFriendAction;
use App\Enums\FriendshipStatus;
use App\Exceptions\Friendship\FriendshipNotFoundException;
use App\Models\Friendship;
use App\Models\User;

describe('RemoveFriendAction', function (): void {
    it('removes friendship where user is sender', function (): void {
        $user = User::factory()->create();
        $friend = User::factory()->create();
        Friendship::factory()->create([
            'user_id' => $user->getKey(),
            'friend_id' => $friend->getKey(),
            'status' => FriendshipStatus::Accepted,
        ]);

        $action = app(RemoveFriendAction::class);
        $action->execute($user, $friend->getKey());

        expect(Friendship::query()
            ->where('user_id', $user->getKey())
            ->where('friend_id', $friend->getKey())
            ->exists()
        )->toBeFalse();
    });

    it('removes friendship where user is receiver', function (): void {
        $user = User::factory()->create();
        $friend = User::factory()->create();
        Friendship::factory()->create([
            'user_id' => $friend->getKey(),
            'friend_id' => $user->getKey(),
            'status' => FriendshipStatus::Accepted,
        ]);

        $action = app(RemoveFriendAction::class);
        $action->execute($user, $friend->getKey());

        expect(Friendship::query()
            ->where('user_id', $friend->getKey())
            ->where('friend_id', $user->getKey())
            ->exists()
        )->toBeFalse();
    });

    it('throws FriendshipNotFoundException when friendship does not exist', function (): void {
        $user = User::factory()->create();
        $action = app(RemoveFriendAction::class);

        expect(fn () => $action->execute($user, 99999))
            ->toThrow(FriendshipNotFoundException::class);
    });
});
