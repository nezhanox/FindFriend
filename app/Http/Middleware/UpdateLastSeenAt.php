<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class UpdateLastSeenAt
{
    /**
     * Handle an incoming request.
     *
     * Update the authenticated user's last_seen_at timestamp
     * if more than 5 minutes have passed since the last update.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check()) {
            $user = auth()->user();
            $cacheKey = 'last_seen_updated_'.$user->getKey();

            // Only update if not recently updated (within last 5 minutes)
            if (! Cache::has($cacheKey)) {
                $user->update(['last_seen_at' => now()]);

                // Cache for 5 minutes to prevent too frequent updates
                Cache::put($cacheKey, true, now()->addMinutes(5));
            }
        }

        return $next($request);
    }
}
