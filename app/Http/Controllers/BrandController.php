<?php

namespace App\Http\Controllers;

use App\Models\BrandSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Intervention\Image\Facades\Image;
use Inertia\Inertia;

class BrandController extends Controller
{
    /**
     * Display a listing of the brand settings.
     */
    public function index()
    {
        $brands = BrandSetting::orderBy('sort_order')->get();
        $currentBrand = BrandSetting::getCurrent();
        
        return Inertia::render('Brand/Index', [
            'brands' => $brands,
            'currentBrand' => $currentBrand
        ]);
    }

    /**
     * Show the form for creating a new brand setting.
     */
    public function create()
    {
        $industryTypes = ['restaurant', 'retail', 'service', 'healthcare'];
        $industryTemplates = BrandSetting::getIndustryTemplates('restaurant');
        
        return Inertia::render('Brand/Create', [
            'industryTypes' => $industryTypes,
            'industryTemplates' => $industryTemplates
        ]);
    }

    /**
     * Store a newly created brand setting in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'app_name' => 'required|string|max:255',
            'brand_key' => 'nullable|string|max:50|unique:brand_settings,brand_key',
            'industry_type' => 'required|string|max:50',
            'industry_template' => 'required|string|max:50',
            'primary_color' => 'required|string|max:7',
            'secondary_color' => 'required|string|max:7',
            'accent_color' => 'required|string|max:7',
            'logo_url' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'login_logo_url' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'header_logo_url' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'receipt_logo_url' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'favicon_url' => 'nullable|image|mimes:ico,png|max:1024',
            'background_image_url' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:5120',
            'custom_domain' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'website_url' => 'nullable|url|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->except(['_token', 'logo_url', 'login_logo_url', 'header_logo_url', 'receipt_logo_url', 'favicon_url', 'background_image_url']);

        // Handle file uploads
        $imageFields = ['logo_url', 'login_logo_url', 'header_logo_url', 'receipt_logo_url', 'favicon_url', 'background_image_url'];
        
        foreach ($imageFields as $field) {
            if ($request->hasFile($field)) {
                $file = $request->file($field);
                $fileName = Str::uuid() . '.' . $file->getClientOriginalExtension();
                
                // Create different sizes for different logo types
                if ($field === 'favicon_url') {
                    $image = Image::make($file)->resize(32, 32);
                } elseif ($field === 'receipt_logo_url') {
                    $image = Image::make($file)->resize(200, null, function ($constraint) {
                        $constraint->aspectRatio();
                    });
                } else {
                    $image = Image::make($file)->resize(300, null, function ($constraint) {
                        $constraint->aspectRatio();
                    });
                }
                
                $path = "brands/{$fileName}";
                Storage::disk('public')->put($path, $image->encode());
                $data[$field] = Storage::url($path);
            }
        }

        // Generate brand key if not provided
        if (empty($data['brand_key'])) {
            $data['brand_key'] = Str::slug($data['app_name']);
        }

        // Set default values
        $data['is_active'] = $request->has('is_active');
        $data['enable_brand_preview'] = $request->has('enable_brand_preview');

        // Handle JSON fields
        $jsonFields = ['industry_config', 'email_config', 'email_templates', 'receipt_template', 'invoice_template', 
                       'notification_settings', 'brand_guidelines', 'ui_customizations', 'feature_flags', 'metadata'];
        
        foreach ($jsonFields as $field) {
            if ($request->has($field)) {
                $data[$field] = json_decode($request->input($field), true) ?: [];
            }
        }

        $brand = BrandSetting::create($data);

        return response()->json([
            'message' => 'Brand settings created successfully',
            'brand' => $brand
        ]);
    }

    /**
     * Display the specified brand setting.
     */
    public function show(BrandSetting $brand)
    {
        return Inertia::render('Brand/Show', [
            'brand' => $brand
        ]);
    }

    /**
     * Show the form for editing the specified brand setting.
     */
    public function edit(BrandSetting $brand)
    {
        $industryTypes = ['restaurant', 'retail', 'service', 'healthcare'];
        $industryTemplates = BrandSetting::getIndustryTemplates($brand->industry_type);
        
        return Inertia::render('Brand/Edit', [
            'brand' => $brand,
            'industryTypes' => $industryTypes,
            'industryTemplates' => $industryTemplates
        ]);
    }

