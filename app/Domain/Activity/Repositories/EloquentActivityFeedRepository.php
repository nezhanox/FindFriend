<?php

declare(strict_types=1);

namespace App\Domain\Activity\Repositories;

use App\Domain\Activity\ReadModels\ActivityFeedItem;
use App\Models\ActivityFeedEntry;
use Illuminate\Support\Collection;

final class EloquentActivityFeedRepository implements ActivityFeedRepositoryInterface
{
    /**
     * @return Collection<int, ActivityFeedItem>
     */
    public function getGlobalFeed(int $limit = 50): Collection
    {
        return ActivityFeedEntry::query()
            ->orderByDesc('occurred_at')
            ->limit($limit)
            ->get()
            ->map(fn (ActivityFeedEntry $entry): ActivityFeedItem => new ActivityFeedItem(
                id: $entry->id,
                type: $entry->type,
                actor: $entry->actorSnapshot(),
                subject: $entry->subjectSnapshot(),
                occurredAt: $entry->occurred_at,
            ));
    }
}
