<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Domain\Activity\Repositories\ActivityFeedRepositoryInterface;
use Inertia\Inertia;
use Inertia\Response;

class ActivityFeedController extends Controller
{
    public function __construct(
        private readonly ActivityFeedRepositoryInterface $repository,
    ) {}

    public function index(): Response
    {
        $items = $this->repository->getGlobalFeed(50);

        return Inertia::render('Feed/Index', [
            'items' => $items->map(fn ($item) => [
                'id' => $item->id,
                'type' => $item->type->value,
                'label' => $item->type->label(),
                'actor' => [
                    'id' => $item->actor->id,
                    'name' => $item->actor->name,
                    'avatar_url' => $item->actor->avatarUrl,
                ],
                'subject' => $item->subject ? [
                    'id' => $item->subject->id,
                    'name' => $item->subject->name,
                    'avatar_url' => $item->subject->avatarUrl,
                ] : null,
                'occurred_at' => $item->occurredAt->toISOString(),
            ])->values()->all(),
        ]);
    }
}
