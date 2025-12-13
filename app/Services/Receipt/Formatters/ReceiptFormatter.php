<?php

namespace App\Services\Receipt\Formatters;

use App\Services\Receipt\Templates\StandardReceiptTemplate;
use App\Services\Receipt\Templates\DetailedReceiptTemplate;
use App\Services\Receipt\Templates\ThermalReceiptTemplate;
use Dompdf\Dompdf;
use Dompdf\Options;
use Intervention\Image\Facades\Image;
use Illuminate\Support\Facades\Storage;

class ReceiptFormatter
{
    /**
     * Format receipt based on template and output type
     *
     * @param array $data
     * @param string $template (standard, detailed, thermal)
     * @param string $outputType (print, digital, pdf, image)
     * @return mixed
     */
    public static function format($data, $template = 'standard', $outputType = 'html')
    {
        // Generate receipt content based on template
        $content = self::generateTemplateContent($data, $template);
        
        // Format based on output type
        switch ($outputType) {
            case 'print':
                return self::formatForPrint($content, $template);
            case 'digital':
                return self::formatForDigital($content, $template);
            case 'pdf':
                return self::formatForPDF($content, $template);
            case 'image':
                return self::formatForImage($content, $template);
            case 'html':
            default:
                return $content;
        }
    }

    /**
     * Generate template content
     *
     * @param array $data
     * @param string $template
     * @return string
     */
    private static function generateTemplateContent($data, $template)
    {
        switch ($template) {
            case 'detailed':
                return DetailedReceiptTemplate::generate($data);
            case 'thermal':
                return ThermalReceiptTemplate::generate($data);
            case 'standard':
            default:
                return StandardReceiptTemplate::generate($data);
        }
    }

    /**
     * Format for printing
     *
     * @param string $content
     * @param string $template
     * @return array
     */
    private static function formatForPrint($content, $template)
    {
        if ($template === 'thermal') {
            // For thermal printers, return raw text
            return [
                'type' => 'thermal',
                'content' => $content,
                'printer_settings' => [
                    'font_size' => 'normal',
                    'alignment' => 'left',
                    'paper_width' => '48mm'
                ]
            ];
        } else {
            // For regular printers, return HTML with print styles
            return [
                'type' => 'html',
                'content' => self::addPrintStyles($content),
                'printer_settings' => [
                    'margin' => '10mm',
                    'paper_size' => 'auto'
                ]
            ];
        }
    }

    /**
     * Format for digital display
     *
     * @param string $content
     * @param string $template
     * @return array
     */
    private static function formatForDigital($content, $template)
    {
        return [
            'type' => 'digital',
            'content' => self::addDigitalStyles($content),
            'metadata' => [
                'template' => $template,
                'generated_at' => now()->toISOString(),
                'format' => 'responsive_html'
            ]
        ];
    }

    /**
     * Format for PDF
     *
     * @param string $content
     * @param string $template
     * @return string
     */
    private static function formatForPDF($content, $template)
    {
        // Configure DomPDF
        $options = new Options();
        $options->set('defaultFont', 'Arial');
        $options->set('isRemoteEnabled', true);
        $options->set('isHtml5ParserEnabled', true);
        
        // Create new DomPDF instance
        $dompdf = new Dompdf($options);
        
        // Add PDF-specific styles
        $pdfContent = self::addPDFStyles($content);
        
        // Load HTML to DomPDF
        $dompdf->loadHtml($pdfContent);
        
        // Set paper size and orientation
        if ($template === 'thermal') {
            $dompdf->setPaper([0, 0, 226.77, 800], 'portrait'); // 80mm width
        } else {
            $dompdf->setPaper('A4', 'portrait');
        }
        
        // Render the HTML as PDF
        $dompdf->render();
        
        // Generate filename
        $filename = 'receipt_' . date('Y-m-d_H-i-s') . '.pdf';
        
        // Store PDF
        $path = 'receipts/' . $filename;
        Storage::put('public/' . $path, $dompdf->output());
        
        return [
            'type' => 'pdf',
            'url' => Storage::url($path),
            'path' => $path,
            'filename' => $filename
        ];
    }

    /**
     * Format for image
     *
     * @param string $content
     * @param string $template
     * @return array
     */
    private static function formatForImage($content, $template)
    {
        // For thermal template, convert text to image
        if ($template === 'thermal') {
            return self::convertTextToImage($content);
        }
        
        // For HTML templates, convert HTML to image
        return self::convertHtmlToImage($content);
    }

