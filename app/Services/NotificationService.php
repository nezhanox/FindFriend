<?php

declare(strict_types=1);

namespace App\Services;

use App\Contracts\NotificationServiceInterface;
use App\Events\NewNotification;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class NotificationService implements NotificationServiceInterface
{
    /**
     * Create a new notification for a user.
     *
     * @param  array{type: string, title: string, message: string, action_url?: string|null, data?: array<string, mixed>|null}  $data
     */
    public function create(User $user, array $data): Notification
    {
        $notification = Notification::query()->create([
            'user_id' => $user->getKey(),
            'type' => $data['type'],
            'title' => $data['title'],
            'message' => $data['message'],
            'action_url' => $data['action_url'] ?? null,
            'data' => $data['data'] ?? null,
        ]);

        broadcast(new NewNotification($notification));

        return $notification;
    }

    /**
     * Get all notifications for a user.
     *
     * @return Collection<int, Notification>
     */
    public function getForUser(User $user, ?int $limit = null): Collection
    {
        $query = Notification::query()
            ->where('user_id', $user->getKey())
            ->orderByDesc('created_at');

        if ($limit !== null) {
            $query->limit($limit);
        }

        return $query->get();
    }

    /**
     * Get unread notifications for a user.
     *
     * @return Collection<int, Notification>
     */
    public function getUnreadForUser(User $user, ?int $limit = null): Collection
    {
        $query = Notification::query()
            ->where('user_id', $user->getKey())
            ->unread()
            ->orderByDesc('created_at');

        if ($limit !== null) {
            $query->limit($limit);
        }

        return $query->get();
    }

    /**
     * Get unread count for a user.
     */
    public function getUnreadCount(User $user): int
    {
        return Notification::query()
            ->where('user_id', $user->getKey())
            ->unread()
            ->count();
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Notification $notification): void
    {
        $notification->markAsRead();
    }

    /**
     * Mark all notifications as read for a user.
     */
    public function markAllAsRead(User $user): void
    {
        Notification::query()
            ->where('user_id', $user->getKey())
            ->unread()
            ->update(['read_at' => now()]);
    }

    /**
     * Delete a notification.
     */
    public function delete(Notification $notification): void
    {
        $notification->delete();
    }
}
