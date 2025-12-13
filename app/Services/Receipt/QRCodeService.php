<?php

namespace App\Services\Receipt;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QRCodeService
{
    /**
     * Generate QR code for digital receipt
     *
     * @param string $url
     * @param array $options
     * @return array
     */
    public static function generateReceiptQR($url, $options = [])
    {
        $defaultOptions = [
            'size' => 200,
            'format' => 'png',
            'margin' => 2,
            'error_correction' => 'M',
            'color' => [0, 0, 0],
            'background_color' => [255, 255, 255]
        ];

        $options = array_merge($defaultOptions, $options);

        // Generate QR code
        $qrCode = QrCode::format($options['format'])
            ->size($options['size'])
            ->margin($options['margin'])
            ->errorCorrection($options['error_correction'])
            ->color($options['color'][0], $options['color'][1], $options['color'][2])
            ->backgroundColor($options['background_color'][0], $options['background_color'][1], $options['background_color'][2])
            ->generate($url);

        // Generate filename
        $filename = 'receipt_qr_' . Str::random(10) . '.' . $options['format'];
        $path = 'receipts/qrcodes/' . $filename;

        // Store QR code
        Storage::put('public/' . $path, $qrCode);

        return [
            'url' => Storage::url($path),
            'path' => $path,
            'filename' => $filename,
            'size' => $options['size'],
            'format' => $options['format']
        ];
    }

    /**
     * Generate QR code with logo
     *
     * @param string $url
     * @param string $logoPath
     * @param array $options
     * @return array
     */
    public static function generateReceiptQRWithLogo($url, $logoPath, $options = [])
    {
        $defaultOptions = [
            'size' => 300,
            'format' => 'png',
            'margin' => 2,
            'logo_size' => 60
        ];

        $options = array_merge($defaultOptions, $options);

        // Generate base QR code
        $qrCode = QrCode::format($options['format'])
            ->size($options['size'])
            ->margin($options['margin'])
            ->errorCorrection('H') // High error correction for logo
            ->generate($url);

        // Add logo to QR code (this would require image manipulation library)
        // For now, we'll return the basic QR code
        return self::generateReceiptQR($url, $options);
    }

    /**
     * Generate batch QR codes for multiple receipts
     *
     * @param array $receipts
     * @param array $options
     * @return array
     */
    public static function generateBatchQR($receipts, $options = [])
    {
        $qrCodes = [];

        foreach ($receipts as $receipt) {
            $url = $receipt['url'];
            $qrCode = self::generateReceiptQR($url, $options);
            $qrCodes[] = [
                'receipt_id' => $receipt['id'],
                'qr_code' => $qrCode
            ];
        }

        return $qrCodes;
    }

    /**
     * Generate QR code for WhatsApp sharing
     *
     * @param string $receiptUrl
     * @param string $message
     * @return array
     */
    public static function generateWhatsAppQR($receiptUrl, $message = 'Check out my receipt!')
    {
        $whatsappUrl = 'https://wa.me/?text=' . urlencode($message . ' ' . $receiptUrl);
        
        return self::generateReceiptQR($whatsappUrl, [
            'size' => 150,
            'format' => 'png'
        ]);
    }

    /**
     * Generate QR code for feedback
     *
     * @param int $orderId
     * @param string $baseUrl
     * @return array
     */
    public static function generateFeedbackQR($orderId, $baseUrl)
    {
        $feedbackUrl = $baseUrl . '/feedback/' . $orderId;
        
        return self::generateReceiptQR($feedbackUrl, [
            'size' => 180,
            'format' => 'png',
            'color' => [66, 133, 244] // Blue color for feedback
        ]);
    }

    /**
     * Generate QR code for loyalty program
     *
     * @param int $customerId
     * @param int $points
     * @param string $baseUrl
     * @return array
     */
    public static function generateLoyaltyQR($customerId, $points, $baseUrl)
    {
        $loyaltyUrl = $baseUrl . '/loyalty/' . $customerId . '?points=' . $points;
        
        return self::generateReceiptQR($loyaltyUrl, [
            'size' => 180,
            'format' => 'png',
            'color' => [76, 175, 80] // Green color for loyalty
        ]);
    }

    /**
     * Generate QR code for table payment
     *
     * @param int $tableId
     * @param int $orderId
     * @param string $baseUrl
     * @return array
     */
    public static function generateTablePaymentQR($tableId, $orderId, $baseUrl)
    {
        $paymentUrl = $baseUrl . '/pay/table/' . $tableId . '/order/' . $orderId;
        
        return self::generateReceiptQR($paymentUrl, [
            'size' => 200,
            'format' => 'png',
            'color' => [255, 152, 0] // Orange color for payment
        ]);
    }

    /**
     * Validate QR code token
     *
     * @param string $token
     * @return array|null
     */
    public static function validateToken($token)
    {
        $cacheKey = "receipt_token_{$token}";
        $data = cache($cacheKey);
        
        if (!$data) {
            return null;
        }
        
        // Check if token has expired
        if (now()->timestamp > $data['expires_at']) {
            cache()->forget($cacheKey);
            return null;
        }
        
        return $data;
    }

    /**
     * Generate QR code data URI for inline display
     *
     * @param string $url
     * @param array $options
     * @return string
     */
    public static function generateQRDataUri($url, $options = [])
    {
        $defaultOptions = [
            'size' => 150,
            'format' => 'png',
            'margin' => 1
        ];

        $options = array_merge($defaultOptions, $options);

        $qrCode = QrCode::format($options['format'])
            ->size($options['size'])
            ->margin($options['margin'])
            ->generate($url);

        return 'data:image/' . $options['format'] . ';base64,' . base64_encode($qrCode);
    }

    /**
     * Generate QR code for digital wallet
     *
     * @param array $receiptData
     * @param string $walletType
     * @return array
     */
    public static function generateDigitalWalletQR($receiptData, $walletType = 'apple')
    {
        $walletData = [
            'type' => $walletType,
            'receipt' => [
                'id' => $receiptData['order']->id,
                'amount' => $receiptData['order']->total_amount,
                'date' => $receiptData['order']->order_date,
                'merchant' => $receiptData['settings']['shop_name'] ?? 'Restaurant',
                'items' => $receiptData['order']->items->map(function($item) {
                    return [
                        'name' => $item->product->name,
                        'quantity' => $item->quantity,
                        'price' => $item->unit_price
                    ];
                })->toArray()
            ]
        ];

        $walletUrl = config('app.url') . '/wallet/add/' . $walletType . '?data=' . urlencode(json_encode($walletData));
        
        return self::generateReceiptQR($walletUrl, [
            'size' => 200,
            'format' => 'png'
        ]);
    }
}