<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\FriendshipStatus;
use App\Models\Friendship;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FriendshipController extends Controller
{
    /**
     * Get list of accepted friends for authenticated user.
     */
    public function index(): JsonResponse
    {
        $user = Auth::user();

        $friendIds = Friendship::query()
            ->where('status', FriendshipStatus::Accepted)
            ->where(function ($query) use ($user): void {
                $query->where('user_id', $user->getKey())
                    ->orWhere('friend_id', $user->getKey());
            })
            ->get()
            ->map(fn (Friendship $friendship) => $friendship->user_id === $user->getKey()
                    ? $friendship->friend_id
                    : $friendship->user_id
            )
            ->unique();

        $friends = User::query()
            ->with('location')
            ->whereIn('id', $friendIds)
            ->get()
            ->map(fn (User $friend) => [
                'id' => $friend->getKey(),
                'name' => $friend->name,
                'avatar' => $friend->avatar,
                'age' => $friend->age,
                'gender' => $friend->gender,
                'last_seen_at' => $friend->last_seen_at?->toISOString(),
                'location' => $friend->location ? [
                    'lat' => $friend->location->lat,
                    'lng' => $friend->location->lng,
                    'address' => $friend->location->address,
                ] : null,
            ]);

        return response()->json([
            'friends' => $friends,
            'count' => $friends->count(),
        ]);
    }

    /**
     * Send a friend request.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'friend_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $user = Auth::user();
        $friendId = (int) $validated['friend_id'];

        // Can't add yourself as friend
        if ($user->getKey() === $friendId) {
            return response()->json([
                'message' => 'Ви не можете додати себе в друзі',
            ], 400);
        }

        // Check if active friendship or pending request already exists (including soft deleted)
        $existing = Friendship::query()
            ->withTrashed()
            ->where(function ($query) use ($user, $friendId): void {
                $query->where('user_id', $user->getKey())
                    ->where('friend_id', $friendId);
            })
            ->orWhere(function ($query) use ($user, $friendId): void {
                $query->where('user_id', $friendId)
                    ->where('friend_id', $user->getKey());
            })
            ->first();

        if ($existing) {
            if ($existing->status === FriendshipStatus::Pending) {
                return response()->json([
                    'message' => 'Запрошення вже надіслано',
                ], 400);
            }

            if ($existing->status === FriendshipStatus::Accepted) {
                return response()->json([
                    'message' => 'Цей користувач вже у вашому списку друзів',
                ], 400);
            }

            // If rejected, restore it with pending status
            if ($existing->status === FriendshipStatus::Rejected) {
                $existing->restore();
                $existing->update(['status' => FriendshipStatus::Pending]);

                return response()->json([
                    'message' => 'Запрошення надіслано',
                ]);
            }
        }

        // Create pending friend request
        Friendship::query()->create([
            'user_id' => $user->getKey(),
            'friend_id' => $friendId,
            'status' => FriendshipStatus::Pending,
        ]);

        return response()->json([
            'message' => 'Запрошення надіслано',
        ]);
    }

    /**
     * Accept a friend request.
     */
    public function accept(int $requestId): JsonResponse
    {
        $user = Auth::user();

        $friendship = Friendship::query()
            ->where('id', $requestId)
            ->where('friend_id', $user->getKey())
            ->where('status', FriendshipStatus::Pending)
            ->first();

        if (! $friendship) {
            return response()->json([
                'message' => 'Запрошення не знайдено',
            ], 404);
        }

        $friendship->update(['status' => FriendshipStatus::Accepted]);

        return response()->json([
            'message' => 'Запрошення прийнято',
        ]);
    }

    /**
     * Reject a friend request (soft delete).
     */
    public function reject(int $requestId): JsonResponse
    {
        $user = Auth::user();

        $friendship = Friendship::query()
            ->where('id', $requestId)
            ->where('friend_id', $user->getKey())
            ->where('status', FriendshipStatus::Pending)
            ->first();

        if (! $friendship) {
            return response()->json([
                'message' => 'Запрошення не знайдено',
            ], 404);
        }

        $friendship->update(['status' => FriendshipStatus::Rejected]);
        $friendship->delete(); // Soft delete

        return response()->json([
            'message' => 'Запрошення відхилено',
        ]);
    }

    /**
     * Get pending friend requests for authenticated user.
     */
    public function pendingRequests(): JsonResponse
    {
        $user = Auth::user();

        $requests = Friendship::query()
            ->with('user')
            ->where('friend_id', $user->getKey())
            ->where('status', FriendshipStatus::Pending)
            ->get()
            ->map(fn (Friendship $friendship) => [
                'id' => $friendship->getKey(),
                'user' => [
                    'id' => $friendship->user->getKey(),
                    'name' => $friendship->user->name,
                    'avatar' => $friendship->user->avatar,
                    'age' => $friendship->user->age,
                    'gender' => $friendship->user->gender,
                ],
                'created_at' => $friendship->created_at->toISOString(),
            ]);

        return response()->json([
            'requests' => $requests,
            'count' => $requests->count(),
        ]);
    }

    /**
     * Remove a friend or cancel friend request.
     */
    public function destroy(int $friendId): JsonResponse
    {
        $user = Auth::user();

        $deleted = Friendship::query()
            ->where(function ($query) use ($user, $friendId): void {
                $query->where('user_id', $user->getKey())
                    ->where('friend_id', $friendId);
            })
            ->orWhere(function ($query) use ($user, $friendId): void {
                $query->where('user_id', $friendId)
                    ->where('friend_id', $user->getKey());
            })
            ->delete();

        if ($deleted === 0) {
            return response()->json([
                'message' => 'Дружбу не знайдено',
            ], 404);
        }

        return response()->json([
            'message' => 'Видалено',
        ]);
    }

    /**
     * Check friendship status with user.
     */
    public function check(int $userId): JsonResponse
    {
        $currentUser = Auth::user();

        $friendship = Friendship::query()
            ->where(function ($query) use ($currentUser, $userId): void {
                $query->where('user_id', $currentUser->getKey())
                    ->where('friend_id', $userId);
            })
            ->orWhere(function ($query) use ($currentUser, $userId): void {
                $query->where('user_id', $userId)
                    ->where('friend_id', $currentUser->getKey());
            })
            ->first();

        if (! $friendship) {
            return response()->json([
                'status' => null,
            ]);
        }

        return response()->json([
            'status' => $friendship->status->value,
            'is_sender' => $friendship->user_id === $currentUser->getKey(),
        ]);
    }
}
