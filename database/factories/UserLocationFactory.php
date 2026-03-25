<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\User;
use App\Models\UserLocation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UserLocation>
 */
class UserLocationFactory extends Factory
{
    protected $model = UserLocation::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'lat' => $this->faker->latitude(44.0, 52.0),
            'lng' => $this->faker->longitude(22.0, 40.0),
            'address' => $this->faker->address(),
            'is_visible' => true,
            'last_updated' => now(),
        ];
    }

    public function hidden(): static
    {
        return $this->state(['is_visible' => false]);
    }
}
