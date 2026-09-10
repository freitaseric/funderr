<?php

namespace App\Providers;

use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Responses\LoginResponse;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Livewire\Livewire;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(\Laravel\Fortify\Contracts\LoginResponse::class, LoginResponse::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::define('manage-registrations', fn (User $user): bool => $user->isActive() && ! $user->must_change_password && $user->canActAsTechnician()
        );
        Gate::define('manage-credit-lines', fn (User $user): bool => $user->isActive() && ! $user->must_change_password && $user->isAdministrator()
        );
        RateLimiter::for('sensitive-read', function (Request $request): Limit {
            return Limit::perMinute(60)->by(($request->user()?->id ?? 'guest').'|'.$request->ip());
        });
        RateLimiter::for('sensitive-write', function (Request $request): Limit {
            return Limit::perMinute(30)->by(($request->user()?->id ?? 'guest').'|'.$request->ip());
        });
        Livewire::addPersistentMiddleware([EnsureUserHasRole::class]);
    }
}
