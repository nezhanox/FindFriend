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
        // Find all unread messages in the conversation that were NOT sent by this user
        $unreadMessages = $conversation->messages()
            ->whereNull('read_at')
            ->where('sender_id', '!=', $user->getKey())
            ->get();

        if ($unreadMessages->isEmpty()) {
            return 0;
        }

        // Mark them all as read
        $count = $unreadMessages->count();
        $now = now();

        foreach ($unreadMessages as $message) {
            $message->update(['read_at' => $now]);
        }

        // Broadcast that messages were read
        broadcast(new MessageRead($conversation->getKey(), $user->getKey()))->toOthers();

        return $count;
    }
}
