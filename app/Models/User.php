<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\FriendshipStatus;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * App\Models\User
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property \Illuminate\Support\Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $avatar
 * @property int|null $age
 * @property string|null $gender
 * @property string|null $remember_token
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $last_seen_at
 * @property-read UserLocation|null $location
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Conversation> $initiatedConversations
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Conversation> $receivedConversations
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Message> $messages
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Notification> $notifications
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Friendship> $friendships
 * @property-read \Illuminate\Database\Eloquent\Collection<int, User> $friends
 *
 * @method static \Illuminate\Database\Eloquent\Builder|User newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|User newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|User query()
 *
 * @mixin \Illuminate\Database\Eloquent\Builder<User>
 */
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'age',
        'gender',
        'last_seen_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_seen_at' => 'datetime',
        ];
    }

    /**
     * Get the user's location.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasOne<UserLocation, covariant User>
     */
    public function location(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(UserLocation::class);
    }

    /**
     * Get the conversations where this user is the initiator.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<Conversation, covariant User>
     */
    public function initiatedConversations(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Conversation::class, 'user_id');
    }

    /**
     * Get the conversations where this user is the recipient.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<Conversation, covariant User>
     */
    public function receivedConversations(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Conversation::class, 'recipient_id');
    }

    /**
     * Get all conversations for this user (both initiated and received).
     *
     * @return \Illuminate\Database\Eloquent\Collection<int, Conversation>
     */
    public function conversations(): \Illuminate\Database\Eloquent\Collection
    {
        return Conversation::query()
            ->where('user_id', $this->getKey())
            ->orWhere('recipient_id', $this->getKey())
            ->orderByDesc('last_message_at')
            ->get();
    }

    /**
     * Get all messages sent by this user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<Message, covariant User>
     */
    public function messages(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /**
     * Get all notifications for this user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<Notification, covariant User>
     */
    public function notifications(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Notification::class);
    }

    /**
     * Get all friendships where this user is the initiator.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<Friendship, covariant User>
     */
    public function friendships(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Friendship::class, 'user_id');
    }

    /**
     * Get all accepted friends (bidirectional relationship).
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<User, covariant User>
     */
    public function friends(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(User::class, 'friendships', 'user_id', 'friend_id')
            ->wherePivot('status', FriendshipStatus::Accepted)
            ->withTimestamps()
            ->union(
                $this->belongsToMany(User::class, 'friendships', 'friend_id', 'user_id')
                    ->wherePivot('status', FriendshipStatus::Accepted)
                    ->withTimestamps()
            );
    }

    /**
     * Check if this user is friends with another user (accepted status).
     */
    public function isFriendsWith(User $user): bool
    {
        return Friendship::query()
            ->where('status', FriendshipStatus::Accepted)
            ->where(function ($query) use ($user): void {
                $query->where('user_id', $this->getKey())
                    ->where('friend_id', $user->getKey());
            })
            ->orWhere(function ($query) use ($user): void {
                $query->where('user_id', $user->getKey())
                    ->where('friend_id', $this->getKey());
            })
            ->exists();
    }
}
