<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Schema;

describe('ActivityFeed', function (): void {
    it('has activity_feed table with correct columns', function (): void {
        expect(Schema::hasTable('activity_feed'))->toBeTrue();
        expect(Schema::hasColumns('activity_feed', [
            'id', 'type', 'actor_id', 'actor_snapshot',
            'subject_id', 'subject_snapshot', 'occurred_at', 'created_at',
        ]))->toBeTrue();
    });

    describe('GET /feed', function (): void {
        it('requires authentication', function (): void {
            $this->get('/feed')->assertRedirect('/login');
        });

        it('returns feed page with items', function (): void {
            $user = \App\Models\User::factory()->create();

            // Fire a domain event so there's something in the feed
            $entry = \App\Models\ActivityFeedEntry::factory()->create([
                'type' => \App\Enums\ActivityType::UserJoined,
                'actor_id' => $user->getKey(),
                'actor_snapshot' => ['id' => $user->getKey(), 'name' => $user->name, 'avatar_url' => null],
                'subject_id' => null,
                'subject_snapshot' => null,
                'occurred_at' => now(),
            ]);

            $this->actingAs($user)
                ->get('/feed')
                ->assertSuccessful()
                ->assertInertia(fn ($page) => $page
                    ->component('Feed/Index')
                    ->has('items', 1)
                );
        });

        it('returns empty feed when no activity', function (): void {
            $user = \App\Models\User::factory()->create();

            $this->actingAs($user)
                ->get('/feed')
                ->assertSuccessful()
                ->assertInertia(fn ($page) => $page
                    ->component('Feed/Index')
                    ->has('items', 0)
                );
        });
    });
});
