<?php

declare(strict_types=1);

namespace App\Exceptions\Friendship;

use RuntimeException;

final class FriendshipAlreadyExistsException extends RuntimeException
{
    public function __construct(string $message = 'Запрошення вже існує')
    {
        parent::__construct($message);
    }
}
