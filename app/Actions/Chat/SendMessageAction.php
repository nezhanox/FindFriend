<?php

declare(strict_types=1);

namespace App\Actions\Chat;

use App\Domain\Activity\Events\ActivityMessageSent;
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
        $message = Message::query()->create([
            'conversation_id' => $conversation->getKey(),
            'sender_id' => $sender->getKey(),
            'content' => $content,
        ]);

        $conversation->update([
            'last_message_at' => now(),
        ]);

        broadcast(new MessageSent($message))->toOthers();

        event(ActivityMessageSent::fromConversation($conversation, $sender));

        return $message;
    }
}
