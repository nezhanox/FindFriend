<?php

declare(strict_types=1);

namespace App\Actions\Chat;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;

class SendMessageAction
{
    /**
     * Send a message in a conversation.
     */
    public function execute(Conversation $conversation, User $sender, string $content): Message
    {
        // Create the message
        $message = Message::query()->create([
            'conversation_id' => $conversation->getKey(),
            'sender_id' => $sender->getKey(),
            'content' => $content,
        ]);

        // Update conversation's last_message_at timestamp
        $conversation->update([
            'last_message_at' => now(),
        ]);

        // Broadcast the message
        broadcast(new MessageSent($message))->toOthers();

        return $message;
    }
}
