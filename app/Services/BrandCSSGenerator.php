<?php

namespace App\Services;

use App\Models\BrandSetting;

class BrandCSSGenerator
{
    protected $brand;
    protected $cssVariables = [];
    protected $customCSS = '';

    public function __construct(BrandSetting $brand)
    {
        $this->brand = $brand;
        $this->generateCSSVariables();
        $this->prepareCustomCSS();
    }

    /**
     * Generate CSS variables from brand settings
     */
    protected function generateCSSVariables()
    {
        $this->cssVariables = [
            '--brand-primary' => $this->brand->primary_color ?? '#3B82F6',
            '--brand-secondary' => $this->brand->secondary_color ?? '#64748B',
            '--brand-accent' => $this->brand->accent_color ?? '#EF4444',
            '--brand-success' => $this->brand->success_color ?? '#10B981',
            '--brand-warning' => $this->brand->warning_color ?? '#F59E0B',
            '--brand-error' => $this->brand->error_color ?? '#EF4444',
            '--brand-info' => $this->brand->info_color ?? '#3B82F6',
            '--brand-font-family' => $this->getFontFamily(),
            '--brand-font-size' => $this->getFontSize(),
            '--brand-border-radius' => $this->getBorderRadius(),
            '--brand-sidebar-width' => $this->getSidebarWidth(),
            '--brand-gradient' => $this->getGradient(),
        ];
    }

    /**
     * Prepare custom CSS
     */
    protected function prepareCustomCSS()
    {
        $this->customCSS = $this->brand->custom_css ?? '';
    }

