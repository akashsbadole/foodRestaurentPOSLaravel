<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('brand_settings', function (Blueprint $table) {
            // Basic branding
            $table->string('tagline')->nullable();
            $table->text('description')->nullable();
            $table->string('contact_email')->nullable();
            $table->string('contact_phone')->nullable();
            $table->string('website_url')->nullable();
            
            // Logo and media management
            $table->string('logo_url')->nullable()->change();
            $table->string('login_logo_url')->nullable();
            $table->string('header_logo_url')->nullable();
            $table->string('receipt_logo_url')->nullable();
            $table->string('favicon_url')->nullable();
            $table->string('background_image_url')->nullable();
            $table->string('background_pattern')->nullable();
            
            // Advanced theme customization
            $table->string('theme_mode')->default('light'); // light, dark, auto
            $table->string('font_family')->default('Inter');
            $table->string('font_size')->default('medium'); // small, medium, large
            $table->string('border_radius')->default('medium'); // none, small, medium, large, full
            $table->string('sidebar_style')->default('default'); // default, condensed, expanded
            
            // Extended color scheme
            $table->string('primary_color')->default('#3B82F6')->change();
            $table->string('secondary_color')->default('#64748B')->change();
            $table->string('accent_color')->default('#EF4444')->change();
            $table->string('success_color')->default('#10B981');
            $table->string('warning_color')->default('#F59E0B');
            $table->string('error_color')->default('#EF4444');
            $table->string('info_color')->default('#3B82F6');
            $table->string('gradient_start')->nullable();
            $table->string('gradient_end')->nullable();
            $table->string('gradient_direction')->default('to right'); // to right, to left, to bottom, etc.
            
            // Industry-specific settings
            $table->string('industry_type')->default('restaurant')->change();
            $table->string('industry_template')->default('modern'); // modern, classic, minimal, etc.
            $table->json('industry_config')->nullable(); // Store industry-specific configurations
            
            // Custom CSS and JavaScript
            $table->text('custom_css')->nullable();
            $table->text('custom_js')->nullable();
            $table->text('custom_head')->nullable(); // For custom meta tags, etc.
            
            // Multi-brand support
            $table->boolean('is_active')->default(true);
            $table->string('brand_key')->unique()->nullable();
            $table->integer('sort_order')->default(0);
            
            // Domain and email configuration
            $table->string('custom_domain')->nullable();
            $table->json('email_config')->nullable(); // SMTP settings for branded emails
            $table->json('email_templates')->nullable(); // Custom email templates
            
            // Receipt and invoice customization
            $table->json('receipt_template')->nullable();
            $table->json('invoice_template')->nullable();
            $table->string('receipt_footer')->nullable();
            $table->string('receipt_header')->nullable();
            
            // Notification branding
            $table->json('notification_settings')->nullable();
            $table->string('sms_sender_id')->nullable();
            $table->string('whatsapp_business_number')->nullable();
            
            // Advanced settings
            $table->json('brand_guidelines')->nullable();
            $table->json('ui_customizations')->nullable();
            $table->json('feature_flags')->nullable();
            $table->boolean('enable_brand_preview')->default(true);
            
            // Metadata
            $table->json('metadata')->nullable(); // For additional custom fields
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('brand_settings', function (Blueprint $table) {
            // Drop all new columns
            $columns = [
                'tagline', 'description', 'contact_email', 'contact_phone', 'website_url',
                'login_logo_url', 'header_logo_url', 'receipt_logo_url', 'favicon_url', 
                'background_image_url', 'background_pattern', 'theme_mode', 'font_family', 
                'font_size', 'border_radius', 'sidebar_style', 'success_color', 'warning_color', 
                'error_color', 'info_color', 'gradient_start', 'gradient_end', 'gradient_direction',
                'industry_template', 'industry_config', 'custom_css', 'custom_js', 'custom_head',
                'is_active', 'brand_key', 'sort_order', 'custom_domain', 'email_config', 
                'email_templates', 'receipt_template', 'invoice_template', 'receipt_footer', 
                'receipt_header', 'notification_settings', 'sms_sender_id', 'whatsapp_business_number',
                'brand_guidelines', 'ui_customizations', 'feature_flags', 'enable_brand_preview', 'metadata'
            ];
            
            foreach ($columns as $column) {
                $table->dropColumn($column);
            }
        });
    }
};