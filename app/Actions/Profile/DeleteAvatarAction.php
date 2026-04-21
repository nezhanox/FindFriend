<?php

declare(strict_types=1);

namespace App\Actions\Profile;

use App\Models\User;
use Illuminate\Support\Facades\Storage;

class DeleteAvatarAction
{
    /**
     * Delete the user's avatar from storage and clear the field.
     */
    public function execute(User $user): bool
    {
        if (! $user->avatar) {
            return false;
        }

        Storage::disk('public')->delete($user->avatar);
        $user->update(['avatar' => null]);

        return true;
    }
}
