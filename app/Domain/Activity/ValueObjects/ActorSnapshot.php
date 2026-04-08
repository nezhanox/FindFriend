<?php

declare(strict_types=1);

namespace App\Domain\Activity\ValueObjects;

use App\Models\User;

final readonly class ActorSnapshot
{
    public function __construct(
        public int $id,
        public string $name,
        public ?string $avatarUrl,
    ) {}

    public static function fromUser(User $user): self
    {
        return new self(
            id: $user->getKey(),
            name: $user->name,
            avatarUrl: $user->avatar,
        );
    }

    /**
     * @return array{id: int, name: string, avatar_url: string|null}
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'avatar_url' => $this->avatarUrl,
        ];
    }

    /**
     * @param  array{id: int, name: string, avatar_url: string|null}  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            name: $data['name'],
            avatarUrl: $data['avatar_url'],
        );
    }
}
