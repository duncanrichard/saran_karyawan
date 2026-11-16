<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('registration', fn (Request $request) => Limit::perMinute(3)->by(
            $request->ip().'|'.strtolower((string) $request->input('email')),
        ));
        RateLimiter::for('email-verification', fn (Request $request) => Limit::perMinute(5)->by(
            $request->ip().'|'.strtolower((string) $request->input('email')),
        ));

        ResetPassword::createUrlUsing(
            fn (object $user, string $token): string => url('/reset-password/'.rawurlencode($token).'?email='.rawurlencode($user->getEmailForPasswordReset()))
        );
    }
}
