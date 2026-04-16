<?php

declare(strict_types=1);

use App\Actions\Profile\UpdateAvatarAction;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

describe('UpdateAvatarAction', function (): void {
    beforeEach(function (): void {
        Storage::fake('public');
    });

    it('stores new avatar and returns path', function (): void {
        $user = User::factory()->create(['avatar' => null]);
        $file = UploadedFile::fake()->image('avatar.jpg');

        $path = app(UpdateAvatarAction::class)->execute($user, $file);

        expect($path)->toStartWith('avatars/')
            ->and($user->fresh()->avatar)->toBe($path);
        Storage::disk('public')->assertExists($path);
    });

    it('deletes old avatar when uploading new one', function (): void {
        Storage::disk('public')->put('avatars/old.jpg', 'content');
        $user = User::factory()->create(['avatar' => 'avatars/old.jpg']);
        $file = UploadedFile::fake()->image('new.jpg');

        app(UpdateAvatarAction::class)->execute($user, $file);

        Storage::disk('public')->assertMissing('avatars/old.jpg');
    });
});
