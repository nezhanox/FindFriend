<?php

declare(strict_types=1);

use App\Http\Controllers\Api\LocationController;
use Illuminate\Support\Facades\Route;

Route::prefix('location')->group(function (): void {
    Route::post('/update', [LocationController::class, 'update'])->name('api.location.update');
    Route::get('/nearby', [LocationController::class, 'nearby'])->name('api.location.nearby');
});
