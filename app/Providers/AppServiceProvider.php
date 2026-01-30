<?php

namespace App\Providers;

use App\Services\FakeRedis;
use Illuminate\Support\Facades\Redis;
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
        if (config('cache.redis_driver') == false) {
            Redis::swap(new FakeRedis());
        }
    }
}
