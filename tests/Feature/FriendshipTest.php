<?php

declare(strict_types=1);

use App\Enums\FriendshipStatus;
use App\Models\Friendship;
use App\Models\User;

describe('Friendship', function (): void {
    beforeEach(function (): void {
        $this->user = User::factory()->create();
        $this->other = User::factory()->create();
    });

    describe('GET /friends', function (): void {
        it('requires authentication', function (): void {
            $this->getJson('/friends')->assertUnauthorized();
        });

        it('returns accepted friends list', function (): void {
            Friendship::factory()->create([
                'user_id' => $this->user->getKey(),
                'friend_id' => $this->other->getKey(),
                'status' => FriendshipStatus::Accepted,
            ]);

            $this->actingAs($this->user)
                ->getJson('/friends')
                ->assertSuccessful()
                ->assertJsonStructure(['friends', 'count'])
                ->assertJsonPath('count', 1);
        });

        it('returns friends from both sides of friendship', function (): void {
            Friendship::factory()->create([
                'user_id' => $this->other->getKey(),
                'friend_id' => $this->user->getKey(),
                'status' => FriendshipStatus::Accepted,
            ]);

            $this->actingAs($this->user)
                ->getJson('/friends')
                ->assertSuccessful()
                ->assertJsonPath('count', 1);
        });

        it('does not include pending requests', function (): void {
            Friendship::factory()->create([
                'user_id' => $this->other->getKey(),
                'friend_id' => $this->user->getKey(),
                'status' => FriendshipStatus::Pending,
            ]);

            $this->actingAs($this->user)
                ->getJson('/friends')
                ->assertSuccessful()
                ->assertJsonPath('count', 0);
        });
    });

    describe('POST /friends', function (): void {
        it('requires authentication', function (): void {
            $this->postJson('/friends', ['friend_id' => $this->other->getKey()])
                ->assertUnauthorized();
        });

        it('sends a friend request', function (): void {
            $this->actingAs($this->user)
                ->postJson('/friends', ['friend_id' => $this->other->getKey()])
                ->assertSuccessful()
                ->assertJson(['message' => 'Запрошення надіслано']);

            $this->assertDatabaseHas('friendships', [
                'user_id' => $this->user->getKey(),
                'friend_id' => $this->other->getKey(),
                'status' => FriendshipStatus::Pending->value,
            ]);
        });

        it('cannot send request to self', function (): void {
            $this->actingAs($this->user)
                ->postJson('/friends', ['friend_id' => $this->user->getKey()])
                ->assertStatus(400)
                ->assertJson(['message' => 'Ви не можете додати себе в друзі']);
        });

        it('cannot send duplicate request', function (): void {
            Friendship::factory()->create([
                'user_id' => $this->user->getKey(),
                'friend_id' => $this->other->getKey(),
                'status' => FriendshipStatus::Pending,
            ]);

            $this->actingAs($this->user)
                ->postJson('/friends', ['friend_id' => $this->other->getKey()])
                ->assertStatus(400)
                ->assertJson(['message' => 'Запрошення вже надіслано']);
        });

        it('cannot send request to existing friend', function (): void {
            Friendship::factory()->create([
                'user_id' => $this->user->getKey(),
                'friend_id' => $this->other->getKey(),
                'status' => FriendshipStatus::Accepted,
            ]);

            $this->actingAs($this->user)
                ->postJson('/friends', ['friend_id' => $this->other->getKey()])
                ->assertStatus(400)
                ->assertJson(['message' => 'Цей користувач вже у вашому списку друзів']);
        });

        it('can re-send request after rejection', function (): void {
            $friendship = Friendship::factory()->create([
                'user_id' => $this->user->getKey(),
                'friend_id' => $this->other->getKey(),
                'status' => FriendshipStatus::Rejected,
            ]);
            $friendship->delete();

            $this->actingAs($this->user)
                ->postJson('/friends', ['friend_id' => $this->other->getKey()])
                ->assertSuccessful()
                ->assertJson(['message' => 'Запрошення надіслано']);
        });

        it('validates friend_id exists', function (): void {
            $this->actingAs($this->user)
                ->postJson('/friends', ['friend_id' => 99999])
                ->assertUnprocessable()
                ->assertJsonValidationErrors(['friend_id']);
        });
    });

    describe('POST /friends/requests/{id}/accept', function (): void {
        it('requires authentication', function (): void {
            $this->postJson('/friends/requests/1/accept')->assertUnauthorized();
        });

        it('accepts a pending friend request', function (): void {
            $friendship = Friendship::factory()->create([
                'user_id' => $this->other->getKey(),
                'friend_id' => $this->user->getKey(),
                'status' => FriendshipStatus::Pending,
            ]);

            $this->actingAs($this->user)
                ->postJson("/friends/requests/{$friendship->getKey()}/accept")
                ->assertSuccessful()
                ->assertJson(['message' => 'Запрошення прийнято']);

            $this->assertDatabaseHas('friendships', [
                'id' => $friendship->getKey(),
                'status' => FriendshipStatus::Accepted->value,
            ]);
        });

        it('cannot accept someone else\'s request', function (): void {
            $thirdUser = User::factory()->create();
            $friendship = Friendship::factory()->create([
                'user_id' => $this->other->getKey(),
                'friend_id' => $thirdUser->getKey(),
                'status' => FriendshipStatus::Pending,
            ]);

            $this->actingAs($this->user)
                ->postJson("/friends/requests/{$friendship->getKey()}/accept")
                ->assertNotFound();
        });
    });

    describe('POST /friends/requests/{id}/reject', function (): void {
        it('requires authentication', function (): void {
            $this->postJson('/friends/requests/1/reject')->assertUnauthorized();
        });

        it('rejects a pending friend request', function (): void {
            $friendship = Friendship::factory()->create([
                'user_id' => $this->other->getKey(),
                'friend_id' => $this->user->getKey(),
                'status' => FriendshipStatus::Pending,
            ]);

            $this->actingAs($this->user)
                ->postJson("/friends/requests/{$friendship->getKey()}/reject")
                ->assertSuccessful()
                ->assertJson(['message' => 'Запрошення відхилено']);

            $this->assertSoftDeleted('friendships', ['id' => $friendship->getKey()]);
        });
    });

    describe('DELETE /friends/{friendId}', function (): void {
        it('requires authentication', function (): void {
            $this->deleteJson('/friends/1')->assertUnauthorized();
        });

        it('removes a friend', function (): void {
            Friendship::factory()->create([
                'user_id' => $this->user->getKey(),
                'friend_id' => $this->other->getKey(),
                'status' => FriendshipStatus::Accepted,
            ]);

            $this->actingAs($this->user)
                ->deleteJson("/friends/{$this->other->getKey()}")
                ->assertSuccessful()
                ->assertJson(['message' => 'Видалено']);
        });

        it('returns 404 when friendship does not exist', function (): void {
            $this->actingAs($this->user)
                ->deleteJson("/friends/{$this->other->getKey()}")
                ->assertNotFound();
        });
    });

    describe('GET /friends/{userId}/check', function (): void {
        it('requires authentication', function (): void {
            $this->getJson("/friends/{$this->other->getKey()}/check")->assertUnauthorized();
        });

        it('returns null when no friendship exists', function (): void {
            $this->actingAs($this->user)
                ->getJson("/friends/{$this->other->getKey()}/check")
                ->assertSuccessful()
                ->assertJson(['status' => null]);
        });

        it('returns friendship status', function (): void {
            Friendship::factory()->create([
                'user_id' => $this->user->getKey(),
                'friend_id' => $this->other->getKey(),
                'status' => FriendshipStatus::Pending,
            ]);

            $this->actingAs($this->user)
                ->getJson("/friends/{$this->other->getKey()}/check")
                ->assertSuccessful()
                ->assertJson([
                    'status' => FriendshipStatus::Pending->value,
                    'is_sender' => true,
                ]);
        });
    });

    describe('GET /friends/requests/pending', function (): void {
        it('requires authentication', function (): void {
            $this->getJson('/friends/requests/pending')->assertUnauthorized();
        });

        it('returns incoming pending requests', function (): void {
            Friendship::factory()->create([
                'user_id' => $this->other->getKey(),
                'friend_id' => $this->user->getKey(),
                'status' => FriendshipStatus::Pending,
            ]);

            $this->actingAs($this->user)
                ->getJson('/friends/requests/pending')
                ->assertSuccessful()
                ->assertJsonPath('count', 1)
                ->assertJsonStructure(['requests' => [['id', 'user', 'created_at']]]);
        });

        it('does not return outgoing requests', function (): void {
            Friendship::factory()->create([
                'user_id' => $this->user->getKey(),
                'friend_id' => $this->other->getKey(),
                'status' => FriendshipStatus::Pending,
            ]);

            $this->actingAs($this->user)
                ->getJson('/friends/requests/pending')
                ->assertSuccessful()
                ->assertJsonPath('count', 0);
        });
    });
});
