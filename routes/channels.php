<?php

declare(strict_types=1);

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Public channel for real-time map location updates
Broadcast::channel('map', function () {
    return true;
});

// Private channel for conversation messages
Broadcast::channel('conversation.{conversationId}', function (User $user, int $conversationId): bool {
    $conversation = Conversation::query()->find($conversationId);

    if ($conversation === null) {
        return false;
    }

    return $conversation->user_id === $user->getKey()
        || $conversation->recipient_id === $user->getKey();
});
