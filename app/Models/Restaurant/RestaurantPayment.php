<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Userstamps;
use App\Models\Restaurant\RestaurantOrder;
use App\Models\Sale;
use App\Models\Store;
use App\Models\Contact;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RestaurantPayment extends Model
{
    use SoftDeletes, Userstamps;

    protected $table = 'restaurant_payments';

    protected $fillable = [
        'payment_number',
        'restaurant_order_id',
        'sale_id',
        'store_id',
        'customer_id',
        'payment_method',
        'payment_type',
        'amount',
        'tip_amount',
        'processing_fee',
        'total_amount',
        'payment_details',
        'gateway_transaction_id',
        'gateway_reference',
        'authorization_code',
        'status',
        'failure_reason',
        'processed_at',
        'refunded_at',
        'voided_at',
        'refunded_amount',
        'refund_reason',
        'refund_transaction_id',
        'split_number',
        'total_splits',
        'split_allocation',
        'metadata',
        'notes',
        'created_by',
        'processed_by',
        'refunded_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'tip_amount' => 'decimal:2',
        'processing_fee' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'refunded_amount' => 'decimal:2',
        'payment_details' => 'array',
        'split_allocation' => 'array',
        'metadata' => 'array',
        'processed_at' => 'datetime',
        'refunded_at' => 'datetime',
        'voided_at' => 'datetime',
    ];

    // Payment methods
    const PAYMENT_METHODS = [
        'cash' => 'Cash',
        'card' => 'Credit/Debit Card',
        'digital_wallet' => 'Digital Wallet',
        'bank_transfer' => 'Bank Transfer',
        'check' => 'Check',
        'voucher' => 'Voucher',
        'loyalty_points' => 'Loyalty Points',
        'complimentary' => 'Complimentary',
    ];

    // Payment statuses
    const STATUSES = [
        'pending' => 'Pending',
        'processing' => 'Processing',
        'completed' => 'Completed',
        'failed' => 'Failed',
        'refunded' => 'Refunded',
        'voided' => 'Voided',
    ];

    // Payment types
    const PAYMENT_TYPES = [
        'full' => 'Full Payment',
        'partial' => 'Partial Payment',
        'split' => 'Split Payment',
    ];

    // Relationships
    public function order()
    {
        return $this->belongsTo(RestaurantOrder::class, 'restaurant_order_id');
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function customer()
    {
        return $this->belongsTo(Contact::class, 'customer_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function refunder()
    {
        return $this->belongsTo(User::class, 'refunded_by');
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByMethod($query, $method)
    {
        return $query->where('payment_method', $method);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('payment_type', $type);
    }

    public function scopeForStore($query, $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    public function scopeForOrder($query, $orderId)
    {
        return $query->where('restaurant_order_id', $orderId);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopePending($query)
    {
        return $query->whereIn('status', ['pending', 'processing']);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeRefunded($query)
    {
        return $query->where('status', 'refunded');
    }

    public function scopeWithTip($query)
    {
        return $query->where('tip_amount', '>', 0);
    }

    public function scopeByDate($query, $date)
    {
        return $query->whereDate('created_at', $date);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    // Methods
    /**
     * Generate unique payment number
     */
    public static function generatePaymentNumber()
    {
        $prefix = 'PAY';
        $date = now()->format('Ymd');
        
        return DB::transaction(function() use ($prefix, $date) {
            $lastPayment = self::whereDate('created_at', today())
                ->lockForUpdate()
                ->orderBy('created_at', 'desc')
                ->first();

            $sequence = $lastPayment ? intval(substr($lastPayment->payment_number, -4)) + 1 : 1;
            
            return $prefix . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
        });
    }

    /**
     * Mark payment as processed
     */
    public function markAsProcessed($processedBy = null, $gatewayDetails = [])
    {
        $this->status = 'completed';
        $this->processed_at = now();
        $this->processed_by = $processedBy ?? auth()->id();
        
        if (!empty($gatewayDetails)) {
            $this->gateway_transaction_id = $gatewayDetails['transaction_id'] ?? null;
            $this->gateway_reference = $gatewayDetails['reference'] ?? null;
            $this->authorization_code = $gatewayDetails['authorization_code'] ?? null;
        }
        
        $this->save();
        
        // Update order payment status
        $this->updateOrderPaymentStatus();
        
        Log::info('Payment processed', [
            'payment_id' => $this->id,
            'payment_number' => $this->payment_number,
            'amount' => $this->total_amount,
            'method' => $this->payment_method,
        ]);
    }

    /**
     * Mark payment as failed
     */
    public function markAsFailed($reason)
    {
        $this->status = 'failed';
        $this->failure_reason = $reason;
        $this->save();
        
        Log::warning('Payment failed', [
            'payment_id' => $this->id,
            'payment_number' => $this->payment_number,
            'reason' => $reason,
        ]);
    }

    /**
     * Process refund
     */
    public function processRefund($refundAmount, $reason, $refundedBy = null)
    {
        if ($refundAmount > $this->total_amount) {
            throw new \InvalidArgumentException('Refund amount cannot exceed payment amount');
        }
        
        if ($this->status !== 'completed') {
            throw new \InvalidArgumentException('Only completed payments can be refunded');
        }
        
        return DB::transaction(function() use ($refundAmount, $reason, $refundedBy) {
            $this->refunded_amount = $refundAmount;
            $this->refund_reason = $reason;
            $this->refunded_by = $refundedBy ?? auth()->id();
            $this->refunded_at = now();
            
            // If full refund, mark as refunded
            if ($refundAmount >= $this->total_amount) {
                $this->status = 'refunded';
            }
            
            $this->save();
            
            // Update order payment status
            $this->updateOrderPaymentStatus();
            
            Log::info('Payment refunded', [
                'payment_id' => $this->id,
                'payment_number' => $this->payment_number,
                'refund_amount' => $refundAmount,
                'reason' => $reason,
            ]);
            
            return [
                'success' => true,
                'message' => 'Refund processed successfully',
                'refund_amount' => $refundAmount,
            ];
        });
    }

    /**
     * Void payment
     */
    public function voidPayment($reason, $voidedBy = null)
    {
        if (!in_array($this->status, ['pending', 'processing'])) {
            throw new \InvalidArgumentException('Only pending or processing payments can be voided');
        }
        
        return DB::transaction(function() use ($reason, $voidedBy) {
            $this->status = 'voided';
            $this->refund_reason = $reason;
            $this->refunded_by = $voidedBy ?? auth()->id();
            $this->voided_at = now();
            $this->save();
            
            // Update order payment status
            $this->updateOrderPaymentStatus();
            
            Log::info('Payment voided', [
                'payment_id' => $this->id,
                'payment_number' => $this->payment_number,
                'reason' => $reason,
            ]);
            
            return [
                'success' => true,
                'message' => 'Payment voided successfully',
            ];
        });
    }

    /**
     * Update order payment status based on payments
     */
    private function updateOrderPaymentStatus()
    {
        $order = $this->order;
        if (!$order) {
            return;
        }
        
        $allPayments = $order->payments;
        $totalPaid = $allPayments->where('status', 'completed')->sum('total_amount');
        $totalRefunded = $allPayments->where('status', 'refunded')->sum('refunded_amount');
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
     * Get payment method display name
     */
    public function getPaymentMethodDisplayNameAttribute()
    {
        return self::PAYMENT_METHODS[$this->payment_method] ?? $this->payment_method;
    }

    /**
     * Get status display name
     */
    public function getStatusDisplayNameAttribute()
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    /**
     * Check if payment can be refunded
     */
    public function canBeRefunded($amount = null)
    {
        if ($this->status !== 'completed') {
            return false;
        }
        
        $refundableAmount = $this->total_amount - $this->refunded_amount;
        
        if ($amount && $amount > $refundableAmount) {
            return false;
        }
        
        return true;
    }

    /**
     * Check if payment can be voided
     */
    public function canBeVoided()
    {
        return in_array($this->status, ['pending', 'processing']);
    }

    /**
     * Get refundable amount
     */
    public function getRefundableAmountAttribute()
    {
        return $this->total_amount - $this->refunded_amount;
    }

    /**
     * Get payment breakdown for display
     */
    public function getPaymentBreakdownAttribute()
    {
        return [
            'amount' => $this->amount,
            'tip_amount' => $this->tip_amount,
            'processing_fee' => $this->processing_fee,
            'total_amount' => $this->total_amount,
            'refunded_amount' => $this->refunded_amount,
            'net_amount' => $this->total_amount - $this->refunded_amount,
        ];
    }

    /**
     * Create payment from order
     */
    public static function createFromOrder(RestaurantOrder $order, array $paymentData)
    {
        return DB::transaction(function() use ($order, $paymentData) {
            $payment = self::create([
                'payment_number' => self::generatePaymentNumber(),
                'restaurant_order_id' => $order->id,
                'store_id' => $order->store_id,
                'customer_id' => $order->customer_id,
                'payment_method' => $paymentData['payment_method'],
                'payment_type' => $paymentData['payment_type'] ?? 'full',
                'amount' => $paymentData['amount'],
                'tip_amount' => $paymentData['tip_amount'] ?? 0,
                'processing_fee' => $paymentData['processing_fee'] ?? 0,
                'total_amount' => $paymentData['amount'] + ($paymentData['tip_amount'] ?? 0) + ($paymentData['processing_fee'] ?? 0),
                'payment_details' => $paymentData['payment_details'] ?? null,
                'split_number' => $paymentData['split_number'] ?? null,
                'total_splits' => $paymentData['total_splits'] ?? null,
                'split_allocation' => $paymentData['split_allocation'] ?? null,
                'metadata' => $paymentData['metadata'] ?? null,
                'notes' => $paymentData['notes'] ?? null,
                'created_by' => $paymentData['created_by'] ?? auth()->id(),
            ]);
            
            Log::info('Payment created', [
                'payment_id' => $payment->id,
                'payment_number' => $payment->payment_number,
                'order_id' => $order->id,
                'amount' => $payment->total_amount,
                'method' => $payment->payment_method,
            ]);
            
            return $payment;
        });
    }

    /**
     * Get payment analytics data
     */
    public static function getAnalytics($storeId, $startDate, $endDate)
    {
        $payments = self::forStore($storeId)
            ->byDateRange($startDate, $endDate)
            ->get();
        
        return [
            'total_payments' => $payments->count(),
            'total_amount' => $payments->sum('total_amount'),
            'total_tips' => $payments->sum('tip_amount'),
            'total_processing_fees' => $payments->sum('processing_fee'),
            'payment_methods' => $payments->groupBy('payment_method')->map(function($methodPayments) {
                return [
                    'count' => $methodPayments->count(),
                    'amount' => $methodPayments->sum('total_amount'),
                    'percentage' => round(($methodPayments->sum('total_amount') / $payments->sum('total_amount')) * 100, 2),
                ];
            }),
            'payment_types' => $payments->groupBy('payment_type')->map(function($typePayments) {
                return [
                    'count' => $typePayments->count(),
                    'amount' => $typePayments->sum('total_amount'),
                ];
            }),
            'status_distribution' => $payments->groupBy('status')->map(function($statusPayments) {
                return [
                    'count' => $statusPayments->count(),
                    'amount' => $statusPayments->sum('total_amount'),
                ];
            }),
        ];
    }

    /**
     * Get payment summary for order
     */
    public static function getOrderPaymentSummary($orderId)
    {
        $payments = self::forOrder($orderId)->get();
        
        return [
            'total_payments' => $payments->count(),
            'total_amount' => $payments->sum('total_amount'),
            'total_refunded' => $payments->sum('refunded_amount'),
            'net_amount' => $payments->sum('total_amount') - $payments->sum('refunded_amount'),
            'payment_methods' => $payments->pluck('payment_method')->unique(),
            'status' => $payments->every(fn($p) => $p->status === 'completed') ? 'completed' : 'pending',
            'payments' => $payments->map(function($payment) {
                return [
                    'id' => $payment->id,
                    'payment_number' => $payment->payment_number,
                    'method' => $payment->payment_method,
                    'amount' => $payment->total_amount,
                    'status' => $payment->status,
                    'created_at' => $payment->created_at,
                ];
            }),
        ];
    }
}