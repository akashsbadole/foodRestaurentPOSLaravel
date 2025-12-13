<?php

namespace App\Http\Controllers;

use App\Models\BrandSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class BrandSettingController extends Controller
{
    /**
     * Display the brand settings page.
     */
    public function index()
    {
        $brandSettings = BrandSetting::getCurrent();
        
        return Inertia::render('Settings/Brand/Configure', [
            'brandSettings' => $brandSettings,
        ]);
    }

    /**
     * Update the brand settings.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'app_name' => 'required|string|max:255',
            'logo_url' => 'nullable|url',
            'primary_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'secondary_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'accent_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'industry_type' => 'required|string|in:restaurant,cafe,bar,bakery',
        ]);

        $brandSetting = BrandSetting::first();
        
        if (!$brandSetting) {
            $brandSetting = new BrandSetting();
        }

        $brandSetting->fill($validated);
        $brandSetting->save();

        return redirect()->back()
            ->with('success', 'Brand settings updated successfully!');
    }

    /**
     * Upload a logo image.
     */
    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        $brandSetting = BrandSetting::first();
        
        if (!$brandSetting) {
            $brandSetting = new BrandSetting();
        }

        // Delete old logo if exists
        if ($brandSetting->logo_url) {
            $oldPath = parse_url($brandSetting->logo_url, PHP_URL_PATH);
            if ($oldPath && Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }
        }

        $path = $request->file('logo')->store('logos', 'public');
        $brandSetting->logo_url = Storage::url($path);
        $brandSetting->save();

        return response()->json([
            'logo_url' => $brandSetting->logo_url,
        ]);
    }
}