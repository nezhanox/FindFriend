<?php

declare(strict_types=1);

namespace App\Actions\Profile;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class UpdateAvatarAction
{
    /**
     * Store new avatar, delete old one if exists, persist path to user.
     */
    public function execute(User $user, UploadedFile $file): string
    {
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $file->store('avatars', 'public');

        $user->update(['avatar' => $path]);

        return (string) $path;
    }
}
