<?php

namespace App\Services;

use App\Models\BrandSetting;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Str;

class BrandEmailService
{
    protected $brand;
    protected $emailConfig;

    public function __construct(BrandSetting $brand = null)
    {
        $this->brand = $brand ?: BrandSetting::getCurrent();
        $this->emailConfig = $this->brand->email_config ?? [];
    }

    /**
     * Send branded email
     */
    public function sendEmail($to, $subject, $template, $data = [], $attachments = [])
    {
        // Configure mail settings for this brand
        $this->configureMailSettings();

        // Prepare branded email content
        $brandedData = $this->prepareBrandedData($data);

        // Render email template with brand styling
        $htmlContent = $this->renderBrandedTemplate($template, $brandedData);

        // Send email
        try {
            Mail::html($htmlContent, function ($message) use ($to, $subject, $attachments) {
                $message->to($to)
                    ->subject($this->brandSubject($subject))
                    ->from($this->getFromEmail(), $this->getFromName());

                // Add attachments
                foreach ($attachments as $attachment) {
                    $message->attach($attachment['path'], [
                        'as' => $attachment['name'] ?? basename($attachment['path']),
                        'mime' => $attachment['mime'] ?? null,
                    ]);
                }

                // Add custom headers
                $message->getHeaders()->addTextHeader('X-Brand-Key', $this->brand->brand_key);
                $message->getHeaders()->addTextHeader('X-Brand-Name', $this->brand->app_name);
            });

            return true;
        } catch (\Exception $e) {
            \Log::error('Brand email send failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Configure mail settings for the brand
     */
    protected function configureMailSettings()
    {
        if (!empty($this->emailConfig)) {
            config([
                'mail.mailers.brand' => [
                    'transport' => 'smtp',
                    'host' => $this->emailConfig['host'] ?? config('mail.mailers.smtp.host'),
                    'port' => $this->emailConfig['port'] ?? config('mail.mailers.smtp.port'),
                    'encryption' => $this->emailConfig['encryption'] ?? config('mail.mailers.smtp.encryption'),
                    'username' => $this->emailConfig['username'] ?? config('mail.mailers.smtp.username'),
                    'password' => $this->emailConfig['password'] ?? config('mail.mailers.smtp.password'),
                    'timeout' => $this->emailConfig['timeout'] ?? null,
                    'auth_mode' => $this->emailConfig['auth_mode'] ?? null,
                ],
            ]);

            config(['mail.default' => 'brand']);
        }
    }

    /**
     * Prepare branded data for email template
     */
    protected function prepareBrandedData($data)
    {
        $brandData = [
            'brand_name' => $this->brand->app_name,
            'brand_logo' => $this->brand->logo_url,
            'brand_primary_color' => $this->brand->primary_color,
            'brand_secondary_color' => $this->brand->secondary_color,
            'brand_accent_color' => $this->brand->accent_color,
            'brand_font_family' => $this->brand->font_family,
            'brand_contact_email' => $this->brand->contact_email,
            'brand_contact_phone' => $this->brand->contact_phone,
            'brand_website' => $this->brand->website_url,
            'brand_tagline' => $this->brand->tagline,
        ];

        return array_merge($data, $brandData);
    }

    /**
     * Render branded email template
     */
    protected function renderBrandedTemplate($template, $data)
    {
        // Check if brand has custom template
        $brandTemplates = $this->brand->email_templates ?? [];
        $customTemplate = $brandTemplates[$template] ?? null;

        if ($customTemplate) {
            // Use custom template
            return $this->renderCustomTemplate($customTemplate, $data);
        }

        // Use default template with brand styling
        $templatePath = "emails.{$template}";
        
        // Wrap with brand layout
        $brandLayout = View::make('emails.brand-layout', $data)->render();
        $content = View::make($templatePath, $data)->render();

        return str_replace('{{{ content }}}', $content, $brandLayout);
    }

    /**
     * Render custom template
     */
    protected function renderCustomTemplate($template, $data)
    {
        // Replace placeholders in custom template
        $content = $template;

        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $content = str_replace("{{ {$key} }}", $value, $content);
                $content = str_replace("{{{$key}}}", $value, $content);
            }
        }

        return $content;
    }

    /**
     * Get branded subject
     */
    protected function brandSubject($subject)
    {
        $prefix = $this->brand->app_name;
        
        return empty($prefix) ? $subject : "[{$prefix}] {$subject}";
    }

    /**
     * Get from email
     */
    protected function getFromEmail()
    {
        return $this->emailConfig['from_email'] ?? 
               $this->brand->contact_email ?? 
               config('mail.from.address');
    }

    /**
     * Get from name
     */
    protected function getFromName()
    {
        return $this->emailConfig['from_name'] ?? 
               $this->brand->app_name ?? 
               config('mail.from.name');
    }

    /**
     * Send receipt email
     */
    public function sendReceipt($to, $receiptData)
    {
        return $this->sendEmail($to, 'Your Receipt', 'receipt', $receiptData);
    }

    /**
     * Send invoice email
     */
    public function sendInvoice($to, $invoiceData)
    {
        return $this->sendEmail($to, 'Your Invoice', 'invoice', $invoiceData);
    }

    /**
     * Send reservation confirmation
     */
    public function sendReservationConfirmation($to, $reservationData)
    {
        return $this->sendEmail($to, 'Reservation Confirmed', 'reservation-confirmation', $reservationData);
    }

    /**
     * Send order confirmation
     */
    public function sendOrderConfirmation($to, $orderData)
    {
        return $this->sendEmail($to, 'Order Confirmed', 'order-confirmation', $orderData);
    }

    /**
     * Send welcome email
     */
    public function sendWelcome($to, $userData)
    {
        return $this->sendEmail($to, 'Welcome!', 'welcome', $userData);
    }

    /**
     * Send password reset
     */
    public function sendPasswordReset($to, $resetData)
    {
        return $this->sendEmail($to, 'Password Reset Request', 'password-reset', $resetData);
    }

    /**
     * Generate branded receipt HTML
     */
    public function generateReceiptHtml($receiptData)
    {
        $brandedData = $this->prepareBrandedData($receiptData);
        
        // Use brand's receipt template if available
        $receiptTemplate = $this->brand->receipt_template ?? [];
        
        if (!empty($receiptTemplate)) {
            return $this->renderCustomTemplate($receiptTemplate['html'] ?? '', $brandedData);
        }

        // Use default branded receipt template
        return View::make('emails.receipt-branded', $brandedData)->render();
    }

    /**
     * Generate branded invoice HTML
     */
    public function generateInvoiceHtml($invoiceData)
    {
        $brandedData = $this->prepareBrandedData($invoiceData);
        
        // Use brand's invoice template if available
        $invoiceTemplate = $this->brand->invoice_template ?? [];
        
        if (!empty($invoiceTemplate)) {
            return $this->renderCustomTemplate($invoiceTemplate['html'] ?? '', $brandedData);
        }

        // Use default branded invoice template
        return View::make('emails.invoice-branded', $brandedData)->render();
    }

    /**
     * Get email preview
     */
    public function getEmailPreview($template, $data = [])
    {
        $brandedData = $this->prepareBrandedData($data);
        return $this->renderBrandedTemplate($template, $brandedData);
    }
}