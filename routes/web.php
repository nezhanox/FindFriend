<?php

use App\Http\Controllers\ConversationController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\Page\HomeController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Chat routes
    Route::prefix('chat')->group(function () {
        Route::get('/', [ConversationController::class, 'index'])->name('chat.index');
        Route::get('/{conversation}', [ConversationController::class, 'show'])->name('chat.show');
        Route::post('/conversations', [ConversationController::class, 'store'])->name('conversations.store');
        Route::post('/messages', [MessageController::class, 'store'])->name('messages.store');
        Route::post('/conversations/{conversation}/mark-as-read', [MessageController::class, 'markAsRead'])->name('conversations.mark-as-read');
    });
});

require __DIR__.'/auth.php';
require __DIR__.'/settings.php';
