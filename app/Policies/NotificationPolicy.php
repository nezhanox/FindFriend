<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Notification;
use App\Models\User;

class NotificationPolicy
{
    public function manage(User $user, Notification $notification): bool
    {
        return $notification->user_id === $user->getKey();
    }
}
