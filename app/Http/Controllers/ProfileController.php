<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Actions\Profile\DeleteAvatarAction;
use App\Actions\Profile\UpdateAvatarAction;
use App\Http\Requests\Profile\UpdateVisibilityRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Update the user's profile information.
     */
    public function update(UpdateProfileRequest $request, UpdateAvatarAction $updateAvatar): RedirectResponse
    {
        $user = Auth::user();
        $validated = $request->validated();

        if ($request->hasFile('avatar')) {
            $validated['avatar'] = $updateAvatar->execute($user, $request->file('avatar'));
        }

        $user->update($validated);

        return redirect()->back()->with('success', 'Профіль успішно оновлено');
    }

    /**
     * Delete the user's avatar.
     */
    public function deleteAvatar(DeleteAvatarAction $deleteAvatar): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $deleteAvatar->execute($user);

        return redirect()->back()->with('success', 'Аватар видалено');
    }

    /**
     * Show public profile page for a user.
     */
    public function show(User $user): Response
    {
        $currentUser = Auth::user();

        $isFriend = $currentUser
            ? $currentUser->isFriendsWith($user)
            : false;

        return Inertia::render('Profile/Show', [
            'profileUser' => [
                'id' => $user->getKey(),
                'name' => $user->name,
                'avatar' => $user->avatar,
                'age' => $user->age,
                'gender' => $user->gender,
                'last_seen_at' => $user->last_seen_at?->toISOString(),
            ],
            'isFriend' => $isFriend,
            'isOwn' => $currentUser?->getKey() === $user->getKey(),
        ]);
    }

    /**
     * Toggle map visibility for the authenticated user.
     */
    public function updateVisibility(UpdateVisibilityRequest $request): JsonResponse
    {
        $user = Auth::user();

        if ($user->location) {
            $user->location->update(['is_visible' => $request->boolean('is_visible')]);
        }

        return response()->json([
            'is_visible' => $request->boolean('is_visible'),
        ]);
    }
}
