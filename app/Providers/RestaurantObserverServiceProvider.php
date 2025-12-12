<?php

namespace App\Providers;

use App\Observers\Restaurant\RestaurantOrderObserver;
use App\Observers\Restaurant\RestaurantOrderItemObserver;
use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantOrderItem;
use Illuminate\Support\ServiceProvider;

class RestaurantObserverServiceProvider extends ServiceProvider
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
        RestaurantOrder::observe(RestaurantOrderObserver::class);
        RestaurantOrderItem::observe(RestaurantOrderItemObserver::class);
    }
}