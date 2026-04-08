<?php

declare(strict_types=1);

namespace App\Domain\Activity\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;

final class FriendRequestSent
{
    use Dispatchable;

    public function __construct(
        public readonly User $sender,
        public readonly User $receiver,
    ) {}
}
