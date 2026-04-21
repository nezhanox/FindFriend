<?php

declare(strict_types=1);

use App\Actions\Profile\DeleteAvatarAction;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

describe('DeleteAvatarAction', function (): void {
    beforeEach(function (): void {
        Storage::fake('public');
    });

    it('deletes avatar from storage and clears user field', function (): void {
        Storage::disk('public')->put('avatars/photo.jpg', 'content');
        $user = User::factory()->create(['avatar' => 'avatars/photo.jpg']);

        $result = app(DeleteAvatarAction::class)->execute($user);

        expect($result)->toBeTrue()
            ->and($user->fresh()->avatar)->toBeNull();

        Storage::disk('public')->assertMissing('avatars/photo.jpg');
    });

    it('returns false when user has no avatar', function (): void {
        $user = User::factory()->create(['avatar' => null]);

        $result = app(DeleteAvatarAction::class)->execute($user);

        expect($result)->toBeFalse();
    });
});
