<?php

namespace App\Http\Middleware;

use App\Models\BrandSetting;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\View;

class SwitchBrand
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        // Check for brand parameter in URL or session
        $brandKey = $request->get('brand') ?: session('current_brand_key');
        
        if ($brandKey) {
            // Validate brand exists and is active
            $brand = BrandSetting::where('brand_key', $brandKey)
                ->where('is_active', true)
                ->first();
                
            if ($brand) {
                session(['current_brand_key' => $brandKey]);
                
                // Set custom domain if applicable
                if ($brand->custom_domain && $request->getHost() !== $brand->custom_domain) {
                    // You might want to redirect to custom domain here
                    // For now, we'll just continue with the current domain
                }
                
                // Share brand settings with views
                View::share('currentBrand', $brand);
                View::share('brandSettings', $brand);
                View::share('brand', $brand);
            }
        }

        return $next($request);
    }
}