<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Contracts\NotificationServiceInterface;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        private readonly NotificationServiceInterface $notificationService,
    ) {}

    /**
     * Get all notifications for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $notifications = $this->notificationService->getForUser($user, 50);
        $unreadCount = $this->notificationService->getUnreadCount($user);

        return response()->json([
            'notifications' => $notifications->map(fn (Notification $notification) => [
                'id' => $notification->getKey(),
                'type' => $notification->type,
                'title' => $notification->title,
                'message' => $notification->message,
                'action_url' => $notification->action_url,
                'data' => $notification->data,
                'read_at' => $notification->read_at?->toISOString(),
                'created_at' => $notification->created_at?->toISOString(),
            ]),
            'unread_count' => $unreadCount,
        ]);
    }

    /**
     * Get unread notifications count.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $count = $this->notificationService->getUnreadCount($user);

        return response()->json([
            'unread_count' => $count,
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Request $request, Notification $notification): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless(
            $notification->user_id === $user->getKey(),
            403,
            'Unauthorized access to notification'
        );

        $this->notificationService->markAsRead($notification);

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $this->notificationService->markAllAsRead($user);

        return response()->json([
            'success' => true,
        ]);
    }

    /**
     * Delete a notification.
     */
    public function destroy(Request $request, Notification $notification): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless(
            $notification->user_id === $user->getKey(),
            403,
            'Unauthorized access to notification'
        );

        $this->notificationService->delete($notification);

        return response()->json([
            'success' => true,
        ]);
    }
}
