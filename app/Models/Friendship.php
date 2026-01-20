<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\FriendshipStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * App\Models\Friendship
 *
 * @property int $id
 * @property int $user_id
 * @property int $friend_id
 * @property FriendshipStatus $status
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 * @property User $user
 * @property User $friend
 *
 * @method static \Illuminate\Database\Eloquent\Builder|Friendship newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Friendship newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Friendship query()
 * @method static \Illuminate\Database\Eloquent\Builder|Friendship onlyTrashed()
 * @method static \Illuminate\Database\Eloquent\Builder|Friendship withTrashed()
 * @method static \Illuminate\Database\Eloquent\Builder|Friendship withoutTrashed()
 * @method static \Illuminate\Database\Eloquent\Builder|Friendship whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Friendship whereUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Friendship whereFriendId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Friendship whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Friendship whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Friendship whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Friendship whereDeletedAt($value)
 *
 * @mixin \Illuminate\Database\Eloquent\Model
 */
class Friendship extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'friend_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => FriendshipStatus::class,
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Get the user who initiated the friendship.
     *
     * @return BelongsTo<User, covariant Friendship>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Get the friend user.
     *
     * @return BelongsTo<User, covariant Friendship>
     */
    public function friend(): BelongsTo
    {
        return $this->belongsTo(User::class, 'friend_id');
    }
}
