<?php

declare(strict_types=1);

use App\Events\LocationUpdated;
use App\Models\User;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Redis;

describe('Location API', function (): void {
    beforeEach(function (): void {
        $this->user = User::factory()->create();
        Event::fake([LocationUpdated::class]);
        Redis::shouldReceive('geoadd')->andReturn(1);
    });

    describe('POST /api/location/update', function (): void {
        it('requires authentication', function (): void {
            $this->postJson('/api/location/update', [
                'lat' => 50.4501,
                'lng' => 30.5234,
            ])->assertUnauthorized();
        });

        it('updates user location', function (): void {
            $this->actingAs($this->user)
                ->postJson('/api/location/update', [
                    'lat' => 50.4501,
                    'lng' => 30.5234,
                ])
                ->assertSuccessful()
                ->assertJson([
                    'user_id' => $this->user->getKey(),
                    'message' => 'Location updated successfully',
                ]);

            $this->assertDatabaseHas('user_locations', [
                'user_id' => $this->user->getKey(),
                'lat' => 50.4501,
                'lng' => 30.5234,
            ]);
        });

        it('stores optional address', function (): void {
            $this->actingAs($this->user)
                ->postJson('/api/location/update', [
                    'lat' => 50.4501,
                    'lng' => 30.5234,
                    'address' => 'вул. Хрещатик, 1, Київ',
                ])
                ->assertSuccessful();

            $this->assertDatabaseHas('user_locations', [
                'user_id' => $this->user->getKey(),
                'address' => 'вул. Хрещатик, 1, Київ',
            ]);
        });

        it('broadcasts location updated event', function (): void {
            $this->actingAs($this->user)
                ->postJson('/api/location/update', [
                    'lat' => 50.4501,
                    'lng' => 30.5234,
                ])
                ->assertSuccessful();

            Event::assertDispatched(LocationUpdated::class, function (LocationUpdated $event): bool {
                return $event->userId === $this->user->getKey()
                    && $event->lat === 50.4501
                    && $event->lng === 30.5234;
            });
        });

        it('validates lat/lng boundaries', function (): void {
            $this->actingAs($this->user)
                ->postJson('/api/location/update', [
                    'lat' => 91.0,
                    'lng' => 181.0,
                ])
                ->assertUnprocessable()
                ->assertJsonValidationErrors(['lat', 'lng']);
        });

        it('requires lat and lng', function (): void {
            $this->actingAs($this->user)
                ->postJson('/api/location/update', [])
                ->assertUnprocessable()
                ->assertJsonValidationErrors(['lat', 'lng']);
        });
    });

    describe('GET /api/location/nearby', function (): void {
        it('requires authentication', function (): void {
            $this->getJson('/api/location/nearby?lat=50.4501&lng=30.5234')
                ->assertUnauthorized();
        });

        it('returns nearby users from redis', function (): void {
            Redis::shouldReceive('georadius')->andReturn([]);

            $this->actingAs($this->user)
                ->getJson('/api/location/nearby?lat=50.4501&lng=30.5234&radius=5')
                ->assertSuccessful()
                ->assertJsonStructure(['users', 'count']);
        });

        it('validates radius boundaries', function (): void {
            $this->actingAs($this->user)
                ->getJson('/api/location/nearby?lat=50.4501&lng=30.5234&radius=200')
                ->assertUnprocessable()
                ->assertJsonValidationErrors(['radius']);
        });

        it('requires lat and lng', function (): void {
            $this->actingAs($this->user)
                ->getJson('/api/location/nearby')
                ->assertUnprocessable()
                ->assertJsonValidationErrors(['lat', 'lng']);
        });
    });
});
