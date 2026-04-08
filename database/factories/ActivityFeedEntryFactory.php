<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ActivityType;
use App\Models\ActivityFeedEntry;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<ActivityFeedEntry>
 */
class ActivityFeedEntryFactory extends Factory
{
    protected $model = ActivityFeedEntry::class;

    public function definition(): array
    {
        $actor = User::factory()->create();

        return [
            'id' => (string) Str::ulid(),
            'type' => ActivityType::UserJoined,
            'actor_id' => $actor->getKey(),
            'actor_snapshot' => ['id' => $actor->getKey(), 'name' => $actor->name, 'avatar_url' => $actor->avatar],
            'subject_id' => null,
            'subject_snapshot' => null,
            'occurred_at' => now(),
            'created_at' => now(),
        ];
    }
}
