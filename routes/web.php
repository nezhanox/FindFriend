<?php

use App\Http\Controllers\ConversationController;
use App\Http\Controllers\MessageController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Map');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Chat routes
    Route::prefix('chat')->group(function () {
        Route::get('/', [ConversationController::class, 'index'])->name('chat.index');
        Route::get('/{conversation}', [ConversationController::class, 'show'])->name('chat.show');
        Route::post('/conversations', [ConversationController::class, 'store'])->name('conversations.store');
        Route::post('/messages', [MessageController::class, 'store'])->name('messages.store');
        Route::post('/conversations/{conversation}/mark-as-read', [MessageController::class, 'markAsRead'])->name('conversations.mark-as-read');
    });
});

require __DIR__.'/settings.php';
