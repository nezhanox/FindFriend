<?php

declare(strict_types=1);

use App\Actions\Friendship\SendFriendRequestAction;
use App\Enums\FriendshipStatus;
use App\Exceptions\Friendship\CannotAddSelfException;
use App\Exceptions\Friendship\FriendshipAlreadyExistsException;
use App\Models\Friendship;
use App\Models\User;

describe('SendFriendRequestAction', function (): void {
    it('creates a friendship record', function (): void {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();

        $action = app(SendFriendRequestAction::class);
        $friendship = $action->execute($sender, $receiver->getKey());

        expect($friendship)->toBeInstanceOf(Friendship::class)
            ->and($friendship->status)->toBe(FriendshipStatus::Pending)
            ->and($friendship->user_id)->toBe($sender->getKey())
            ->and($friendship->friend_id)->toBe($receiver->getKey());
    });

    it('throws CannotAddSelfException when sending to self', function (): void {
        $user = User::factory()->create();
        $action = app(SendFriendRequestAction::class);

        expect(fn () => $action->execute($user, $user->getKey()))
            ->toThrow(CannotAddSelfException::class);
    });

    it('throws FriendshipAlreadyExistsException when request already pending', function (): void {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        Friendship::factory()->create([
            'user_id' => $sender->getKey(),
            'friend_id' => $receiver->getKey(),
            'status' => FriendshipStatus::Pending,
        ]);

        $action = app(SendFriendRequestAction::class);

        expect(fn () => $action->execute($sender, $receiver->getKey()))
            ->toThrow(FriendshipAlreadyExistsException::class);
    });

    it('throws FriendshipAlreadyExistsException when already friends', function (): void {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        Friendship::factory()->create([
            'user_id' => $sender->getKey(),
            'friend_id' => $receiver->getKey(),
            'status' => FriendshipStatus::Accepted,
        ]);

        $action = app(SendFriendRequestAction::class);

        expect(fn () => $action->execute($sender, $receiver->getKey()))
            ->toThrow(FriendshipAlreadyExistsException::class);
    });

    it('restores rejected friendship and sets to pending', function (): void {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $existing = Friendship::factory()->create([
            'user_id' => $sender->getKey(),
            'friend_id' => $receiver->getKey(),
            'status' => FriendshipStatus::Rejected,
        ]);
        $existing->delete();

        $action = app(SendFriendRequestAction::class);
        $friendship = $action->execute($sender, $receiver->getKey());

        expect($friendship->getKey())->toBe($existing->getKey())
            ->and($friendship->status)->toBe(FriendshipStatus::Pending);
    });
});
