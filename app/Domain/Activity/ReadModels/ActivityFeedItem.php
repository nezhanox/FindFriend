<?php

declare(strict_types=1);

namespace App\Domain\Activity\ReadModels;

use App\Domain\Activity\ValueObjects\ActorSnapshot;
use App\Enums\ActivityType;
use Illuminate\Support\Carbon;

final readonly class ActivityFeedItem
{
    public function __construct(
        public string $id,
        public ActivityType $type,
        public ActorSnapshot $actor,
        public ?ActorSnapshot $subject,
        public Carbon $occurredAt,
    ) {}
}