    /**
     * Get font family CSS
     */
    protected function getFontFamily()
    {
        $font = $this->brand->font_family ?? 'Inter';
        return "'{$font}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    }

    /**
     * Get font size CSS
     */
    protected function getFontSize()
    {
        $sizes = [
            'small' => '14px',
            'medium' => '16px',
            'large' => '18px'
        ];

        return $sizes[$this->brand->font_size] ?? $sizes['medium'];
    }

    /**
     * Get border radius CSS
     */
    protected function getBorderRadius()
    {
        $radii = [
            'none' => '0',
            'small' => '0.25rem',
            'medium' => '0.5rem',
            'large' => '1rem',
            'full' => '9999px'
        ];

        return $radii[$this->brand->border_radius] ?? $radii['medium'];
    }

    /**
     * Get sidebar width CSS
     */
    protected function getSidebarWidth()
    {
        $styles = [
            'condensed' => '4rem',
            'default' => '16rem',
            'expanded' => '20rem'
        ];

        return $styles[$this->brand->sidebar_style] ?? $styles['default'];
    }

    /**
     * Get gradient CSS
     */
    protected function getGradient()
    {
        if (!$this->brand->gradient_start || !$this->brand->gradient_end) {
            return 'none';
        }

        $direction = $this->brand->gradient_direction ?? 'to right';
        return "linear-gradient({$direction}, {$this->brand->gradient_start}, {$this->brand->gradient_end})";
    }

    /**
     * Generate complete CSS
     */
    public function generateCSS()
    {
        $css = $this->generateCSSVariablesBlock();
        $css .= $this->generateBaseStyles();
        $css .= $this->generateComponentStyles();
        $css .= $this->generateIndustrySpecificStyles();
        $css .= $this->customCSS;

        return $css;
    }

    /**
     * Generate CSS variables block
     */
    protected function generateCSSVariablesBlock()
    {
        $css = ":root {\n";
        foreach ($this->cssVariables as $variable => $value) {
            $css .= "  {$variable}: {$value};\n";
        }
        $css .= "}\n\n";

        return $css;
    }

    /**
     * Generate base styles
     */
    protected function generateBaseStyles()
    {
        $themeMode = $this->brand->theme_mode ?? 'light';
        
        return "
            body {
                font-family: var(--brand-font-family);
                font-size: var(--brand-font-size);
                background-color: var(--bg-primary);
                color: var(--text-primary);
            }
            
            .theme-{$themeMode} {
                --bg-primary: {$this->getThemeBackgroundColor($themeMode)};
                --bg-secondary: {$this->getThemeSecondaryColor($themeMode)};
                --text-primary: {$this->getThemeTextColor($themeMode)};
                --text-secondary: {$this->getThemeSecondaryTextColor($themeMode)};
                --border-color: {$this->getThemeBorderColor($themeMode)};
            }
            
            .brand-primary-bg {
                background-color: var(--brand-primary) !important;
            }
            
            .brand-primary-text {
                color: var(--brand-primary) !important;
            }
            
            .brand-secondary-bg {
                background-color: var(--brand-secondary) !important;
            }
            
            .brand-secondary-text {
                color: var(--brand-secondary) !important;
            }
            
            .brand-accent-bg {
                background-color: var(--brand-accent) !important;
            }
            
            .brand-accent-text {
                color: var(--brand-accent) !important;
            }
            
            .brand-gradient-bg {
                background: var(--brand-gradient) !important;
            }
            
            .brand-rounded {
                border-radius: var(--brand-border-radius) !important;
            }
        ";
    }

    /**
     * Get theme background color
     */
    protected function getThemeBackgroundColor($mode)
    {
        if ($mode === 'dark') {
            return '#1f2937';
        }
        return '#ffffff';
    }

    /**
     * Get theme secondary color
     */
    protected function getThemeSecondaryColor($mode)
    {
        if ($mode === 'dark') {
            return '#374151';
        }
        return '#f9fafb';
    }

    /**
     * Get theme text color
     */
    protected function getThemeTextColor($mode)
    {
        if ($mode === 'dark') {
            return '#f9fafb';
        }
        return '#111827';
    }

    /**
     * Get theme secondary text color
     */
    protected function getThemeSecondaryTextColor($mode)
    {
        if ($mode === 'dark') {
            return '#d1d5db';
        }
        return '#6b7280';
    }

    /**
     * Get theme border color
     */
    protected function getThemeBorderColor($mode)
    {
        if ($mode === 'dark') {
            return '#4b5563';
        }
        return '#e5e7eb';
    }

    /**
     * Generate component styles
     */
    protected function generateComponentStyles()
    {
        return "
            .btn-brand {
                background-color: var(--brand-primary);
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: var(--brand-border-radius);
                font-weight: 500;
                transition: all 0.2s ease;
                cursor: pointer;
            }
            
            .btn-brand:hover {
                filter: brightness(1.1);
                transform: translateY(-1px);
            }
            
            .btn-brand-outline {
                background-color: transparent;
                color: var(--brand-primary);
                border: 2px solid var(--brand-primary);
                padding: 0.5rem 1rem;
                border-radius: var(--brand-border-radius);
                font-weight: 500;
                transition: all 0.2s ease;
                cursor: pointer;
            }
            
            .btn-brand-outline:hover {
                background-color: var(--brand-primary);
                color: white;
            }
            
            .card-brand {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--brand-border-radius);
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            }
            
            .sidebar-brand {
                background-color: var(--bg-primary);
                border-right: 1px solid var(--border-color);
                width: var(--brand-sidebar-width);
                transition: width 0.3s ease;
            }
            
            .header-brand {
                background-color: var(--brand-primary);
                color: white;
                padding: 1rem;
            }
            
            .input-brand {
                border: 1px solid var(--border-color);
                border-radius: var(--brand-border-radius);
                padding: 0.5rem 0.75rem;
                background-color: var(--bg-secondary);
                color: var(--text-primary);
                transition: border-color 0.2s ease;
            }
            
            .input-brand:focus {
                outline: none;
                border-color: var(--brand-primary);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .badge-brand {
                background-color: var(--brand-accent);
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: var(--brand-border-radius);
                font-size: 0.75rem;
                font-weight: 600;
            }
            
            .alert-brand-success {
                background-color: var(--brand-success);
                color: white;
                padding: 0.75rem 1rem;
                border-radius: var(--brand-border-radius);
                border-left: 4px solid var(--brand-success);
            }
            
            .alert-brand-warning {
                background-color: var(--brand-warning);
                color: white;
                padding: 0.75rem 1rem;
                border-radius: var(--brand-border-radius);
                border-left: 4px solid var(--brand-warning);
            }
            
            .alert-brand-error {
                background-color: var(--brand-error);
                color: white;
                padding: 0.75rem 1rem;
                border-radius: var(--brand-border-radius);
                border-left: 4px solid var(--brand-error);
            }
            
            .table-brand {
                width: 100%;
                border-collapse: collapse;
                background-color: var(--bg-secondary);
                border-radius: var(--brand-border-radius);
                overflow: hidden;
            }
            
            .table-brand th,
            .table-brand td {
                padding: 0.75rem;
                text-align: left;
                border-bottom: 1px solid var(--border-color);
            }
            
            .table-brand th {
                background-color: var(--bg-primary);
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .modal-brand {
                background-color: var(--bg-secondary);
                border-radius: var(--brand-border-radius);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                border: 1px solid var(--border-color);
            }
            
            .modal-brand .modal-header {
                background-color: var(--brand-primary);
                color: white;
                padding: 1rem;
                border-radius: var(--brand-border-radius) var(--brand-border-radius) 0 0;
            }
        ";
    }

    /**
     * Generate industry-specific styles
     */
    protected function generateIndustrySpecificStyles()
    {
        $industryType = $this->brand->industry_type ?? 'restaurant';
        $industryConfig = $this->brand->industry_config ?? [];

        switch ($industryType) {
            case 'restaurant':
                return $this->generateRestaurantStyles($industryConfig);
            case 'retail':
                return $this->generateRetailStyles($industryConfig);
            case 'service':
                return $this->generateServiceStyles($industryConfig);
            case 'healthcare':
                return $this->generateHealthcareStyles($industryConfig);
            default:
                return '';
        }
    }

    /**
     * Generate restaurant-specific styles
     */
    protected function generateRestaurantStyles($config)
    {
        return "
            .table-restaurant {
                border: 2px solid var(--brand-primary);
                background-color: var(--bg-secondary);
                color: var(--text-primary);
                border-radius: var(--brand-border-radius);
                transition: all 0.2s ease;
            }
            
            .table-restaurant.occupied {
                background-color: var(--brand-error);
                color: white;
            }
            
            .table-restaurant.reserved {
                background-color: var(--brand-warning);
                color: white;
            }
            
            .kitchen-order-card {
                background: var(--bg-secondary);
                border-left: 4px solid var(--brand-primary);
                border-radius: var(--brand-border-radius);
                padding: 1rem;
                margin-bottom: 1rem;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .kitchen-order-card.priority-high {
                border-left-color: var(--brand-error);
                background-color: rgba(239, 68, 68, 0.1);
            }
            
            .menu-item-restaurant {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--brand-border-radius);
                padding: 1rem;
                transition: all 0.2s ease;
                cursor: pointer;
            }
            
            .menu-item-restaurant:hover {
                border-color: var(--brand-primary);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                transform: translateY(-2px);
            }
        ";
    }

    /**
     * Generate retail-specific styles
     */
    protected function generateRetailStyles($config)
    {
        return "
            .product-card-retail {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--brand-border-radius);
                padding: 1rem;
                transition: all 0.2s ease;
            }
            
            .product-card-retail:hover {
                border-color: var(--brand-primary);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            
            .price-tag-retail {
                background-color: var(--brand-accent);
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: var(--brand-border-radius);
                font-weight: 600;
                font-size: 0.875rem;
            }
            
            .inventory-low {
                background-color: var(--brand-warning);
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: var(--brand-border-radius);
                font-size: 0.75rem;
                font-weight: 600;
            }
        ";
    }

    /**
     * Generate service-specific styles
     */
    protected function generateServiceStyles($config)
    {
        return "
            .appointment-card-service {
                background: var(--bg-secondary);
                border-left: 4px solid var(--brand-primary);
                border-radius: var(--brand-border-radius);
                padding: 1rem;
                margin-bottom: 1rem;
            }
            
            .service-provider-card {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--brand-border-radius);
                padding: 1rem;
                text-align: center;
            }
            
            .time-slot-service {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--brand-border-radius);
                padding: 0.5rem;
                margin: 0.25rem;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .time-slot-service:hover,
            .time-slot-service.selected {
                background-color: var(--brand-primary);
                color: white;
                border-color: var(--brand-primary);
            }
        ";
    }

    /**
     * Generate healthcare-specific styles
     */
    protected function generateHealthcareStyles($config)
    {
        return "
            .patient-card-healthcare {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--brand-border-radius);
                padding: 1rem;
                margin-bottom: 1rem;
            }
            
            .medical-record {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--brand-border-radius);
                padding: 1rem;
            }
            
