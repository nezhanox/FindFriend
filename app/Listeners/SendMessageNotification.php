<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Contracts\NotificationServiceInterface;
use App\Events\MessageSent;

class SendMessageNotification
{
    /**
     * Create the event listener.
     */
    public function __construct(
        private readonly NotificationServiceInterface $notificationService,
    ) {}

    /**
     * Handle the event.
     */
    public function handle(MessageSent $event): void
    {
        $message = $event->message;

        $message->loadMissing(['conversation', 'sender']);
        $conversation = $message->conversation;

        $recipientId = $conversation->user_id === $message->sender_id
            ? $conversation->recipient_id
            : $conversation->user_id;

        $recipient = $conversation->user_id === $recipientId
            ? $conversation->user
            : $conversation->recipient;

        $this->notificationService->create($recipient, [
            'type' => 'new_message',
            'title' => 'Нове повідомлення',
            'message' => $message->sender->name.': '.$this->truncateMessage($message->content),
            'action_url' => route('chat.show', ['conversation' => $conversation->getKey()]),
            'data' => [
                'conversation_id' => $conversation->getKey(),
                'message_id' => $message->getKey(),
                'sender_id' => $message->sender_id,
            ],
        ]);
    }

    /**
     * Truncate message content for notification preview.
     */
    private function truncateMessage(string $content, int $length = 50): string
    {
        if (mb_strlen($content) <= $length) {
            return $content;
        }

        return mb_substr($content, 0, $length).'...';
    }
}