    /**
     * Update the specified brand setting in storage.
     */
    public function update(Request $request, BrandSetting $brand)
    {
        $validator = Validator::make($request->all(), [
            'app_name' => 'required|string|max:255',
            'brand_key' => 'nullable|string|max:50|unique:brand_settings,brand_key,' . $brand->id,
            'industry_type' => 'required|string|max:50',
            'industry_template' => 'required|string|max:50',
            'primary_color' => 'required|string|max:7',
            'secondary_color' => 'required|string|max:7',
            'accent_color' => 'required|string|max:7',
            'logo_url' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'login_logo_url' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'header_logo_url' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'receipt_logo_url' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'favicon_url' => 'nullable|image|mimes:ico,png|max:1024',
            'background_image_url' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:5120',
            'custom_domain' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:255',
            'contact_phone' => 'nullable|string|max:20',
            'website_url' => 'nullable|url|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->except(['_token', '_method', 'logo_url', 'login_logo_url', 'header_logo_url', 'receipt_logo_url', 'favicon_url', 'background_image_url']);

        // Handle file uploads
        $imageFields = ['logo_url', 'login_logo_url', 'header_logo_url', 'receipt_logo_url', 'favicon_url', 'background_image_url'];
        
        foreach ($imageFields as $field) {
            if ($request->hasFile($field)) {
                // Delete old image if exists
                if ($brand->$field) {
                    $oldPath = str_replace('/storage/', '', $brand->$field);
                    Storage::disk('public')->delete($oldPath);
                }

                $file = $request->file($field);
                $fileName = Str::uuid() . '.' . $file->getClientOriginalExtension();
                
                // Create different sizes for different logo types
                if ($field === 'favicon_url') {
                    $image = Image::make($file)->resize(32, 32);
                } elseif ($field === 'receipt_logo_url') {
                    $image = Image::make($file)->resize(200, null, function ($constraint) {
                        $constraint->aspectRatio();
                    });
                } else {
                    $image = Image::make($file)->resize(300, null, function ($constraint) {
                        $constraint->aspectRatio();
                    });
                }
                
                $path = "brands/{$fileName}";
                Storage::disk('public')->put($path, $image->encode());
                $data[$field] = Storage::url($path);
            }
        }

        // Set boolean values
        $data['is_active'] = $request->has('is_active');
        $data['enable_brand_preview'] = $request->has('enable_brand_preview');

        // Handle JSON fields
        $jsonFields = ['industry_config', 'email_config', 'email_templates', 'receipt_template', 'invoice_template', 
                       'notification_settings', 'brand_guidelines', 'ui_customizations', 'feature_flags', 'metadata'];
        
        foreach ($jsonFields as $field) {
            if ($request->has($field)) {
                $data[$field] = json_decode($request->input($field), true) ?: [];
            }
        }

        $brand->update($data);

        return response()->json([
            'message' => 'Brand settings updated successfully',
            'brand' => $brand
        ]);
    }

    /**
     * Remove the specified brand setting from storage.
     */
    public function destroy(BrandSetting $brand)
    {
        // Delete associated images
        $imageFields = ['logo_url', 'login_logo_url', 'header_logo_url', 'receipt_logo_url', 'favicon_url', 'background_image_url'];
        
        foreach ($imageFields as $field) {
            if ($brand->$field) {
                $path = str_replace('/storage/', '', $brand->$field);
                Storage::disk('public')->delete($path);
            }
        }

        $brand->delete();

        return response()->json(['message' => 'Brand settings deleted successfully']);
    }

    /**
     * Get industry templates for AJAX request
     */
    public function getIndustryTemplates($industryType)
    {
        $templates = BrandSetting::getIndustryTemplates($industryType);
        return response()->json($templates);
    }

    /**
     * Preview brand settings
     */
    public function preview(Request $request)
    {
        $brandData = $request->all();
        
        // Create a temporary brand object for preview
        $brand = new BrandSetting();
        $brand->fill($brandData);
        
        return Inertia::render('Brand/Preview', [
            'brand' => $brand
        ]);
    }

    /**
     * Export brand settings
     */
    public function export(BrandSetting $brand)
    {
        $exportData = $brand->toArray();
        
        // Remove sensitive data
        unset($exportData['id'], $exportData['created_at'], $exportData['updated_at']);
        
        return response()->json($exportData);
    }

    /**
     * Import brand settings
     */
    public function import(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'brand_data' => 'required|json',
            'app_name' => 'required|string|max:255',
            'brand_key' => 'nullable|string|max:50|unique:brand_settings,brand_key',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $brandData = json_decode($request->input('brand_data'), true);
        $brandData['app_name'] = $request->input('app_name');
        
        if ($request->filled('brand_key')) {
            $brandData['brand_key'] = $request->input('brand_key');
        }

        $brand = BrandSetting::create($brandData);

        return response()->json([
            'message' => 'Brand settings imported successfully',
            'brand' => $brand
        ]);
    }

    /**
     * Switch brand (for multi-brand support)
     */
    public function switchBrand(Request $request)
    {
        $brandKey = $request->input('brand_key');
        
        if ($brandKey) {
            $brand = BrandSetting::where('brand_key', $brandKey)->where('is_active', true)->first();
            
            if (!$brand) {
                return response()->json(['error' => 'Brand not found or inactive'], 404);
            }
            
            session(['current_brand_key' => $brandKey]);
        } else {
            session()->forget('current_brand_key');
        }

        return response()->json(['message' => 'Brand switched successfully']);
    }

    /**
     * Get current brand theme CSS
     */
    public function getThemeCSS($brandKey = null)
    {
        $brand = BrandSetting::getCurrent($brandKey);
        $variables = $brand->getThemeVariables();
        
        $css = ":root {\n";
        foreach ($variables as $key => $value) {
            if ($value) {
                $css .= "  {$key}: {$value};\n";
            }
        }
        $css .= "}\n\n";
        
        // Add custom CSS
        if ($brand->custom_css) {
            $css .= $brand->custom_css . "\n";
        }
        
        return response($css, 200)
            ->header('Content-Type', 'text/css')
            ->header('Cache-Control', 'public, max-age=3600');
    }

    /**
     * Theme Builder for brand customization
     */
    public function themeBuilder(BrandSetting $brand)
    {
        $industryTypes = ['restaurant', 'retail', 'service', 'healthcare'];
        $industryTemplates = BrandSetting::getIndustryTemplates($brand->industry_type);
        
        return Inertia::render('Brand/ThemeBuilder', [
            'brand' => $brand,
            'industryTypes' => $industryTypes,
            'industryTemplates' => $industryTemplates
        ]);
    }
}