<?php

declare(strict_types=1);

use App\Domain\Activity\Events\ActivityMessageSent;
use App\Domain\Activity\Events\FriendRequestSent;
use App\Domain\Activity\Events\FriendshipAccepted;
use App\Domain\Activity\Events\UserJoined;
use App\Domain\Activity\Projections\ActivityFeedProjection;
use App\Enums\ActivityType;
use App\Models\ActivityFeedEntry;
use App\Models\User;

describe('ActivityFeedProjection', function (): void {
    beforeEach(function (): void {
        $this->projection = new ActivityFeedProjection;
        $this->userA = User::factory()->create(['name' => 'Alice', 'avatar' => null]);
        $this->userB = User::factory()->create(['name' => 'Bob', 'avatar' => null]);
    });

    it('writes friendship_accepted entry when FriendshipAccepted fired', function (): void {
        $event = new FriendshipAccepted(acceptor: $this->userA, requester: $this->userB);

        $this->projection->onFriendshipAccepted($event);

        $entry = ActivityFeedEntry::query()->first();
        expect($entry)->not->toBeNull()
            ->and($entry->type)->toBe(ActivityType::FriendshipAccepted)
            ->and($entry->actor_id)->toBe($this->userA->getKey())
            ->and($entry->subject_id)->toBe($this->userB->getKey());
    });

    it('writes friend_request_sent entry when FriendRequestSent fired', function (): void {
        $event = new FriendRequestSent(sender: $this->userA, receiver: $this->userB);

        $this->projection->onFriendRequestSent($event);

        $entry = ActivityFeedEntry::query()->first();
        expect($entry)->not->toBeNull()
            ->and($entry->type)->toBe(ActivityType::FriendRequestSent)
            ->and($entry->actor_id)->toBe($this->userA->getKey())
            ->and($entry->subject_id)->toBe($this->userB->getKey());
    });

    it('writes message_sent entry when ActivityMessageSent fired', function (): void {
        $event = new ActivityMessageSent(sender: $this->userA, receiver: $this->userB);

        $this->projection->onActivityMessageSent($event);

        $entry = ActivityFeedEntry::query()->first();
        expect($entry)->not->toBeNull()
            ->and($entry->type)->toBe(ActivityType::MessageSent)
            ->and($entry->actor_id)->toBe($this->userA->getKey())
            ->and($entry->subject_id)->toBe($this->userB->getKey());
    });

    it('writes user_joined entry when UserJoined fired', function (): void {
        $event = new UserJoined(user: $this->userA);

        $this->projection->onUserJoined($event);

        $entry = ActivityFeedEntry::query()->first();
        expect($entry)->not->toBeNull()
            ->and($entry->type)->toBe(ActivityType::UserJoined)
            ->and($entry->actor_id)->toBe($this->userA->getKey())
            ->and($entry->subject_id)->toBeNull();
    });

    it('stores actor snapshot with name and avatar', function (): void {
        $userWithAvatar = User::factory()->create(['name' => 'Carol', 'avatar' => 'avatars/carol.jpg']);
        $event = new UserJoined(user: $userWithAvatar);

        $this->projection->onUserJoined($event);

        $entry = ActivityFeedEntry::query()->first();
        expect($entry->actor_snapshot['name'])->toBe('Carol')
            ->and($entry->actor_snapshot['avatar_url'])->toBe('avatars/carol.jpg');
    });
});
