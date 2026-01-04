<?php

declare(strict_types=1);

namespace App\Models;

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
 * @property-read UserLocation|null $location
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Conversation> $initiatedConversations
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Conversation> $receivedConversations
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Message> $messages
 *
 * @method static \Illuminate\Database\Eloquent\Builder|User newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|User newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder|User query()
 *
 * @mixin \Illuminate\Database\Eloquent\Builder
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
        ];
    }

    /**
     * Get the user's location.
     */
    public function location(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(UserLocation::class);
    }

    /**
     * Get the conversations where this user is the initiator.
     */
    public function initiatedConversations(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Conversation::class, 'user_id');
    }

    /**
     * Get the conversations where this user is the recipient.
     */
    public function receivedConversations(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Conversation::class, 'recipient_id');
    }

    /**
     * Get all conversations for this user (both initiated and received).
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
     */
    public function messages(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Message::class, 'sender_id');
    }
}
