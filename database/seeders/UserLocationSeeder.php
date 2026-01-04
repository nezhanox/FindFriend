<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserLocation;
use Illuminate\Database\Seeder;

class UserLocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Kyiv coordinates
        $centerLat = 50.4501;
        $centerLng = 30.5234;
        $radiusKm = 20;

        $genders = ['male', 'female', 'other'];
        $names = [
            'Олександр', 'Марія', 'Іван', 'Олена', 'Дмитро',
            'Анна', 'Андрій', 'Тетяна', 'Сергій', 'Наталія',
            'Максим', 'Юлія', 'Віктор', 'Ірина', 'Володимир',
            'Катерина', 'Михайло', 'Світлана', 'Олег', 'Людмила',
            'Петро', 'Оксана', 'Ігор', 'Валентина', 'Василь',
            'Галина', 'Євген', 'Вікторія', 'Богдан', 'Лариса',
            'Артем', 'Надія', 'Роман', 'Ганна', 'Павло',
            'Любов', 'Станіслав', 'Раїса', 'Ярослав', 'Тамара',
            'Денис', 'Ольга', 'Антон', 'Соломія', 'Валерій',
            'Інна', 'Костянтин', 'Лілія', 'Григорій', 'Зоя',
        ];

        for ($i = 0; $i < 50; $i++) {
            // Generate random coordinates within radius
            $angle = mt_rand(0, 360) * (M_PI / 180);
            $distance = sqrt(mt_rand(0, 10000) / 10000) * $radiusKm;

            // Convert distance to degrees (approximate)
            $deltaLat = ($distance / 111) * cos($angle);
            $deltaLng = ($distance / 111) * sin($angle);

            $lat = $centerLat + $deltaLat;
            $lng = $centerLng + $deltaLng;

            $user = User::query()->create([
                'name' => $names[$i],
                'email' => 'user'.($i + 1).'@example.com',
                'password' => bcrypt('password'),
                'avatar' => null,
                'age' => mt_rand(18, 60),
                'gender' => $genders[array_rand($genders)],
            ]);

            UserLocation::query()->create([
                'user_id' => $user->getKey(),
                'lat' => $lat,
                'lng' => $lng,
                'is_visible' => (bool) mt_rand(0, 1),
                'last_updated' => now()->subMinutes(mt_rand(0, 1440)),
            ]);
        }
    }
}
