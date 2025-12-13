<?php

namespace App\Providers;

use App\Models\BrandSetting;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Config;

class BrandServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Share brand settings with all views
        View::composer('*', function ($view) {
            $brandKey = session('current_brand_key');
            $brandSettings = BrandSetting::getCurrent($brandKey);
            
            // Update the application name dynamically
            Config::set('app.name', $brandSettings->app_name);
            
            // Share brand settings and all active brands
            $view->with([
                'brandSettings' => $brandSettings,
                'brand' => $brandSettings,
                'activeBrands' => BrandSetting::getActiveBrands(),
                'currentBrandKey' => $brandKey,
            ]);
        });

        // Add brand switching middleware
        $this->app['router']->aliasMiddleware('brand.switch', \App\Http\Middleware\SwitchBrand::class);
    }
}