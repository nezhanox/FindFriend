<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\FriendshipStatus;
use App\Models\Friendship;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Friendship>
 */
class FriendshipFactory extends Factory
{
    protected $model = Friendship::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'friend_id' => User::factory(),
            'status' => FriendshipStatus::Pending,
        ];
    }

    public function accepted(): static
    {
        return $this->state(['status' => FriendshipStatus::Accepted]);
    }

    public function rejected(): static
    {
        return $this->state(['status' => FriendshipStatus::Rejected]);
    }
}
