<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Seeder;

class ChatSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user60 = User::query()->find(60);

        if ($user60 === null) {
            $this->command->error('User with ID 60 not found!');

            return;
        }

        // Get random users (excluding user 60)
        $otherUsers = User::query()
            ->where('id', '!=', 60)
            ->inRandomOrder()
            ->limit(5)
            ->get();

        if ($otherUsers->isEmpty()) {
            $this->command->error('No other users found to create conversations with!');

            return;
        }

        $messages = [
            'Hey, how are you?',
            'I saw you on the map!',
            'Want to meet up?',
            'Thanks for connecting!',
            'Great to chat with you!',
            'What are you up to today?',
            'Nice profile picture!',
            'Let me know if you want to hang out',
            'Have you been to that new cafe?',
            'The weather is great today!',
        ];

        foreach ($otherUsers as $otherUser) {
            // Create conversation
            $conversation = Conversation::query()->create([
                'user_id' => $user60->getKey(),
                'recipient_id' => $otherUser->getKey(),
                'last_message_at' => now()->subMinutes(random_int(1, 1440)),
            ]);

            // Create 5-10 messages
            $messageCount = random_int(5, 10);
            $createdAt = now()->subDays(random_int(1, 7));

            for ($i = 0; $i < $messageCount; $i++) {
                $isFromUser60 = $i % 2 === 0; // Alternate between users
                $senderId = $isFromUser60 ? $user60->getKey() : $otherUser->getKey();

                Message::query()->create([
                    'conversation_id' => $conversation->getKey(),
                    'sender_id' => $senderId,
                    'content' => $messages[array_rand($messages)],
                    'read_at' => $i < $messageCount - 2 ? now()->subMinutes(random_int(1, 60)) : null,
                    'created_at' => $createdAt->addMinutes(random_int(1, 60)),
                ]);
            }

            // Update last_message_at
            $conversation->update([
                'last_message_at' => $conversation->messages()->latest()->first()?->created_at,
            ]);

            $this->command->info("Created conversation with {$otherUser->name} ({$messageCount} messages)");
        }

        $this->command->info('Chat seeding completed successfully!');
    }
}
