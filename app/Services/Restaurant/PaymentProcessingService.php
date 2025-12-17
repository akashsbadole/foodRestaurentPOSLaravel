<?php

namespace App\Services\Restaurant;

use App\Models\Restaurant\RestaurantPayment;
use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantInvoice;
use App\Services\Restaurant\PaymentGatewayService;
use App\Services\Restaurant\BillingIntegrationService;
use App\Services\Restaurant\PaymentInventoryService;
use App\Services\Restaurant\PaymentReportingService;
use App\Services\Restaurant\PaymentRealTimeService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class PaymentProcessingService
{
    protected $paymentGatewayService;
    protected $billingIntegrationService;
    protected $paymentInventoryService;
    protected $paymentReportingService;
    protected $paymentRealTimeService;

    public function __construct(
        PaymentGatewayService $paymentGatewayService,
        BillingIntegrationService $billingIntegrationService,
        PaymentInventoryService $paymentInventoryService,
        PaymentReportingService $paymentReportingService,
        PaymentRealTimeService $paymentRealTimeService
    ) {
        $this->paymentGatewayService = $paymentGatewayService;
        $this->billingIntegrationService = $billingIntegrationService;
        $this->paymentInventoryService = $paymentInventoryService;
        $this->paymentReportingService = $paymentReportingService;
        $this->paymentRealTimeService = $paymentRealTimeService;
    }

    /**
     * Process payment for an order
     */
    public function processPayment(RestaurantOrder $order, array $paymentData): array
    {
        try {
            // Validate order can be paid
            if (!$this->canOrderBePaid($order)) {
                return [
                    'success' => false,
                    'message' => 'Order cannot be paid in current status: ' . $order->status
                ];
            }

            // Validate payment data
            $validation = $this->validatePaymentData($paymentData, $order);
            if (!$validation['valid']) {
                return [
                    'success' => false,
                    'message' => 'Invalid payment data: ' . implode(', ', $validation['errors'])
                ];
            }

            // Check if payment amount is valid
            $amountValidation = $this->validatePaymentAmount($paymentData['amount'], $order);
            if (!$amountValidation['valid']) {
                return $amountValidation;
            }

            return DB::transaction(function() use ($order, $paymentData) {
                // Create payment record
                $payment = RestaurantPayment::createFromOrder($order, $paymentData);

                // Process payment based on method
                $processResult = $this->processPaymentByMethod($payment, $paymentData);

                if (!$processResult['success']) {
                    throw new \Exception($processResult['message']);
                }

                // Update order payment status
                $this->updateOrderPaymentStatus($order);

                // Create sale record if payment is successful
                if ($payment->status === 'completed') {
                    $this->createSaleFromOrder($order, $payment);
                }

                // Update inventory on successful payment
                if ($payment->status === 'completed') {
                    $this->paymentInventoryService->updateInventoryOnPayment($order, $payment);
                    
                    // Update sales reports
                    $this->paymentReportingService->updateSalesReportsOnPayment($order, $payment);
                }

                // Trigger real-time updates
                $this->paymentRealTimeService->triggerPaymentStatusUpdate($payment, 'payment_processed');

                return [
                    'success' => true,
                    'message' => 'Payment processed successfully',
                    'payment' => $payment,
                    'order' => $order->fresh(),
                ];
            });
        } catch (\Exception $e) {
            Log::error('Payment processing failed', [
                'order_id' => $order->id,
                'payment_data' => $paymentData,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => 'Payment processing failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process split payments
     */
    public function processSplitPayments(RestaurantOrder $order, array $splitPayments): array
    {
        try {
            // Validate order can be paid
            if (!$this->canOrderBePaid($order)) {
                return [
                    'success' => false,
                    'message' => 'Order cannot be paid in current status: ' . $order->status
                ];
            }

            // Validate split payments
            $validation = $this->validateSplitPayments($splitPayments, $order);
            if (!$validation['valid']) {
                return [
                    'success' => false,
                    'message' => 'Invalid split payments: ' . implode(', ', $validation['errors'])
                ];
            }

            return DB::transaction(function() use ($order, $splitPayments) {
                $payments = [];
                $totalProcessed = 0;

                foreach ($splitPayments as $index => $paymentData) {
                    $paymentData['payment_type'] = 'split';
                    $paymentData['split_number'] = $index + 1;
                    $paymentData['total_splits'] = count($splitPayments);

                    // Process individual payment
                    $result = $this->processPayment($order, $paymentData);

                    if (!$result['success']) {
                        throw new \Exception("Split payment " . ($index + 1) . " failed: " . $result['message']);
                    }

                    $payments[] = $result['payment'];
                    $totalProcessed += $result['payment']->amount;
                }

                // Update order status if fully paid
                if ($totalProcessed >= $order->final_total) {
                    $order->update([
                        'payment_status' => 'paid',
                        'billing_status' => 'paid',
                    ]);
                }

                return [
                    'success' => true,
                    'message' => 'Split payments processed successfully',
                    'payments' => $payments,
                    'order' => $order->fresh(),
                ];
            });
        } catch (\Exception $e) {
            Log::error('Split payment processing failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Split payment processing failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process refund
     */
    public function processRefund(RestaurantPayment $payment, float $refundAmount, string $reason): array
    {
        try {
            // Validate refund
            $validation = $this->validateRefund($payment, $refundAmount);
            if (!$validation['valid']) {
                return [
                    'success' => false,
                    'message' => 'Invalid refund: ' . implode(', ', $validation['errors'])
                ];
            }

            return DB::transaction(function() use ($payment, $refundAmount, $reason) {
                // Process refund through gateway if applicable
                if (in_array($payment->payment_method, ['card', 'digital_wallet'])) {
                    $gatewayResult = $this->paymentGatewayService->processRefund($payment, $refundAmount);
                    
                    if (!$gatewayResult['success']) {
                        return $gatewayResult;
                    }
                }

                // Update payment record
                $payment->processRefund($refundAmount, $reason);

                // Update order payment status
                $order = $payment->order;
                $this->updateOrderPaymentStatus($order);

                // Handle inventory reversal for full refunds
                if ($refundAmount >= $payment->total_amount) {
                    $this->handleInventoryReversal($order);
                }

                // Trigger real-time updates
                $this->triggerRealTimeUpdates($order, $payment, 'refund');

                return [
                    'success' => true,
                    'message' => 'Refund processed successfully',
                    'refund_amount' => $refundAmount,
                    'payment' => $payment->fresh(),
                ];
            });
        } catch (\Exception $e) {
            Log::error('Refund processing failed', [
                'payment_id' => $payment->id,
                'refund_amount' => $refundAmount,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Refund processing failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Void payment
     */
    public function voidPayment(RestaurantPayment $payment, string $reason): array
    {
        try {
            // Validate void
            if (!$payment->canBeVoided()) {
                return [
                    'success' => false,
                    'message' => 'Payment cannot be voided in current status: ' . $payment->status
                ];
            }

            return DB::transaction(function() use ($payment, $reason) {
                // Void payment
                $payment->voidPayment($reason);

                // Update order payment status
                $order = $payment->order;
                $this->updateOrderPaymentStatus($order);

                // Trigger real-time updates
                $this->triggerRealTimeUpdates($order, $payment, 'void');

                return [
                    'success' => true,
                    'message' => 'Payment voided successfully',
                    'payment' => $payment->fresh(),
                ];
            });
        } catch (\Exception $e) {
            Log::error('Payment void failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Payment void failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process payment by method
     */
    private function processPaymentByMethod(RestaurantPayment $payment, array $paymentData): array
    {
        switch ($payment->payment_method) {
            case 'cash':
                return $this->processCashPayment($payment, $paymentData);
            
            case 'card':
                return $this->paymentGatewayService->processCardPayment($payment, $paymentData['payment_details']);
            
            case 'digital_wallet':
                return $this->paymentGatewayService->processDigitalWalletPayment($payment, $paymentData['payment_details']);
            
            case 'bank_transfer':
                return $this->paymentGatewayService->processBankTransfer($payment, $paymentData['payment_details']);
            
            case 'check':
                return $this->processCheckPayment($payment, $paymentData);
            
            case 'voucher':
                return $this->processVoucherPayment($payment, $paymentData);
            
            case 'loyalty_points':
                return $this->processLoyaltyPointsPayment($payment, $paymentData);
            
            case 'complimentary':
                return $this->processComplimentaryPayment($payment, $paymentData);
            
            default:
                return [
                    'success' => false,
                    'message' => 'Unsupported payment method: ' . $payment->payment_method
                ];
        }
    }

    /**
     * Process cash payment
     */
    private function processCashPayment(RestaurantPayment $payment, array $paymentData): array
    {
        try {
            // Calculate change if provided
            $cashReceived = $paymentData['cash_received'] ?? $payment->total_amount;
            $changeAmount = max(0, $cashReceived - $payment->total_amount);

            // Update payment with cash details
            $payment->update([
                'payment_details' => [
                    'cash_received' => $cashReceived,
                    'change_amount' => $changeAmount,
                ],
            ]);

            // Mark as processed
            $payment->markAsProcessed(auth()->id());

            return [
                'success' => true,
                'message' => 'Cash payment processed successfully',
                'change_amount' => $changeAmount,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Cash payment processing failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process check payment
     */
    private function processCheckPayment(RestaurantPayment $payment, array $paymentData): array
    {
        try {
            // Validate check details
            $checkDetails = $paymentData['payment_details'];
            
            if (empty($checkDetails['check_number']) || empty($checkDetails['bank_name'])) {
                return [
                    'success' => false,
                    'message' => 'Check number and bank name are required'
                ];
            }

            // Update payment with check details
            $payment->update([
                'payment_details' => $checkDetails,
                'gateway_reference' => $checkDetails['check_number'],
            ]);

            // Mark as processed (check verification would happen later)
            $payment->markAsProcessed(auth()->id());

            return [
                'success' => true,
                'message' => 'Check payment processed successfully',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Check payment processing failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process voucher payment
     */
    private function processVoucherPayment(RestaurantPayment $payment, array $paymentData): array
    {
        try {
            $voucherDetails = $paymentData['payment_details'];
            
            // Validate voucher
            $validation = $this->validateVoucher($voucherDetails, $payment);
            if (!$validation['valid']) {
                return [
                    'success' => false,
                    'message' => 'Invalid voucher: ' . implode(', ', $validation['errors'])
                ];
            }

            // Update payment with voucher details
            $payment->update([
                'payment_details' => $voucherDetails,
                'gateway_reference' => $voucherDetails['voucher_code'],
            ]);

            // Mark voucher as used
            $this->markVoucherAsUsed($voucherDetails['voucher_code']);

            // Mark as processed
            $payment->markAsProcessed(auth()->id());

            return [
                'success' => true,
                'message' => 'Voucher payment processed successfully',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Voucher payment processing failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process loyalty points payment
     */
    private function processLoyaltyPointsPayment(RestaurantPayment $payment, array $paymentData): array
    {
        try {
            $loyaltyDetails = $paymentData['payment_details'];
            
            // Validate loyalty points
            $validation = $this->validateLoyaltyPoints($loyaltyDetails, $payment);
            if (!$validation['valid']) {
                return [
                    'success' => false,
                    'message' => 'Invalid loyalty points: ' . implode(', ', $validation['errors'])
                ];
            }

            // Update payment with loyalty details
            $payment->update([
                'payment_details' => $loyaltyDetails,
                'gateway_reference' => 'LOYALTY_' . $payment->id,
            ]);

            // Deduct loyalty points
            $this->deductLoyaltyPoints($loyaltyDetails['customer_id'], $loyaltyDetails['points_used']);

            // Mark as processed
            $payment->markAsProcessed(auth()->id());

            return [
                'success' => true,
                'message' => 'Loyalty points payment processed successfully',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Loyalty points payment processing failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process complimentary payment
     */
    private function processComplimentaryPayment(RestaurantPayment $payment, array $paymentData): array
    {
        try {
            $complimentaryDetails = $paymentData['payment_details'];
            
            // Validate complimentary authorization
            $validation = $this->validateComplimentaryAuthorization($complimentaryDetails);
            if (!$validation['valid']) {
                return [
                    'success' => false,
                    'message' => 'Invalid complimentary authorization: ' . implode(', ', $validation['errors'])
                ];
            }

            // Update payment with complimentary details
            $payment->update([
                'payment_details' => $complimentaryDetails,
                'gateway_reference' => 'COMP_' . $payment->id,
            ]);

            // Mark as processed
            $payment->markAsProcessed(auth()->id());

            return [
                'success' => true,
                'message' => 'Complimentary payment processed successfully',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Complimentary payment processing failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Validate payment data
     */
    private function validatePaymentData(array $paymentData, RestaurantOrder $order): array
    {
        $validator = Validator::make($paymentData, [
            'payment_method' => 'required|in:' . implode(',', array_keys(RestaurantPayment::PAYMENT_METHODS)),
            'amount' => 'required|numeric|min:0.01',
            'tip_amount' => 'nullable|numeric|min:0',
            'payment_details' => 'nullable|array',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return [
                'valid' => false,
                'errors' => $validator->errors()->all()
            ];
        }

        return ['valid' => true];
    }

    /**
     * Validate payment amount
     */
    private function validatePaymentAmount(float $amount, RestaurantOrder $order): array
    {
        $currentPaid = $order->payments()->where('status', 'completed')->sum('total_amount');
        $remainingAmount = $order->final_total - $currentPaid;

        if ($amount > $remainingAmount + 0.01) { // Small tolerance for rounding
            return [
                'success' => false,
                'message' => "Payment amount ({$amount}) exceeds remaining amount ({$remainingAmount})"
            ];
        }

        return ['success' => true];
    }

    /**
     * Validate split payments
     */
    private function validateSplitPayments(array $splitPayments, RestaurantOrder $order): array
    {
        $errors = [];
        $totalAmount = 0;

        foreach ($splitPayments as $index => $paymentData) {
            $validation = $this->validatePaymentData($paymentData, $order);
            if (!$validation['valid']) {
                $errors[] = "Split " . ($index + 1) . ": " . implode(', ', $validation['errors']);
            }

            $totalAmount += $paymentData['amount'];
        }

        $totalDiff = abs($totalAmount - $order->final_total);
        if ($totalDiff > 0.01) { // Small tolerance for rounding
            $errors[] = "Split payments total ({$totalAmount}) doesn't match order total ({$order->final_total})";
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Validate refund
     */
    private function validateRefund(RestaurantPayment $payment, float $refundAmount): array
    {
        $errors = [];

        if (!$payment->canBeRefunded($refundAmount)) {
            $errors[] = 'Payment cannot be refunded or refund amount is invalid';
        }

        if ($refundAmount <= 0) {
            $errors[] = 'Refund amount must be greater than 0';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Validate voucher
     */
    private function validateVoucher(array $voucherDetails, RestaurantPayment $payment): array
    {
        $errors = [];

        if (empty($voucherDetails['voucher_code'])) {
            $errors[] = 'Voucher code is required';
        }

        // In a real implementation, this would check against a vouchers table
        // For now, we'll do basic validation
        if ($voucherDetails['voucher_amount'] < $payment->total_amount) {
            $errors[] = 'Voucher amount is insufficient';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Validate loyalty points
     */
    private function validateLoyaltyPoints(array $loyaltyDetails, RestaurantPayment $payment): array
    {
        $errors = [];

        if (empty($loyaltyDetails['customer_id'])) {
            $errors[] = 'Customer ID is required for loyalty points payment';
        }

        if (empty($loyaltyDetails['points_used'])) {
            $errors[] = 'Points used is required';
        }

        // In a real implementation, this would check customer's loyalty balance
        // For now, we'll do basic validation
        if ($loyaltyDetails['points_value'] < $payment->total_amount) {
            $errors[] = 'Loyalty points value is insufficient';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Validate complimentary authorization
     */
    private function validateComplimentaryAuthorization(array $complimentaryDetails): array
    {
        $errors = [];

        if (empty($complimentaryDetails['authorized_by'])) {
            $errors[] = 'Authorization by is required for complimentary payment';
        }

        if (empty($complimentaryDetails['reason'])) {
            $errors[] = 'Reason is required for complimentary payment';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }

    /**
     * Check if order can be paid
     */
    private function canOrderBePaid(RestaurantOrder $order): bool
    {
        return in_array($order->status, ['served', 'completed']);
    }

    /**
     * Update order payment status
     */
    private function updateOrderPaymentStatus(RestaurantOrder $order): void
    {
        $payments = $order->payments;
        $totalPaid = $payments->where('status', 'completed')->sum('total_amount');
        $totalRefunded = $payments->where('status', 'refunded')->sum('refunded_amount');
        $finalTotal = $order->final_total;

        $netPaid = $totalPaid - $totalRefunded;

        if ($netPaid >= $finalTotal) {
            $order->payment_status = 'paid';
            $order->billing_status = 'paid';
        } elseif ($netPaid > 0) {
            $order->payment_status = 'partial';
            $order->billing_status = 'partial';
        } else {
            $order->payment_status = 'pending';
            $order->billing_status = 'pending';
        }

        $order->save();

        // Update table status if order is fully paid
        if ($order->payment_status === 'paid' && $order->table) {
            $order->table->markAsAvailable();
        }
    }

    /**
     * Create sale from order
     */
    private function createSaleFromOrder(RestaurantOrder $order, RestaurantPayment $payment): void
    {
        if ($order->sale_id) {
            return; // Sale already exists
        }

        $sale = $this->billingIntegrationService->createSaleFromOrder($order, [
            'payment_status' => 'paid',
            'payment_method' => $payment->payment_method,
            'paid_amount' => $payment->total_amount,
        ]);

        // Update payment with sale reference
        $payment->update(['sale_id' => $sale->id]);

        // Sync inventory
        $this->billingIntegrationService->syncInventoryForOrder($order);
    }

    /**
     * Handle inventory reversal
     */
    private function handleInventoryReversal(RestaurantOrder $order): void
    {
        $this->billingIntegrationService->reverseInventoryForOrder($order);
    }

    /**
     * Mark voucher as used
     */
    private function markVoucherAsUsed(string $voucherCode): void
    {
        // In a real implementation, this would update the vouchers table
        Log::info('Voucher marked as used', ['voucher_code' => $voucherCode]);
    }

    /**
     * Deduct loyalty points
     */
    private function deductLoyaltyPoints(int $customerId, int $pointsUsed): void
    {
        // In a real implementation, this would update the customer's loyalty balance
        Log::info('Loyalty points deducted', [
            'customer_id' => $customerId,
            'points_used' => $pointsUsed
        ]);
    }

    /**
     * Trigger real-time updates
     */
    private function triggerRealTimeUpdates(RestaurantOrder $order, RestaurantPayment $payment, string $action = 'payment'): void
    {
        // This would trigger WebSocket events or push notifications
        Log::info('Real-time update triggered', [
            'action' => $action,
            'order_id' => $order->id,
            'payment_id' => $payment->id,
            'payment_status' => $payment->status,
        ]);
    }
}