<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class BrandSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        // Basic branding
        'app_name', 'tagline', 'description', 'contact_email', 'contact_phone', 'website_url',
        
        // Logo and media management
        'logo_url', 'login_logo_url', 'header_logo_url', 'receipt_logo_url', 'favicon_url',
        'background_image_url', 'background_pattern',
        
        // Advanced theme customization
        'theme_mode', 'font_family', 'font_size', 'border_radius', 'sidebar_style',
        
        // Extended color scheme
        'primary_color', 'secondary_color', 'accent_color', 'success_color', 'warning_color',
        'error_color', 'info_color', 'gradient_start', 'gradient_end', 'gradient_direction',
        
        // Industry-specific settings
        'industry_type', 'industry_template', 'industry_config',
        
        // Custom CSS and JavaScript
        'custom_css', 'custom_js', 'custom_head',
        
        // Multi-brand support
        'is_active', 'brand_key', 'sort_order',
        
        // Domain and email configuration
        'custom_domain', 'email_config', 'email_templates',
        
        // Receipt and invoice customization
        'receipt_template', 'invoice_template', 'receipt_footer', 'receipt_header',
        
        // Notification branding
        'notification_settings', 'sms_sender_id', 'whatsapp_business_number',
        
        // Advanced settings
        'brand_guidelines', 'ui_customizations', 'feature_flags', 'enable_brand_preview', 'metadata'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'industry_config' => 'array',
        'email_config' => 'array',
        'email_templates' => 'array',
        'receipt_template' => 'array',
        'invoice_template' => 'array',
        'notification_settings' => 'array',
        'brand_guidelines' => 'array',
        'ui_customizations' => 'array',
        'feature_flags' => 'array',
        'metadata' => 'array',
        'is_active' => 'boolean',
        'enable_brand_preview' => 'boolean',
    ];

    /**
     * Get the default brand settings
     */
    public static function getDefault()
    {
        return [
            // Basic branding
            'app_name' => 'DineFlow',
            'tagline' => 'Restaurant POS System',
            'description' => 'Complete restaurant management solution',
            'contact_email' => null,
            'contact_phone' => null,
            'website_url' => null,
            
            // Logo and media management
            'logo_url' => null,
            'login_logo_url' => null,
            'header_logo_url' => null,
            'receipt_logo_url' => null,
            'favicon_url' => null,
            'background_image_url' => null,
            'background_pattern' => null,
            
            // Advanced theme customization
            'theme_mode' => 'light',
            'font_family' => 'Inter',
            'font_size' => 'medium',
            'border_radius' => 'medium',
            'sidebar_style' => 'default',
            
            // Extended color scheme
            'primary_color' => '#3B82F6',
            'secondary_color' => '#64748B',
            'accent_color' => '#EF4444',
            'success_color' => '#10B981',
            'warning_color' => '#F59E0B',
            'error_color' => '#EF4444',
            'info_color' => '#3B82F6',
            'gradient_start' => null,
            'gradient_end' => null,
            'gradient_direction' => 'to right',
            
            // Industry-specific settings
            'industry_type' => 'restaurant',
            'industry_template' => 'modern',
            'industry_config' => [],
            
            // Custom CSS and JavaScript
            'custom_css' => null,
            'custom_js' => null,
            'custom_head' => null,
            
            // Multi-brand support
            'is_active' => true,
            'brand_key' => null,
            'sort_order' => 0,
            
            // Domain and email configuration
            'custom_domain' => null,
            'email_config' => [],
            'email_templates' => [],
            
            // Receipt and invoice customization
            'receipt_template' => [],
            'invoice_template' => [],
            'receipt_footer' => 'Thank you for your business!',
            'receipt_header' => null,
            
            // Notification branding
            'notification_settings' => [],
            'sms_sender_id' => null,
            'whatsapp_business_number' => null,
            
            // Advanced settings
            'brand_guidelines' => [],
            'ui_customizations' => [],
            'feature_flags' => [],
            'enable_brand_preview' => true,
            'metadata' => []
        ];
    }

    /**
     * Get the current brand settings or default
     */
    public static function getCurrent($brandKey = null)
    {
        $cacheKey = $brandKey ? "brand_settings_{$brandKey}" : 'brand_settings';
        
        return Cache::remember($cacheKey, 3600, function () use ($brandKey) {
            $query = self::where('is_active', true);
            
            if ($brandKey) {
                $query->where('brand_key', $brandKey);
            }
            
            $settings = $query->first();
            
            if (!$settings) {
                return (object) self::getDefault();
            }

            return $settings;
        });
    }

    /**
     * Get all active brands
     */
    public static function getActiveBrands()
    {
        return Cache::remember('active_brands', 3600, function () {
            return self::where('is_active', true)
                ->orderBy('sort_order')
                ->get();
        });
    }

    /**
     * Get industry-specific templates
     */
    public static function getIndustryTemplates($industryType)
    {
        $templates = [
            'restaurant' => [
                'fine_dining' => [
                    'name' => 'Fine Dining',
                    'description' => 'Elegant and sophisticated theme for upscale restaurants',
                    'primary_color' => '#1F2937',
                    'secondary_color' => '#F3F4F6',
                    'accent_color' => '#DC2626',
                    'font_family' => 'Playfair Display'
                ],
                'fast_food' => [
                    'name' => 'Fast Food',
                    'description' => 'Bright and energetic theme for quick service restaurants',
                    'primary_color' => '#DC2626',
                    'secondary_color' => '#FEF3C7',
                    'accent_color' => '#F59E0B',
                    'font_family' => 'Poppins'
                ],
                'cafe' => [
                    'name' => 'Cafe',
                    'description' => 'Warm and cozy theme for coffee shops and cafes',
                    'primary_color' => '#92400E',
                    'secondary_color' => '#FEF3C7',
                    'accent_color' => '#059669',
                    'font_family' => 'Merriweather'
                ],
                'bar' => [
                    'name' => 'Bar',
                    'description' => 'Dark and modern theme for bars and lounges',
                    'primary_color' => '#1F2937',
                    'secondary_color' => '#374151',
                    'accent_color' => '#8B5CF6',
                    'font_family' => 'Oswald'
                ]
            ]
        ];

        return $templates[$industryType] ?? [];
    }

    /**
     * Get theme CSS variables
     */
    public function getThemeVariables()
    {
        return [
            '--primary-color' => $this->primary_color,
            '--secondary-color' => $this->secondary_color,
            '--accent-color' => $this->accent_color,
            '--success-color' => $this->success_color,
            '--warning-color' => $this->warning_color,
            '--error-color' => $this->error_color,
            '--info-color' => $this->info_color,
            '--font-family' => $this->font_family,
            '--font-size' => $this->getFontSizeValue(),
            '--border-radius' => $this->getBorderRadiusValue(),
            '--gradient-start' => $this->gradient_start,
            '--gradient-end' => $this->gradient_end,
            '--gradient-direction' => $this->gradient_direction,
        ];
    }

    /**
     * Get font size CSS value
     */
    private function getFontSizeValue()
    {
        $sizes = [
            'small' => '14px',
            'medium' => '16px',
            'large' => '18px'
        ];

        return $sizes[$this->font_size] ?? $sizes['medium'];
    }

    /**
     * Get border radius CSS value
     */
    private function getBorderRadiusValue()
    {
        $radii = [
            'none' => '0',
            'small' => '0.25rem',
            'medium' => '0.5rem',
            'large' => '1rem',
            'full' => '9999px'
        ];

        return $radii[$this->border_radius] ?? $radii['medium'];
    }

    /**
     * Clear brand settings cache
     */
    public static function clearCache($brandKey = null)
    {
        $keys = $brandKey ? ["brand_settings_{$brandKey}"] : ['brand_settings', 'active_brands'];
        
        foreach ($keys as $key) {
            Cache::forget($key);
        }
    }

    /**
     * Boot the model
     */
    protected static function boot()
    {
        parent::boot();

        static::updated(function () {
            self::clearCache();
        });

        static::created(function () {
            self::clearCache();
        });

        static::deleted(function () {
            self::clearCache();
        });
    }
}