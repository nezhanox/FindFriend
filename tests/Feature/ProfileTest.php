<?php

declare(strict_types=1);

use App\Models\User;
use App\Models\UserLocation;

describe('Profile', function (): void {
    beforeEach(function (): void {
        $this->user = User::factory()->create();
        $this->other = User::factory()->create();
    });

    describe('GET /users/{user}', function (): void {
        it('shows public profile page', function (): void {
            $this->actingAs($this->user)
                ->get("/users/{$this->other->getKey()}")
                ->assertSuccessful()
                ->assertInertia(fn ($page) => $page
                    ->component('Profile/Show')
                    ->where('profileUser.id', $this->other->getKey())
                    ->where('isOwn', false)
                );
        });

        it('shows own profile with isOwn flag', function (): void {
            $this->actingAs($this->user)
                ->get("/users/{$this->user->getKey()}")
                ->assertSuccessful()
                ->assertInertia(fn ($page) => $page
                    ->where('isOwn', true)
                );
        });

        it('works for unauthenticated users', function (): void {
            $this->get("/users/{$this->other->getKey()}")
                ->assertSuccessful()
                ->assertInertia(fn ($page) => $page
                    ->component('Profile/Show')
                    ->where('isFriend', false)
                    ->where('isOwn', false)
                );
        });

        it('returns 404 for non-existent user', function (): void {
            $this->actingAs($this->user)
                ->get('/users/99999')
                ->assertNotFound();
        });
    });

    describe('PATCH /profile/visibility', function (): void {
        it('requires authentication', function (): void {
            $this->patchJson('/profile/visibility', ['is_visible' => false])
                ->assertUnauthorized();
        });

        it('updates visibility when location exists', function (): void {
            UserLocation::factory()->create([
                'user_id' => $this->user->getKey(),
                'is_visible' => true,
            ]);

            $this->actingAs($this->user)
                ->patchJson('/profile/visibility', ['is_visible' => false])
                ->assertSuccessful()
                ->assertJson(['is_visible' => false]);

            $this->assertDatabaseHas('user_locations', [
                'user_id' => $this->user->getKey(),
                'is_visible' => false,
            ]);
        });

        it('does nothing when no location set', function (): void {
            $this->actingAs($this->user)
                ->patchJson('/profile/visibility', ['is_visible' => false])
                ->assertSuccessful()
                ->assertJson(['is_visible' => false]);
        });

        it('validates is_visible is boolean', function (): void {
            $this->actingAs($this->user)
                ->patchJson('/profile/visibility', ['is_visible' => 'maybe'])
                ->assertUnprocessable()
                ->assertJsonValidationErrors(['is_visible']);
        });
    });
});
