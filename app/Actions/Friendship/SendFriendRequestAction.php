<?php

declare(strict_types=1);

namespace App\Actions\Friendship;

use App\Enums\FriendshipStatus;
use App\Models\Friendship;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class SendFriendRequestAction
{
    /**
     * Send or re-send a friend request.
     *
     * Returns JsonResponse with error (400) or success.
     */
    public function execute(User $user, int $friendId): JsonResponse
    {
        if ($user->getKey() === $friendId) {
            return response()->json([
                'message' => 'Ви не можете додати себе в друзі',
            ], 400);
        }

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
            return match ($existing->status) {
                FriendshipStatus::Pending => response()->json([
                    'message' => 'Запрошення вже надіслано',
                ], 400),
                FriendshipStatus::Accepted => response()->json([
                    'message' => 'Цей користувач вже у вашому списку друзів',
                ], 400),
                FriendshipStatus::Rejected => (function () use ($existing): JsonResponse {
                    $existing->restore();
                    $existing->update(['status' => FriendshipStatus::Pending]);

                    return response()->json(['message' => 'Запрошення надіслано']);
                })(),
            };
        }

        Friendship::query()->create([
            'user_id' => $user->getKey(),
            'friend_id' => $friendId,
            'status' => FriendshipStatus::Pending,
        ]);

        return response()->json(['message' => 'Запрошення надіслано']);
    }
}
