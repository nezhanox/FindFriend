<?php

declare(strict_types=1);

use App\Models\Conversation;
use App\Models\User;

describe('ConversationPolicy', function (): void {
    it('allows conversation participant to view conversation', function (): void {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $conversation = Conversation::factory()->create([
            'user_id' => $user->getKey(),
            'recipient_id' => $other->getKey(),
        ]);

        expect($user->can('view', $conversation))->toBeTrue()
            ->and($other->can('view', $conversation))->toBeTrue();
    });

    it('denies non-participant from viewing conversation', function (): void {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $stranger = User::factory()->create();
        $conversation = Conversation::factory()->create([
            'user_id' => $user->getKey(),
            'recipient_id' => $other->getKey(),
        ]);

        expect($stranger->can('view', $conversation))->toBeFalse();
    });
});