    /**
     * Add print-specific styles
     *
     * @param string $content
     * @return string
     */
    private static function addPrintStyles($content)
    {
        $styles = '
        <style>
            @media print {
                body { margin: 0; padding: 10px; }
                .no-print { display: none !important; }
                @page { margin: 10mm; }
            }
            body { font-family: Arial, sans-serif; }
        </style>';
        
        // Insert styles at the beginning of content
        return preg_replace('/<div/', $styles . '<div', $content, 1);
    }

    /**
     * Add digital-specific styles
     *
     * @param string $content
     * @return string
     */
    private static function addDigitalStyles($content)
    {
        $styles = '
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 100%;
                margin: 0 auto;
                padding: 10px;
            }
            .receipt-container {
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                border-radius: 8px;
                overflow: hidden;
            }
            @media (max-width: 480px) {
                body { padding: 5px; }
                .receipt-container { box-shadow: none; border-radius: 0; }
            }
        </style>';
        
        // Wrap content in responsive container
        $content = '<div class="receipt-container">' . $content . '</div>';
        
        // Insert styles at the beginning
        return preg_replace('/<div/', $styles . '<div', $content, 1);
    }

    /**
     * Add PDF-specific styles
     *
     * @param string $content
     * @return string
     */
    private static function addPDFStyles($content)
    {
        $styles = '
        <style>
            body { 
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                color: #000;
            }
            .receipt-container {
                max-width: 100%;
                margin: 0 auto;
            }
            @page {
                margin: 20mm;
                @bottom-center {
                    content: "Page " counter(page);
                    font-size: 10px;
                    color: #666;
                }
            }
            h1, h2, h3 { page-break-after: avoid; }
            table { page-break-inside: avoid; }
            img { max-width: 100%; height: auto; }
        </style>';
        
        // Wrap content in container
        $content = '<div class="receipt-container">' . $content . '</div>';
        
        // Insert styles at the beginning
        return preg_replace('/<div/', $styles . '<div', $content, 1);
    }

    /**
     * Convert text to image (for thermal receipts)
     *
     * @param string $text
     * @return array
     */
    private static function convertTextToImage($text)
    {
        // Create image from text
        $lines = explode("\r\n", $text);
        $lineHeight = 20;
        $padding = 20;
        $imageWidth = 400;
        
        // Calculate image height
        $imageHeight = count($lines) * $lineHeight + ($padding * 2);
        
        // Create image
        $image = Image::canvas($imageWidth, $imageHeight, '#ffffff');
        
        // Add text to image
        $y = $padding + $lineHeight;
        foreach ($lines as $line) {
            $image->text($line, $padding, $y, function($font) {
                $font->file(public_path('fonts/arial.ttf'));
                $font->size(12);
                $font->color('#000000');
            });
            $y += $lineHeight;
        }
        
        // Generate filename
        $filename = 'receipt_' . date('Y-m-d_H-i-s') . '.png';
        $path = 'receipts/' . $filename;
        
        // Store image
        Storage::put('public/' . $path, $image->encode('png'));
        
        return [
            'type' => 'image',
            'url' => Storage::url($path),
            'path' => $path,
            'filename' => $filename,
            'format' => 'png'
        ];
    }

    /**
     * Convert HTML to image
     *
     * @param string $html
     * @return array
     */
    private static function convertHtmlToImage($html)
    {
        // This would typically use a library like Snappy or wkhtmltoimage
        // For now, we'll create a placeholder implementation
        
        $filename = 'receipt_' . date('Y-m-d_H-i-s') . '.jpg';
        $path = 'receipts/' . $filename;
        
        // Store placeholder image
        // In a real implementation, you would use a proper HTML to image conversion
        $image = Image::canvas(600, 800, '#ffffff');
        $image->text('Receipt Image', 300, 400, function($font) {
            $font->size(24);
            $font->color('#cccccc');
            $font->align('center');
        });
        
        Storage::put('public/' . $path, $image->encode('jpg'));
        
        return [
            'type' => 'image',
            'url' => Storage::url($path),
            'path' => $path,
            'filename' => $filename,
            'format' => 'jpg'
        ];
    }
}