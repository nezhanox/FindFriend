<?php

declare(strict_types=1);

namespace App\Actions\Chat;

use App\Models\Conversation;
use App\Models\User;

class CreateConversationAction
{
    /**
     * Create or retrieve a conversation between two users.
     */
    public function execute(User $user, User $recipient): Conversation
    {
        // Try to find existing conversation in either direction
        $conversation = Conversation::query()
            ->where(function ($query) use ($user, $recipient): void {
                $query->where('user_id', $user->getKey())
                    ->where('recipient_id', $recipient->getKey());
            })
            ->orWhere(function ($query) use ($user, $recipient): void {
                $query->where('user_id', $recipient->getKey())
                    ->where('recipient_id', $user->getKey());
            })
            ->first();

        if ($conversation instanceof Conversation) {
            return $conversation;
        }

        // Create new conversation
        return Conversation::query()->create([
            'user_id' => $user->getKey(),
            'recipient_id' => $recipient->getKey(),
        ]);
    }
}
