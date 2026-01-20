<?php

use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\FriendshipController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Page\HomeController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

require __DIR__.'/auth.php';

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::middleware('auth')->group(function () {
    // Profile routes
    Route::prefix('profile')->group(function () {
        Route::post('/update', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/avatar', [ProfileController::class, 'deleteAvatar'])->name('profile.delete-avatar');
    });

    // Chat routes
    Route::prefix('chat')->group(function () {
        Route::get('/', [ConversationController::class, 'index'])->name('chat.index');
        Route::get('/{conversation}', [ConversationController::class, 'show'])->name('chat.show');
        Route::post('/conversations', [ConversationController::class, 'store'])->name('conversations.store');
        Route::post('/messages', [MessageController::class, 'store'])->name('messages.store');
        Route::post('/conversations/{conversation}/mark-as-read', [MessageController::class, 'markAsRead'])->name('conversations.mark-as-read');
        Route::post('/conversations/{conversation}/typing', [ConversationController::class, 'typing'])->name('conversations.typing');
    });

    // Notification routes
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index'])->name('notifications.index');
        Route::get('/unread-count', [NotificationController::class, 'unreadCount'])->name('notifications.unread-count');
        Route::post('/{notification}/mark-as-read', [NotificationController::class, 'markAsRead'])->name('notifications.mark-as-read');
        Route::post('/mark-all-as-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-as-read');
        Route::delete('/{notification}', [NotificationController::class, 'destroy'])->name('notifications.destroy');
    });

    // Friendship routes
    Route::prefix('friends')->group(function () {
        Route::get('/', [FriendshipController::class, 'index'])->name('friends.index');
        Route::post('/', [FriendshipController::class, 'store'])->name('friends.store');
        Route::delete('/{friendId}', [FriendshipController::class, 'destroy'])->name('friends.destroy');
        Route::get('/{userId}/check', [FriendshipController::class, 'check'])->name('friends.check');

        // Friend requests
        Route::get('/requests/pending', [FriendshipController::class, 'pendingRequests'])->name('friends.requests.pending');
        Route::post('/requests/{requestId}/accept', [FriendshipController::class, 'accept'])->name('friends.requests.accept');
        Route::post('/requests/{requestId}/reject', [FriendshipController::class, 'reject'])->name('friends.requests.reject');
    });
});

Route::middleware('auth')->prefix('api/location')->group(function (): void {
    Route::post('/update', [LocationController::class, 'update'])->name('api.location.update');
    Route::get('/nearby', [LocationController::class, 'nearby'])->name('api.location.nearby');
});
