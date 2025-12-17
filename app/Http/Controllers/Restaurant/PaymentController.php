<?php

namespace App\Http\Controllers\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantPayment;
use App\Services\Restaurant\PaymentProcessingService;
use App\Services\Restaurant\PaymentGatewayService;
use App\Services\Restaurant\PaymentInventoryService;
use App\Services\Restaurant\PaymentReportingService;
use App\Services\Restaurant\PaymentRealTimeService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PaymentController extends Controller
{
    protected $paymentProcessingService;
    protected $paymentGatewayService;
    protected $paymentInventoryService;
    protected $paymentReportingService;
    protected $paymentRealTimeService;

    public function __construct(
        PaymentProcessingService $paymentProcessingService,
        PaymentGatewayService $paymentGatewayService,
        PaymentInventoryService $paymentInventoryService,
        PaymentReportingService $paymentReportingService,
        PaymentRealTimeService $paymentRealTimeService
    ) {
        $this->paymentProcessingService = $paymentProcessingService;
        $this->paymentGatewayService = $paymentGatewayService;
        $this->paymentInventoryService = $paymentInventoryService;
        $this->paymentReportingService = $paymentReportingService;
        $this->paymentRealTimeService = $paymentRealTimeService;
        
        $this->middleware('permission:process-payments')->only(['processPayment', 'processSplitPayments', 'voidPayment']);
        $this->middleware('permission:process-refunds')->only(['processRefund']);
        $this->middleware('permission:view-payments')->only(['index', 'show', 'getOrderPayments', 'getPaymentHistory']);
    }

    /**
     * Get all payments for a store
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $storeId = $request->get('store_id', auth()->user()->store_id);
            $startDate = $request->get('start_date', now()->startOfDay());
            $endDate = $request->get('end_date', now()->endOfDay());
            
            $payments = RestaurantPayment::forStore($storeId)
                ->byDateRange($startDate, $endDate)
                ->with(['order', 'customer', 'creator', 'processor'])
                ->orderBy('created_at', 'desc')
                ->paginate($request->get('per_page', 20));

            return response()->json([
                'success' => true,
                'data' => $payments,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch payments', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch payments: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get payment details
     */
    public function show(RestaurantPayment $payment): JsonResponse
    {
        try {
            $payment->load(['order', 'order.items', 'customer', 'creator', 'processor', 'refunder']);

            return response()->json([
                'success' => true,
                'data' => $payment,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch payment details', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch payment details: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Process payment for an order
     */
    public function processPayment(Request $request, RestaurantOrder $order): JsonResponse
    {
        try {
            $validated = $request->validate([
                'payment_method' => 'required|in:' . implode(',', array_keys(RestaurantPayment::PAYMENT_METHODS)),
                'amount' => 'required|numeric|min:0.01',
                'tip_amount' => 'nullable|numeric|min:0',
                'payment_details' => 'nullable|array',
                'notes' => 'nullable|string|max:500',
                'cash_received' => 'nullable|numeric|min:0',
            ]);

            // Add user context
            $validated['created_by'] = auth()->id();

            $result = $this->paymentProcessingService->processPayment($order, $validated);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => $result['message'],
                    'data' => [
                        'payment' => $result['payment'],
                        'order' => $result['order'],
                    ],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                ], 400);
            }
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Payment processing failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment processing failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Process split payments for an order
     */
    public function processSplitPayments(Request $request, RestaurantOrder $order): JsonResponse
    {
        try {
            $validated = $request->validate([
                'payments' => 'required|array|min:2',
                'payments.*.payment_method' => 'required|in:' . implode(',', array_keys(RestaurantPayment::PAYMENT_METHODS)),
                'payments.*.amount' => 'required|numeric|min:0.01',
                'payments.*.tip_amount' => 'nullable|numeric|min:0',
                'payments.*.payment_details' => 'nullable|array',
                'payments.*.notes' => 'nullable|string|max:500',
            ]);

            // Add user context to each payment
            foreach ($validated['payments'] as &$payment) {
                $payment['created_by'] = auth()->id();
            }

            $result = $this->paymentProcessingService->processSplitPayments($order, $validated['payments']);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => $result['message'],
                    'data' => [
                        'payments' => $result['payments'],
                        'order' => $result['order'],
                    ],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                ], 400);
            }
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Split payment processing failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Split payment processing failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Process refund
     */
    public function processRefund(Request $request, RestaurantPayment $payment): JsonResponse
    {
        try {
            $validated = $request->validate([
                'refund_amount' => 'required|numeric|min:0.01|max:' . $payment->total_amount,
                'refund_reason' => 'required|string|max:500',
            ]);

            $result = $this->paymentProcessingService->processRefund(
                $payment,
                $validated['refund_amount'],
                $validated['refund_reason']
            );

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => $result['message'],
                    'data' => [
                        'payment' => $result['payment'],
                        'refund_amount' => $result['refund_amount'],
                    ],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                ], 400);
            }
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Refund processing failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Refund processing failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Void payment
     */
    public function voidPayment(Request $request, RestaurantPayment $payment): JsonResponse
    {
        try {
            $validated = $request->validate([
                'void_reason' => 'required|string|max:500',
            ]);

            $result = $this->paymentProcessingService->voidPayment($payment, $validated['void_reason']);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => $result['message'],
                    'data' => [
                        'payment' => $result['payment'],
                    ],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                ], 400);
            }
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Payment void failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment void failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get payments for an order
     */
    public function getOrderPayments(RestaurantOrder $order): JsonResponse
    {
        try {
            $payments = $order->payments()
                ->with(['creator', 'processor', 'refunder'])
                ->orderBy('created_at', 'desc')
                ->get();

            $summary = RestaurantPayment::getOrderPaymentSummary($order->id);

            return response()->json([
                'success' => true,
                'data' => [
                    'payments' => $payments,
                    'summary' => $summary,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch order payments', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch order payments: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get payment history for an order
     */
    public function getPaymentHistory(RestaurantOrder $order): JsonResponse
    {
        try {
            $history = $order->getPaymentHistory();

            return response()->json([
                'success' => true,
                'data' => $history,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch payment history', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch payment history: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get payment analytics
     */
    public function getPaymentAnalytics(Request $request): JsonResponse
    {
        try {
            $storeId = $request->get('store_id', auth()->user()->store_id);
            $startDate = $request->get('start_date', now()->startOfMonth());
            $endDate = $request->get('end_date', now()->endOfMonth());

            $analytics = RestaurantPayment::getAnalytics($storeId, $startDate, $endDate);

            return response()->json([
                'success' => true,
                'data' => $analytics,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch payment analytics', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch payment analytics: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get order payment analytics
     */
    public function getOrderPaymentAnalytics(RestaurantOrder $order): JsonResponse
    {
        try {
            $analytics = $order->getPaymentAnalytics();

            return response()->json([
                'success' => true,
                'data' => $analytics,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch order payment analytics', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch order payment analytics: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Validate payment method
     */
    public function validatePaymentMethod(Request $request, RestaurantOrder $order): JsonResponse
    {
        try {
            $validated = $request->validate([
                'payment_method' => 'required|in:' . implode(',', array_keys(RestaurantPayment::PAYMENT_METHODS)),
                'payment_details' => 'nullable|array',
            ]);

            $isAvailable = $order->isPaymentMethodAvailable($validated['payment_method']);

            // Additional validation based on payment method
            $validationResult = $this->validatePaymentMethodDetails(
                $validated['payment_method'],
                $validated['payment_details'] ?? []
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'is_available' => $isAvailable,
                    'validation' => $validationResult,
                    'available_methods' => $order->getAvailablePaymentMethods(),
                ],
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Payment method validation failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment method validation failed: ' . $e->getMessage(),
            ], 500);
        }
    
        /**
         * Get low stock alerts
         */
        public function getLowStockAlerts(Request $request): JsonResponse
        {
            try {
                $storeId = $request->get('store_id', auth()->user()->store_id);
                
                $result = $this->paymentInventoryService->getLowStockAlerts($storeId);
    
                return response()->json($result);
            } catch (\Exception $e) {
                Log::error('Failed to get low stock alerts', [
                    'error' => $e->getMessage(),
                    'user_id' => auth()->id(),
                ]);
    
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to get low stock alerts: ' . $e->getMessage(),
                ], 500);
            }
        }
    
        /**
         * Get inventory movement report
         */
        public function getInventoryMovementReport(Request $request): JsonResponse
        {
            try {
                $validated = $request->validate([
                    'start_date' => 'required|date',
                    'end_date' => 'required|date|after_or_equal:start_date',
                ]);
    
                $storeId = $request->get('store_id', auth()->user()->store_id);
                
                $result = $this->paymentInventoryService->getInventoryMovementReport(
                    $storeId,
                    $validated['start_date'],
                    $validated['end_date']
                );
    
                return response()->json($result);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            } catch (\Exception $e) {
                Log::error('Failed to get inventory movement report', [
                    'error' => $e->getMessage(),
                    'user_id' => auth()->id(),
                ]);
    
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to get inventory movement report: ' . $e->getMessage(),
                ], 500);
            }
        }
    
        /**
         * Get comprehensive payment analytics
         */
        public function getComprehensivePaymentAnalytics(Request $request): JsonResponse
        {
            try {
                $validated = $request->validate([
                    'start_date' => 'required|date',
                    'end_date' => 'required|date|after_or_equal:start_date',
                ]);
    
                $storeId = $request->get('store_id', auth()->user()->store_id);
                
                $result = $this->paymentReportingService->getPaymentAnalytics(
                    $storeId,
                    $validated['start_date'],
                    $validated['end_date']
                );
    
                return response()->json($result);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            } catch (\Exception $e) {
                Log::error('Failed to get comprehensive payment analytics', [
                    'error' => $e->getMessage(),
                    'user_id' => auth()->id(),
                ]);
    
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to get comprehensive payment analytics: ' . $e->getMessage(),
                ], 500);
            }
        }
    
        /**
         * Get revenue by payment type
         */
        public function getRevenueByPaymentType(Request $request): JsonResponse
        {
            try {
                $validated = $request->validate([
                    'start_date' => 'required|date',
                    'end_date' => 'required|date|after_or_equal:start_date',
                ]);
    
                $storeId = $request->get('store_id', auth()->user()->store_id);
                
                $result = $this->paymentReportingService->getRevenueByPaymentType(
                    $storeId,
                    $validated['start_date'],
                    $validated['end_date']
                );
    
                return response()->json($result);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            } catch (\Exception $e) {
                Log::error('Failed to get revenue by payment type', [
                    'error' => $e->getMessage(),
                    'user_id' => auth()->id(),
                ]);
    
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to get revenue by payment type: ' . $e->getMessage(),
                ], 500);
            }
        }
    
        /**
         * Get daily sales summary
         */
        public function getDailySalesSummary(Request $request): JsonResponse
        {
            try {
                $validated = $request->validate([
                    'date' => 'required|date',
                ]);
    
                $storeId = $request->get('store_id', auth()->user()->store_id);
                
                $result = $this->paymentReportingService->getDailySalesSummary(
                    $storeId,
                    $validated['date']
                );
    
                return response()->json($result);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            } catch (\Exception $e) {
                Log::error('Failed to get daily sales summary', [
                    'error' => $e->getMessage(),
                    'user_id' => auth()->id(),
                ]);
    
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to get daily sales summary: ' . $e->getMessage(),
                ], 500);
            }
        }
    
        /**
         * Trigger kitchen order completion notification
         */
        public function triggerKitchenOrderCompletion(Request $request, RestaurantOrder $order): JsonResponse
        {
            try {
                $result = $this->paymentRealTimeService->triggerKitchenOrderCompletion($order);
    
                return response()->json($result);
            } catch (\Exception $e) {
                Log::error('Failed to trigger kitchen order completion', [
                    'order_id' => $order->id,
                    'error' => $e->getMessage(),
                ]);
    
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to trigger kitchen order completion: ' . $e->getMessage(),
                ], 500);
            }
        }
    
        /**
         * Trigger table availability update
         */
        public function triggerTableAvailabilityUpdate(Request $request): JsonResponse
        {
            try {
                $validated = $request->validate([
                    'table_id' => 'required|exists:restaurant_tables,id',
                ]);
    
                $table = \App\Models\Restaurant\RestaurantTable::find($validated['table_id']);
                
                $result = $this->paymentRealTimeService->triggerTableAvailabilityUpdate($table);
    
                return response()->json($result);
            } catch (ValidationException $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            } catch (\Exception $e) {
                Log::error('Failed to trigger table availability update', [
                    'table_id' => $request->get('table_id'),
                    'error' => $e->getMessage(),
                ]);
    
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to trigger table availability update: ' . $e->getMessage(),
                ], 500);
            }
        }
    }

    /**
     * Process payment completion workflow
     */
    public function processPaymentCompletion(RestaurantOrder $order): JsonResponse
    {
        try {
            $result = $order->processPaymentCompletion();

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => $result['message'],
                    'data' => [
                        'order' => $result['order'],
                    ],
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                ], 400);
            }
        } catch (\Exception $e) {
            Log::error('Payment completion workflow failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment completion workflow failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Handle payment webhook
     */
    public function handleWebhook(Request $request, string $gateway): JsonResponse
    {
        try {
            $payload = $request->all();
            $result = $this->paymentGatewayService->handleWebhook($gateway, $payload);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'Webhook processed successfully',
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message'],
                ], 400);
            }
        } catch (\Exception $e) {
            Log::error('Webhook processing failed', [
                'gateway' => $gateway,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Webhook processing failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Validate payment method details
     */
    private function validatePaymentMethodDetails(string $paymentMethod, array $paymentDetails): array
    {
        $errors = [];

        switch ($paymentMethod) {
            case 'card':
                if (empty($paymentDetails['card_number'])) {
                    $errors[] = 'Card number is required';
                }
                if (empty($paymentDetails['expiry_month']) || empty($paymentDetails['expiry_year'])) {
                    $errors[] = 'Expiry date is required';
                }
                if (empty($paymentDetails['cvv'])) {
                    $errors[] = 'CVV is required';
                }
                break;

            case 'digital_wallet':
                if (empty($paymentDetails['wallet_type'])) {
                    $errors[] = 'Wallet type is required';
                }
                if (empty($paymentDetails['wallet_token'])) {
                    $errors[] = 'Wallet token is required';
                }
                break;

            case 'check':
                if (empty($paymentDetails['check_number'])) {
                    $errors[] = 'Check number is required';
                }
                if (empty($paymentDetails['bank_name'])) {
                    $errors[] = 'Bank name is required';
                }
                break;

            case 'voucher':
                if (empty($paymentDetails['voucher_code'])) {
                    $errors[] = 'Voucher code is required';
                }
                break;

            case 'loyalty_points':
                if (empty($paymentDetails['customer_id'])) {
                    $errors[] = 'Customer ID is required for loyalty points';
                }
                if (empty($paymentDetails['points_used'])) {
                    $errors[] = 'Points used is required';
                }
                break;

            case 'complimentary':
                if (empty($paymentDetails['authorized_by'])) {
                    $errors[] = 'Authorization by is required';
                }
                if (empty($paymentDetails['reason'])) {
                    $errors[] = 'Reason is required';
                }
                break;
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }
}