<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * App\Models\Conversation
 *
 * @property int $id
 * @property int $user_id
 * @property int $recipient_id
 * @property \Illuminate\Support\Carbon|null $last_message_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read User $user
 * @property-read User $recipient
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Message> $messages
 * @property-read int|null $messages_count
 * @property-read Message|null $lastMessage
 *
 * @method static \Illuminate\Database\Eloquent\Builder|Conversation newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Conversation newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|Conversation query()
 * @method static \Illuminate\Database\Eloquent\Builder|Conversation whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Conversation whereUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Conversation whereRecipientId($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Conversation whereLastMessageAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Conversation whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder|Conversation whereUpdatedAt($value)
 *
 * @mixin \Illuminate\Database\Eloquent\Builder<Conversation>
 */
class Conversation extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'recipient_id',
        'last_message_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
        ];
    }

    /**
     * Get the user who initiated the conversation.
     *
     * @return BelongsTo<User, covariant Conversation>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the recipient of the conversation.
     *
     * @return BelongsTo<User, covariant Conversation>
     */
    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    /**
     * Get all messages in the conversation.
     *
     * @return HasMany<Message, covariant Conversation>
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Get the last message in the conversation.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasOne<Message, covariant Conversation>
     */
    public function lastMessage(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    /**
     * Get the other participant in the conversation.
     */
    public function getOtherParticipant(int $currentUserId): User
    {
        return $this->user_id === $currentUserId ? $this->recipient : $this->user;
    }
}
