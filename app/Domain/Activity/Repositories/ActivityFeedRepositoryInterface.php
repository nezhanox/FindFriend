<?php

declare(strict_types=1);

namespace App\Domain\Activity\Repositories;

use App\Domain\Activity\ReadModels\ActivityFeedItem;
use Illuminate\Support\Collection;

interface ActivityFeedRepositoryInterface
{
    /**
     * @return Collection<int, ActivityFeedItem>
     */
    public function getGlobalFeed(int $limit = 50): Collection;
}
