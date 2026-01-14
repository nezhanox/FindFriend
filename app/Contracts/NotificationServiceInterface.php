<?php

declare(strict_types=1);

namespace App\Contracts;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

interface NotificationServiceInterface
{
    /**
     * Create a new notification for a user.
     *
     * @param  array{type: string, title: string, message: string, action_url?: string|null, data?: array<string, mixed>|null}  $data
     */
    public function create(User $user, array $data): Notification;

    /**
     * Get all notifications for a user.
     *
     * @return Collection<int, Notification>
     */
    public function getForUser(User $user, ?int $limit = null): Collection;

    /**
     * Get unread notifications for a user.
     *
     * @return Collection<int, Notification>
     */
    public function getUnreadForUser(User $user, ?int $limit = null): Collection;

    /**
     * Get unread count for a user.
     */
    public function getUnreadCount(User $user): int;

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Notification $notification): void;

    /**
     * Mark all notifications as read for a user.
     */
    public function markAllAsRead(User $user): void;

    /**
     * Delete a notification.
     */
    public function delete(Notification $notification): void;
}
