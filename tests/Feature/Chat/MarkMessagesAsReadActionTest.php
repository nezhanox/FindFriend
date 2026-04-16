<?php

declare(strict_types=1);

use App\Actions\Chat\MarkMessagesAsReadAction;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;

describe('MarkMessagesAsReadAction', function (): void {
    it('marks unread messages as read in bulk', function (): void {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $conversation = Conversation::factory()->create([
            'user_id' => $sender->getKey(),
            'recipient_id' => $receiver->getKey(),
        ]);
        Message::factory()->count(3)->create([
            'conversation_id' => $conversation->getKey(),
            'sender_id' => $sender->getKey(),
            'read_at' => null,
        ]);

        $action = app(MarkMessagesAsReadAction::class);
        $count = $action->execute($conversation, $receiver);

        expect($count)->toBe(3)
            ->and(
                Message::query()
                    ->where('conversation_id', $conversation->getKey())
                    ->whereNull('read_at')
                    ->count()
            )->toBe(0);
    });

    it('does not mark own messages as read', function (): void {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $conversation = Conversation::factory()->create([
            'user_id' => $sender->getKey(),
            'recipient_id' => $receiver->getKey(),
        ]);
        Message::factory()->create([
            'conversation_id' => $conversation->getKey(),
            'sender_id' => $sender->getKey(),
            'read_at' => null,
        ]);

        $action = app(MarkMessagesAsReadAction::class);
        $count = $action->execute($conversation, $sender);

        expect($count)->toBe(0);
    });

    it('returns 0 when no unread messages', function (): void {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();
        $conversation = Conversation::factory()->create([
            'user_id' => $sender->getKey(),
            'recipient_id' => $receiver->getKey(),
        ]);

        $action = app(MarkMessagesAsReadAction::class);
        $count = $action->execute($conversation, $receiver);

        expect($count)->toBe(0);
    });
});
