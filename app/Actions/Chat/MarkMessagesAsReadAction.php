<?php

declare(strict_types=1);

namespace App\Actions\Chat;

use App\Events\MessageRead;
use App\Models\Conversation;
use App\Models\User;

class MarkMessagesAsReadAction
{
    /**
     * Mark all unread messages in a conversation as read for a specific user.
     */
    public function execute(Conversation $conversation, User $user): int
    {
        $query = $conversation->messages()
            ->whereNull('read_at')
            ->where('sender_id', '!=', $user->getKey());

        $count = $query->count();

        if ($count === 0) {
            return 0;
        }

        $query->update(['read_at' => now()]);

        broadcast(new MessageRead($conversation->getKey(), $user->getKey()))->toOthers();

        return $count;
    }
}
