<?php

declare(strict_types=1);

namespace App\Models;

use App\Domain\Activity\ValueObjects\ActorSnapshot;
use App\Enums\ActivityType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * App\Models\ActivityFeedEntry
 *
 * @property string $id
 * @property ActivityType $type
 * @property int $actor_id
 * @property array{id: int, name: string, avatar_url: string|null} $actor_snapshot
 * @property int|null $subject_id
 * @property array{id: int, name: string, avatar_url: string|null}|null $subject_snapshot
 * @property Carbon $occurred_at
 * @property Carbon $created_at
 *
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityFeedEntry newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityFeedEntry newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|ActivityFeedEntry query()
 *
 * @mixin \Illuminate\Database\Eloquent\Builder<ActivityFeedEntry>
 */
class ActivityFeedEntry extends Model
{
    public $timestamps = false;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $table = 'activity_feed';

    /** @var list<string> */
    protected $fillable = [
        'id',
        'type',
        'actor_id',
        'actor_snapshot',
        'subject_id',
        'subject_snapshot',
        'occurred_at',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'type' => ActivityType::class,
            'actor_snapshot' => 'array',
            'subject_snapshot' => 'array',
            'occurred_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function actorSnapshot(): ActorSnapshot
    {
        return ActorSnapshot::fromArray($this->actor_snapshot);
    }

    public function subjectSnapshot(): ?ActorSnapshot
    {
        if ($this->subject_snapshot === null) {
            return null;
        }

        return ActorSnapshot::fromArray($this->subject_snapshot);
    }
}
