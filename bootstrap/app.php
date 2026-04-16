<?php

use App\Exceptions\Friendship\CannotAddSelfException;
use App\Exceptions\Friendship\FriendshipAlreadyExistsException;
use App\Exceptions\Friendship\FriendshipNotFoundException;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\UpdateLastSeenAt;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // Trust all proxies (for ngrok)
        $middleware->trustProxies(at: '*');

        // Use custom CSRF middleware
        $middleware->validateCsrfTokens(except: [
            //            'chat/*',
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            UpdateLastSeenAt::class,
        ]);

        // Enable session for API routes (needed for anonymous users)
        $middleware->api(prepend: [
            \Illuminate\Session\Middleware\StartSession::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (FriendshipNotFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 404);
        });

        $exceptions->render(function (CannotAddSelfException|FriendshipAlreadyExistsException $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        });
    })->create();
