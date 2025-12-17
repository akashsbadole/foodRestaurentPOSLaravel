<?php

namespace App\Services\Restaurant;

use App\Models\Restaurant\RestaurantPayment;
use App\Models\Restaurant\RestaurantOrder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class PaymentGatewayService
{
    /**
     * Process card payment
     */
    public function processCardPayment(RestaurantPayment $payment, array $cardDetails): array
    {
        try {
            // Validate card details
            $validation = $this->validateCardDetails($cardDetails);
            if (!$validation['valid']) {
                return [
                    'success' => false,
                    'message' => 'Invalid card details: ' . implode(', ', $validation['errors'])
                ];
            }

            // Get gateway configuration
            $gatewayConfig = $this->getGatewayConfig('card');
            
            // Prepare payment data
            $paymentData = [
                'amount' => $payment->total_amount * 100, // Convert to cents
                'currency' => $this->getCurrency($payment->store_id),
                'card' => [
                    'number' => $cardDetails['card_number'],
                    'expiry_month' => $cardDetails['expiry_month'],
                    'expiry_year' => $cardDetails['expiry_year'],
                    'cvv' => $cardDetails['cvv'],
                    'name' => $cardDetails['cardholder_name'] ?? null,
                ],
                'order_id' => $payment->payment_number,
                'description' => "Payment for order {$payment->order->order_number}",
                'metadata' => [
                    'order_id' => $payment->restaurant_order_id,
                    'store_id' => $payment->store_id,
                    'customer_id' => $payment->customer_id,
                ],
            ];

            // Make API call to payment gateway
            $response = $this->makeGatewayCall('card', 'charge', $paymentData, $gatewayConfig);
            
            if ($response['success']) {
                // Update payment with gateway details
                $payment->markAsProcessed(
                    auth()->id(),
                    [
                        'transaction_id' => $response['data']['transaction_id'],
                        'reference' => $response['data']['reference'],
                        'authorization_code' => $response['data']['authorization_code'],
                    ]
                );
                
                return [
                    'success' => true,
                    'message' => 'Card payment processed successfully',
                    'transaction_id' => $response['data']['transaction_id'],
                    'authorization_code' => $response['data']['authorization_code'],
                ];
            } else {
                $payment->markAsFailed($response['message']);
                
                return [
                    'success' => false,
                    'message' => $response['message'],
                    'error_code' => $response['error_code'] ?? null,
                ];
            }
        } catch (\Exception $e) {
            Log::error('Card payment processing failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            $payment->markAsFailed('Payment processing error: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => 'Payment processing failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process digital wallet payment
     */
    public function processDigitalWalletPayment(RestaurantPayment $payment, array $walletDetails): array
    {
        try {
            $walletType = $walletDetails['wallet_type']; // apple_pay, google_pay, etc.
            
            // Validate wallet details
            $validation = $this->validateWalletDetails($walletDetails);
            if (!$validation['valid']) {
                return [
                    'success' => false,
                    'message' => 'Invalid wallet details: ' . implode(', ', $validation['errors'])
                ];
            }

            // Get gateway configuration
            $gatewayConfig = $this->getGatewayConfig($walletType);
            
            // Prepare payment data
            $paymentData = [
                'amount' => $payment->total_amount * 100,
                'currency' => $this->getCurrency($payment->store_id),
                'wallet_token' => $walletDetails['wallet_token'],
                'wallet_type' => $walletType,
                'order_id' => $payment->payment_number,
                'description' => "Payment for order {$payment->order->order_number}",
                'metadata' => [
                    'order_id' => $payment->restaurant_order_id,
                    'store_id' => $payment->store_id,
                    'customer_id' => $payment->customer_id,
                ],
            ];

            // Make API call to payment gateway
            $response = $this->makeGatewayCall($walletType, 'charge', $paymentData, $gatewayConfig);
            
            if ($response['success']) {
                $payment->markAsProcessed(
                    auth()->id(),
                    [
                        'transaction_id' => $response['data']['transaction_id'],
                        'reference' => $response['data']['reference'],
                    ]
                );
                
                return [
                    'success' => true,
                    'message' => 'Wallet payment processed successfully',
                    'transaction_id' => $response['data']['transaction_id'],
                ];
            } else {
                $payment->markAsFailed($response['message']);
                
                return [
                    'success' => false,
                    'message' => $response['message'],
                    'error_code' => $response['error_code'] ?? null,
                ];
            }
        } catch (\Exception $e) {
            Log::error('Wallet payment processing failed', [
                'payment_id' => $payment->id,
                'wallet_type' => $walletDetails['wallet_type'] ?? 'unknown',
                'error' => $e->getMessage(),
            ]);
            
            $payment->markAsFailed('Payment processing error: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => 'Payment processing failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process bank transfer
     */
    public function processBankTransfer(RestaurantPayment $payment, array $transferDetails): array
    {
        try {
            // Generate transfer reference
            $transferReference = $this->generateTransferReference($payment);
            
            // Update payment with transfer details
            $payment->update([
                'payment_details' => [
                    'transfer_reference' => $transferReference,
                    'bank_name' => $transferDetails['bank_name'] ?? null,
                    'account_name' => $transferDetails['account_name'] ?? null,
                    'account_number' => $transferDetails['account_number'] ?? null,
                    'transfer_date' => $transferDetails['transfer_date'] ?? null,
                ],
                'gateway_reference' => $transferReference,
            ]);
            
            // Mark as pending verification
            $payment->status = 'processing';
            $payment->save();
            
            return [
                'success' => true,
                'message' => 'Bank transfer initiated successfully',
                'transfer_reference' => $transferReference,
                'bank_details' => $this->getBankDetails($payment->store_id),
            ];
        } catch (\Exception $e) {
            Log::error('Bank transfer processing failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
            
            $payment->markAsFailed('Transfer processing error: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => 'Transfer processing failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Verify bank transfer
     */
    public function verifyBankTransfer(RestaurantPayment $payment): array
    {
        try {
            // In a real implementation, this would check with the bank or payment provider
            // For now, we'll simulate verification
            
            if ($payment->status !== 'processing') {
                return [
                    'success' => false,
                    'message' => 'Payment is not in processing status'
                ];
            }
            
            // Simulate successful verification
            $payment->markAsProcessed(auth()->id(), [
                'transaction_id' => $payment->gateway_reference,
                'reference' => $payment->gateway_reference,
            ]);
            
            return [
                'success' => true,
                'message' => 'Bank transfer verified successfully',
            ];
        } catch (\Exception $e) {
            Log::error('Bank transfer verification failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Verification failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process refund
     */
    public function processRefund(RestaurantPayment $payment, float $refundAmount): array
    {
        try {
            if (!$payment->canBeRefunded($refundAmount)) {
                return [
                    'success' => false,
                    'message' => 'Payment cannot be refunded or refund amount is invalid'
                ];
            }
            
            // Get gateway configuration based on payment method
            $gatewayConfig = $this->getGatewayConfig($payment->payment_method);
            
            // Prepare refund data
            $refundData = [
                'original_transaction_id' => $payment->gateway_transaction_id,
                'amount' => $refundAmount * 100, // Convert to cents
                'currency' => $this->getCurrency($payment->store_id),
                'reason' => $payment->refund_reason ?? 'Customer refund',
            ];
            
            // Make API call to payment gateway
            $response = $this->makeGatewayCall($payment->payment_method, 'refund', $refundData, $gatewayConfig);
            
            if ($response['success']) {
                // Update payment with refund details
                $payment->update([
                    'refunded_amount' => $refundAmount,
                    'refund_transaction_id' => $response['data']['refund_transaction_id'],
                    'refunded_at' => now(),
                ]);
                
                // Update status if full refund
                if ($refundAmount >= $payment->total_amount) {
                    $payment->status = 'refunded';
                    $payment->save();
                }
                
                return [
                    'success' => true,
                    'message' => 'Refund processed successfully',
                    'refund_transaction_id' => $response['data']['refund_transaction_id'],
                    'refund_amount' => $refundAmount,
                ];
            } else {
                return [
                    'success' => false,
                    'message' => 'Refund failed: ' . $response['message'],
                    'error_code' => $response['error_code'] ?? null,
                ];
            }
        } catch (\Exception $e) {
            Log::error('Refund processing failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Refund processing failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Validate card details
     */
    private function validateCardDetails(array $cardDetails): array
    {
        $errors = [];
        
        // Card number validation
        if (empty($cardDetails['card_number'])) {
            $errors[] = 'Card number is required';
        } elseif (!$this->isValidCardNumber($cardDetails['card_number'])) {
            $errors[] = 'Invalid card number';
        }
        
        // Expiry validation
        if (empty($cardDetails['expiry_month']) || empty($cardDetails['expiry_year'])) {
            $errors[] = 'Expiry date is required';
        } elseif (!$this->isValidExpiry($cardDetails['expiry_month'], $cardDetails['expiry_year'])) {
            $errors[] = 'Card has expired or invalid expiry date';
        }
        
        // CVV validation
        if (empty($cardDetails['cvv'])) {
            $errors[] = 'CVV is required';
        } elseif (!$this->isValidCVV($cardDetails['cvv'])) {
            $errors[] = 'Invalid CVV';
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Validate wallet details
     */
    private function validateWalletDetails(array $walletDetails): array
    {
        $errors = [];
        
        if (empty($walletDetails['wallet_type'])) {
            $errors[] = 'Wallet type is required';
        }
        
        if (empty($walletDetails['wallet_token'])) {
            $errors[] = 'Wallet token is required';
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Check if card number is valid
     */
    private function isValidCardNumber(string $cardNumber): bool
    {
        // Remove spaces and dashes
        $cardNumber = preg_replace('/[\s-]/', '', $cardNumber);
        
        // Check if it's numeric and has valid length
        if (!is_numeric($cardNumber) || strlen($cardNumber) < 13 || strlen($cardNumber) > 19) {
            return false;
        }
        
        // Luhn algorithm
        $sum = 0;
        $alternate = false;
        
        for ($i = strlen($cardNumber) - 1; $i >= 0; $i--) {
            $digit = intval($cardNumber[$i]);
            
            if ($alternate) {
                $digit *= 2;
                if ($digit > 9) {
                    $digit = ($digit % 10) + 1;
                }
            }
            
            $sum += $digit;
            $alternate = !$alternate;
        }
        
        return ($sum % 10) === 0;
    }

    /**
     * Check if expiry date is valid
     */
    private function isValidExpiry(string $month, string $year): bool
    {
        $month = intval($month);
        $year = intval($year);
        
        if ($month < 1 || $month > 12) {
            return false;
        }
        
        $currentYear = intval(date('Y'));
        $currentMonth = intval(date('m'));
        
        if ($year < $currentYear || ($year == $currentYear && $month < $currentMonth)) {
            return false;
        }
        
        return true;
    }

    /**
     * Check if CVV is valid
     */
    private function isValidCVV(string $cvv): bool
    {
        return is_numeric($cvv) && (strlen($cvv) === 3 || strlen($cvv) === 4);
    }

    /**
     * Get gateway configuration
     */
    private function getGatewayConfig(string $paymentMethod): array
    {
        // In a real implementation, this would come from database or config files
        $configs = [
            'card' => [
                'endpoint' => 'https://api.payment-gateway.com/v1/charges',
                'api_key' => env('CARD_GATEWAY_API_KEY'),
                'secret' => env('CARD_GATEWAY_SECRET'),
            ],
            'apple_pay' => [
                'endpoint' => 'https://api.payment-gateway.com/v1/apple-pay',
                'api_key' => env('APPLE_PAY_GATEWAY_API_KEY'),
                'secret' => env('APPLE_PAY_GATEWAY_SECRET'),
            ],
            'google_pay' => [
                'endpoint' => 'https://api.payment-gateway.com/v1/google-pay',
                'api_key' => env('GOOGLE_PAY_GATEWAY_API_KEY'),
                'secret' => env('GOOGLE_PAY_GATEWAY_SECRET'),
            ],
        ];
        
        return $configs[$paymentMethod] ?? [];
    }

    /**
     * Make API call to payment gateway
     */
    private function makeGatewayCall(string $method, string $action, array $data, array $config): array
    {
        try {
            $endpoint = $config['endpoint'];
            $headers = [
                'Authorization' => 'Bearer ' . $config['api_key'],
                'Content-Type' => 'application/json',
            ];
            
            $response = Http::withHeaders($headers)
                ->timeout(30)
                ->post($endpoint, $data);
            
            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                ];
            } else {
                return [
                    'success' => false,
                    'message' => $response->json()['message'] ?? 'Payment gateway error',
                    'error_code' => $response->json()['error_code'] ?? null,
                ];
            }
        } catch (\Exception $e) {
            Log::error('Payment gateway API call failed', [
                'method' => $method,
                'action' => $action,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Payment gateway communication failed',
            ];
        }
    }

    /**
     * Generate transfer reference
     */
    private function generateTransferReference(RestaurantPayment $payment): string
    {
        return 'TRF' . $payment->store_id . date('YmdHis') . str_pad($payment->id, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Get bank details for transfer
     */
    private function getBankDetails(int $storeId): array
    {
        // In a real implementation, this would come from store configuration
        return [
            'bank_name' => 'Example Bank',
            'account_name' => 'Restaurant Account',
            'account_number' => '1234567890',
            'routing_number' => '987654321',
            'swift_code' => 'EXMPUS33',
        ];
    }

    /**
     * Get currency for store
     */
    private function getCurrency(int $storeId): string
    {
        return Cache::remember("store_currency_{$storeId}", 3600, function() use ($storeId) {
            $store = \App\Models\Store::find($storeId);
            return $store->currency ?? 'USD';
        });
    }

    /**
     * Handle payment webhook
     */
    public function handleWebhook(string $gateway, array $payload): array
    {
        try {
            // Verify webhook signature
            if (!$this->verifyWebhookSignature($gateway, $payload)) {
                return [
                    'success' => false,
                    'message' => 'Invalid webhook signature'
                ];
            }
            
            $eventType = $payload['event_type'] ?? null;
            $transactionId = $payload['transaction_id'] ?? null;
            
            if (!$eventType || !$transactionId) {
                return [
                    'success' => false,
                    'message' => 'Invalid webhook payload'
                ];
            }
            
            // Find payment by transaction ID
            $payment = RestaurantPayment::where('gateway_transaction_id', $transactionId)->first();
            
            if (!$payment) {
                return [
                    'success' => false,
                    'message' => 'Payment not found'
                ];
            }
            
            switch ($eventType) {
                case 'payment.succeeded':
                    $payment->markAsProcessed(auth()->id(), [
                        'transaction_id' => $transactionId,
                        'reference' => $payload['reference'] ?? null,
                    ]);
                    break;
                    
                case 'payment.failed':
                    $payment->markAsFailed($payload['failure_reason'] ?? 'Payment failed');
                    break;
                    
                case 'refund.succeeded':
                    $payment->update([
                        'refunded_amount' => $payload['refund_amount'] / 100,
                        'refund_transaction_id' => $payload['refund_transaction_id'],
                        'refunded_at' => now(),
                    ]);
                    
                    if ($payment->refunded_amount >= $payment->total_amount) {
                        $payment->status = 'refunded';
                        $payment->save();
                    }
                    break;
            }
            
            return [
                'success' => true,
                'message' => 'Webhook processed successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Webhook processing failed', [
                'gateway' => $gateway,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Webhook processing failed'
            ];
        }
    }

    /**
     * Verify webhook signature
     */
    private function verifyWebhookSignature(string $gateway, array $payload): bool
    {
        // In a real implementation, this would verify the webhook signature
        // based on the gateway's requirements
        return true;
    }
}