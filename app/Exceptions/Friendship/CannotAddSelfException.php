<?php

declare(strict_types=1);

namespace App\Exceptions\Friendship;

use RuntimeException;

final class CannotAddSelfException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('Ви не можете додати себе в друзі');
    }
}
