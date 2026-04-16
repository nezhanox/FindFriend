<?php

declare(strict_types=1);

namespace App\Exceptions\Friendship;

use RuntimeException;

final class FriendshipNotFoundException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('Запрошення не знайдено');
    }
}
