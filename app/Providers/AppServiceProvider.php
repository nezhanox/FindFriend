<?php

declare(strict_types=1);

namespace App\Providers;

use App\Contracts\NotificationServiceInterface;
use App\Domain\Activity\Events\ActivityMessageSent;
use App\Domain\Activity\Events\FriendRequestSent;
use App\Domain\Activity\Events\FriendshipAccepted;
use App\Domain\Activity\Events\UserJoined;
use App\Domain\Activity\Projections\ActivityFeedProjection;
use App\Domain\Activity\Repositories\ActivityFeedRepositoryInterface;
use App\Domain\Activity\Repositories\EloquentActivityFeedRepository;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(NotificationServiceInterface::class, NotificationService::class);
        $this->app->bind(ActivityFeedRepositoryInterface::class, EloquentActivityFeedRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->environment('production') || request()->header('X-Forwarded-Proto') === 'https') {
            URL::forceScheme('https');
        }

        $this->registerActivityListeners();
    }

    private function registerActivityListeners(): void
    {
        Event::listen(FriendshipAccepted::class, [ActivityFeedProjection::class, 'onFriendshipAccepted']);
        Event::listen(FriendRequestSent::class, [ActivityFeedProjection::class, 'onFriendRequestSent']);
        Event::listen(ActivityMessageSent::class, [ActivityFeedProjection::class, 'onActivityMessageSent']);
        Event::listen(UserJoined::class, [ActivityFeedProjection::class, 'onUserJoined']);

        // UserJoined fires on Laravel's built-in Registered event
        Event::listen(Registered::class, function (Registered $event): void {
            if ($event->user instanceof User) {
                UserJoined::dispatch($event->user);
            }
        });
    }
}
