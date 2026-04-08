<?php

declare(strict_types=1);

namespace App\Domain\Activity\Projections;

use App\Domain\Activity\Events\ActivityMessageSent;
use App\Domain\Activity\Events\FriendRequestSent;
use App\Domain\Activity\Events\FriendshipAccepted;
use App\Domain\Activity\Events\UserJoined;
use App\Domain\Activity\ValueObjects\ActorSnapshot;
use App\Enums\ActivityType;
use App\Models\ActivityFeedEntry;
use Illuminate\Support\Str;

final class ActivityFeedProjection
{
    public function onFriendshipAccepted(FriendshipAccepted $event): void
    {
        $this->write(
            type: ActivityType::FriendshipAccepted,
            actor: ActorSnapshot::fromUser($event->acceptor),
            subject: ActorSnapshot::fromUser($event->requester),
            actorId: $event->acceptor->getKey(),
            subjectId: $event->requester->getKey(),
        );
    }

    public function onFriendRequestSent(FriendRequestSent $event): void
    {
        $this->write(
            type: ActivityType::FriendRequestSent,
            actor: ActorSnapshot::fromUser($event->sender),
            subject: ActorSnapshot::fromUser($event->receiver),
            actorId: $event->sender->getKey(),
            subjectId: $event->receiver->getKey(),
        );
    }

    public function onActivityMessageSent(ActivityMessageSent $event): void
    {
        $this->write(
            type: ActivityType::MessageSent,
            actor: ActorSnapshot::fromUser($event->sender),
            subject: ActorSnapshot::fromUser($event->receiver),
            actorId: $event->sender->getKey(),
            subjectId: $event->receiver->getKey(),
        );
    }

    public function onUserJoined(UserJoined $event): void
    {
        $this->write(
            type: ActivityType::UserJoined,
            actor: ActorSnapshot::fromUser($event->user),
            subject: null,
            actorId: $event->user->getKey(),
            subjectId: null,
        );
    }

    private function write(
        ActivityType $type,
        ActorSnapshot $actor,
        ?ActorSnapshot $subject,
        int $actorId,
        ?int $subjectId,
    ): void {
        ActivityFeedEntry::query()->create([
            'id' => (string) Str::ulid(),
            'type' => $type,
            'actor_id' => $actorId,
            'actor_snapshot' => $actor->toArray(),
            'subject_id' => $subjectId,
            'subject_snapshot' => $subject?->toArray(),
            'occurred_at' => now(),
            'created_at' => now(),
        ]);
    }
}