            .prescription-card {
                background: var(--bg-secondary);
                border-left: 4px solid var(--brand-info);
                border-radius: var(--brand-border-radius);
                padding: 1rem;
                margin-bottom: 1rem;
            }
            
            .appointment-healthcare {
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--brand-border-radius);
                padding: 1rem;
                position: relative;
            }
            
            .appointment-healthcare::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 4px;
                background-color: var(--brand-primary);
                border-radius: var(--brand-border-radius) 0 0 var(--brand-border-radius);
            }
        ";
    }

    /**
     * Generate CSS file for brand
     */
    public function generateCSSFile($brandKey = null)
    {
        $css = $this->generateCSS();
        
        // Minify CSS
        $css = $this->minifyCSS($css);
        
        return $css;
    }

    /**
     * Minify CSS
     */
    protected function minifyCSS($css)
    {
        // Remove comments
        $css = preg_replace('!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $css);
        
        // Remove whitespace
        $css = preg_replace('/\s+/', ' ', $css);
        $css = preg_replace('/\s*([{}:;,])\s*/', '$1', $css);
        $css = preg_replace('/;}/', '}', $css);
        
        return trim($css);
    }

    /**
     * Save CSS to file
     */
    public function saveCSSFile($path, $brandKey = null)
    {
        $css = $this->generateCSSFile($brandKey);
        
        // Ensure directory exists
        $directory = dirname($path);
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }
        
        return file_put_contents($path, $css);
    }
}