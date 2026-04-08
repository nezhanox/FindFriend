<?php

declare(strict_types=1);

namespace App\Domain\Activity\Events;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;

final class ActivityMessageSent
{
    use Dispatchable;

    public function __construct(
        public readonly User $sender,
        public readonly User $receiver,
    ) {}

    public static function fromConversation(Conversation $conversation, User $sender): self
    {
        /** @var User $receiver */
        $receiver = $conversation->user_id === $sender->getKey()
            ? User::query()->findOrFail($conversation->recipient_id)
            : User::query()->findOrFail($conversation->user_id);

        return new self(sender: $sender, receiver: $receiver);
    }
}
