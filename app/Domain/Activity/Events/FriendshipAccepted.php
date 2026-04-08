<?php

declare(strict_types=1);

namespace App\Domain\Activity\Events;

use App\Models\Friendship;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;

final class FriendshipAccepted
{
    use Dispatchable;

    public function __construct(
        public readonly User $acceptor,
        public readonly User $requester,
    ) {}

    public static function fromFriendship(Friendship $friendship): self
    {
        /** @var User $acceptor */
        $acceptor = User::query()->findOrFail($friendship->friend_id);
        /** @var User $requester */
        $requester = User::query()->findOrFail($friendship->user_id);

        return new self(acceptor: $acceptor, requester: $requester);
    }
}
