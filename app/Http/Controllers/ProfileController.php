<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\UpdateProfileRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Update the user's profile information.
     */
    public function update(UpdateProfileRequest $request): RedirectResponse
    {
        $user = Auth::user();
        $validated = $request->validated();

        // Handle avatar upload
        if ($request->hasFile('avatar')) {
            // Delete old avatar if exists
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }

            $avatarPath = $request->file('avatar')->store('avatars', 'public');
            $validated['avatar'] = $avatarPath;
        }

        $user->update($validated);

        return redirect()->back()->with('success', 'Профіль успішно оновлено');
    }

    /**
     * Delete the user's avatar.
     */
    public function deleteAvatar(): RedirectResponse
    {
        $user = Auth::user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
            $user->update(['avatar' => null]);
        }

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
    public function updateVisibility(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'is_visible' => ['required', 'boolean'],
        ]);

        $user = Auth::user();

        if ($user->location) {
            $user->location->update(['is_visible' => $validated['is_visible']]);
        }

        return response()->json([
            'is_visible' => $validated['is_visible'],
        ]);
    }
}
