<?php

declare(strict_types=1);

namespace App\Domain\Activity\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;

final class UserJoined
{
    use Dispatchable;

    public function __construct(
        public readonly User $user,
    ) {}
}
