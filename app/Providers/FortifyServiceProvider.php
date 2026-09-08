<?php

namespace App\Providers;

use App\Actions\Fortify\UpdateUserPassword;
use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Fortify::loginView(
            fn () => view('auth.login')
        );

        Fortify::updateUserPasswordsUsing(
            UpdateUserPassword::class
        );

        Fortify::authenticateUsing(function (Request $request) {
            $user = User::query()
                ->where('cpf', (string) $request->input('cpf'))
                ->whereNull('disabled_at')
                ->first();

            if (
                $user
                && ! $user->temporaryPasswordHasExpired()
                && Hash::check(
                    (string) $request->input('password'),
                    $user->password
                )
            ) {
                return $user;
            }

            return null;
        });

        RateLimiter::for('login', function (Request $request) {
            $cpf = (string) $request->input(Fortify::username());

            return Limit::perMinute(5)->by(
                Str::lower($cpf).'|'.$request->ip()
            );
        });
    }
}
