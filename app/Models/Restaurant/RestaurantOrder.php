<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Userstamps;
use App\Models\Store;
use App\Models\User;
use App\Models\Sale;
use App\Models\Contact;
use App\Services\Restaurant\KOTGenerationService;
use App\Models\Restaurant\RestaurantOrderBilling;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RestaurantOrder extends Model
{
    use SoftDeletes, Userstamps, RestaurantOrderBilling;

    protected $table = 'restaurant_orders';

    protected $fillable = [
        'sale_id',
        'table_id',
        'order_number',
        'order_type',
        'customer_count',
        'waiter_id',
        'status',
        'priority',
        'special_instructions',
        'estimated_time',
        'actual_time',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'service_charge',
        'total_amount',
        'order_date',
        'order_time',
        'completed_at',
        'store_id',
        'created_by',
        // Billing fields
        'customer_id',
        'billing_status',
        'tax_breakdown',
        'discount_breakdown',
        'service_charge_breakdown',
        'final_total',
        'rounding_adjustment',
        'payment_status',
        'billing_notes',
    ];

    protected $casts = [
        'completed_at' => 'datetime',
        'order_date' => 'date',
        'order_time' => 'datetime',
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'total_amount' => 'decimal:2',
        // Billing casts
        'tax_breakdown' => 'array',
        'discount_breakdown' => 'array',
        'service_charge_breakdown' => 'array',
        'final_total' => 'decimal:2',
        'rounding_adjustment' => 'decimal:2',
    ];

    // Relationships
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function table()
    {
        return $this->belongsTo(RestaurantTable::class, 'table_id');
    }

    public function waiter()
    {
        return $this->belongsTo(User::class, 'waiter_id');
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function customer()
    {
        return $this->belongsTo(Contact::class, 'customer_id');
    }

    public function items()
    {
        return $this->hasMany(RestaurantOrderItem::class, 'order_id');
    }

    public function splits()
    {
        return $this->hasMany(OrderSplit::class, 'order_id');
    }

    public function payments()
    {
        return $this->hasMany(RestaurantPayment::class, 'restaurant_order_id');
    }

    public function invoices()
    {
        return $this->hasMany(RestaurantInvoice::class, 'order_id');
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('order_type', $type);
    }

    public function scopeByWaiter($query, $waiterId)
    {
        return $query->where('waiter_id', $waiterId);
    }

    public function scopeByDate($query, $date)
    {
        return $query->whereDate('order_date', $date);
    }

    public function scopeForStore($query, $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['pending', 'confirmed', 'preparing', 'ready', 'served']);
    }

    public function scopeByBillingStatus($query, $billingStatus)
    {
        return $query->where('billing_status', $billingStatus);
    }

    public function scopeByPaymentStatus($query, $paymentStatus)
    {
        return $query->where('payment_status', $paymentStatus);
    }

    public function scopePaid($query)
    {
        return $query->where('payment_status', 'paid');
    }

    public function scopeUnpaid($query)
    {
        return $query->whereIn('payment_status', ['pending', 'partial']);
    }

    // Methods
    public function calculateTotals()
    {
        $this->subtotal = $this->items()->sum(DB::raw('quantity * unit_price'));
        $this->tax_amount = $this->calculateTax();
        $this->service_charge = $this->calculateServiceCharge();
        $this->total_amount = $this->subtotal + $this->tax_amount + $this->service_charge - $this->discount_amount;
        $this->save();
    }

    /**
     * Calculate initial order totals during order creation
     */
    public function calculateInitialTotals($subtotal = null)
    {
        if ($subtotal === null) {
            $subtotal = $this->items()->sum(DB::raw('quantity * unit_price'));
        }
        
        $this->subtotal = $subtotal;
        $this->tax_amount = $this->calculateTax();
        $this->service_charge = $this->calculateServiceCharge();
        $this->total_amount = $this->subtotal + $this->tax_amount + $this->service_charge - $this->discount_amount;
        $this->save();
    }

    public function calculateTax()
    {
        // Implementation depends on tax rules
        return $this->subtotal * 0.1; // Example 10% tax
    }

    public function calculateServiceCharge()
    {
        if ($this->order_type === 'dine_in') {
            return $this->subtotal * 0.1; // Example 10% service charge
        }
        return 0;
    }

    /**
     * Generate unique order number
     */
    public static function generateOrderNumber()
    {
        $prefix = 'ORD';
        $date = now()->format('Ymd');
        $lastOrder = self::whereDate('created_at', today())
            ->orderBy('created_at', 'desc')
            ->first();

        $sequence = $lastOrder ? intval(substr($lastOrder->order_number, -4)) + 1 : 1;
        
        return $prefix . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Generate unique order number with locking for concurrent order creation
     */
    public static function generateOrderNumberWithLock()
    {
        $prefix = 'ORD';
        $date = now()->format('Ymd');
        
        return DB::transaction(function() use ($prefix, $date) {
            $lastOrder = self::whereDate('created_at', today())
                ->lockForUpdate()
                ->orderBy('created_at', 'desc')
                ->first();

            $sequence = $lastOrder ? intval(substr($lastOrder->order_number, -4)) + 1 : 1;
            
            return $prefix . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
        });
    }

    /**
     * Validate order data before creation
     */
    public static function validateOrderData($data, $storeId)
    {
        $errors = [];
        
        // Validate table availability for dine-in orders
        if ($data['order_type'] === 'dine_in' && isset($data['table_id'])) {
            $table = RestaurantTable::find($data['table_id']);
            if (!$table) {
                $errors['table'] = 'Selected table not found';
            } elseif (!$table->isAvailable()) {
                $errors['table'] = 'Selected table is not available';
            } elseif (!$table->canSeat($data['customer_count'])) {
                $errors['table'] = 'Selected table cannot accommodate ' . $data['customer_count'] . ' customers';
            }
        }
        
        return $errors;
    }

    public function markAsConfirmed()
    {
        $this->status = 'confirmed';
        $this->save();
        
        // Update table status
        if ($this->table) {
            $this->table->markAsOccupied($this->id);
        }
        
        // Trigger KOT generation
        $this->generateKOTs();
    }

    /**
     * Generate KOTs for all order items
     */
    public function generateKOTs()
    {
        try {
            $kotService = new KOTGenerationService();
            $result = $kotService->generateKOTForOrder($this);
            
            Log::info('KOT generation triggered', [
                'order_id' => $this->id,
                'order_number' => $this->order_number,
                'result' => $result
            ]);
            
            return $result;
        } catch (\Exception $e) {
            Log::error('Automatic KOT generation failed', [
                'order_id' => $this->id,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => 'KOT generation failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Check if order has KOTs generated
     */
    public function hasKOTs()
    {
        return $this->items()->whereHas('kitchenQueue')->exists();
    }

    /**
     * Get KOTs for this order
     */
    public function getKOTs()
    {
        return \App\Models\Restaurant\KitchenOrderQueue::whereHas('orderItem', function($query) {
                $query->where('order_id', $this->id);
            })
            ->with(['orderItem.product', 'station'])
            ->get();
    }

    /**
     * Get pending KOTs for this order
     */
    public function getPendingKOTs()
    {
        return \App\Models\Restaurant\KitchenOrderQueue::whereHas('orderItem', function($query) {
                $query->where('order_id', $this->id);
            })
            ->whereIn('status', ['queued', 'in_progress'])
            ->with(['orderItem.product', 'station'])
            ->get();
    }

    /**
     * Get completed KOTs for this order
     */
    public function getCompletedKOTs()
    {
        return \App\Models\Restaurant\KitchenOrderQueue::whereHas('orderItem', function($query) {
                $query->where('order_id', $this->id);
            })
            ->where('status', 'completed')
            ->with(['orderItem.product', 'station'])
            ->get();
    }

    /**
     * Check if all KOTs are completed
     */
    public function areAllKOTsCompleted()
    {
        $pendingKOTs = $this->getPendingKOTs();
        return $pendingKOTs->isEmpty();
    }

    /**
     * Get KOT statistics for this order
     */
    public function getKOTStatistics()
    {
        $kots = $this->getKOTs();
        
        $totalKOTs = $kots->count();
        $completedKOTs = $kots->where('status', 'completed')->count();
        $avgPreparationTime = $kots->whereNotNull('started_at')
            ->whereNotNull('completed_at')
            ->avg(function($kot) {
                return $kot->started_at->diffInMinutes($kot->completed_at);
            });

        return [
            'total_kots' => $totalKOTs,
            'completed_kots' => $completedKOTs,
            'completion_rate' => $totalKOTs > 0 ? round(($completedKOTs / $totalKOTs) * 100, 2) : 0,
            'avg_preparation_time' => round($avgPreparationTime ?? 0, 1),
            'kots_by_station' => $kots->groupBy('station.name')->map(function($stationKots) {
                return [
                    'total' => $stationKots->count(),
                    'completed' => $stationKots->where('status', 'completed')->count(),
                    'pending' => $stationKots->whereIn('status', ['queued', 'in_progress'])->count()
                ];
            })
        ];
    }

    /**
     * Update order status based on KOT completion
     */
    public function updateStatusBasedOnKOTs()
    {
        $kots = $this->getKOTs();
        
        if ($kots->isEmpty()) {
            return;
        }

        $allCompleted = $kots->every(function($kot) {
            return in_array($kot->status, ['completed', 'cancelled']);
        });

        $anyInProgress = $kots->contains(function($kot) {
            return $kot->status === 'in_progress';
        });

        if ($allCompleted && $this->status !== 'ready') {
            $this->status = 'ready';
            $this->save();
        } elseif ($anyInProgress && $this->status === 'confirmed') {
            $this->status = 'preparing';
            $this->save();
        }
    }

    /**
     * Cancel all pending KOTs
     */
    public function cancelPendingKOTs($reason = 'Order cancelled')
    {
        $pendingKOTs = $this->getPendingKOTs();
        
        foreach ($pendingKOTs as $kot) {
            $kot->status = 'cancelled';
            $kot->notes = ($kot->notes ?? '') . ' | Cancelled: ' . $reason;
            $kot->save();
            
            // Update order item status
            $orderItem = $kot->orderItem;
            $orderItem->status = 'cancelled';
            $orderItem->void_reason = $reason;
            $orderItem->save();
        }

        Log::info('Pending KOTs cancelled', [
            'order_id' => $this->id,
            'cancelled_count' => $pendingKOTs->count(),
            'reason' => $reason
        ]);
    }

    /**
     * Get KOT preparation summary
     */
    public function getKOTPreparationSummary()
    {
        $kots = $this->getKOTs();
        
        return [
            'order_info' => [
                'order_number' => $this->order_number,
                'order_type' => $this->order_type,
                'table' => $this->table ? $this->table->table_number : null,
                'customer_count' => $this->customer_count,
                'order_time' => $this->order_time,
                'estimated_time' => $this->estimated_time,
            ],
            'kot_summary' => [
                'total_items' => $kots->count(),
                'stations_involved' => $kots->pluck('station.name')->unique()->values(),
                'priority_distribution' => $kots->groupBy('priority')->map(function($group) {
                    return $group->count();
                }),
                'status_distribution' => $kots->groupBy('status')->map(function($group) {
                    return $group->count();
                }),
            ],
            'timing_info' => [
                'first_kot_created' => $kots->min('created_at'),
                'last_kot_completed' => $kots->whereNotNull('completed_at')->max('completed_at'),
                'total_preparation_time' => $kots->whereNotNull('started_at')
                    ->whereNotNull('completed_at')
                    ->sum(function($kot) {
                        return $kot->started_at->diffInMinutes($kot->completed_at);
                    }),
            ]
        ];
    }

    public function markAsCompleted()
    {
        $this->status = 'completed';
        $this->completed_at = now();
        $this->save();
        
        // Update table status
        if ($this->table) {
            $this->table->markAsAvailable();
        }
    }

    public function canBeModified()
    {
        // Order can only be modified in certain statuses
        if (!in_array($this->status, ['pending', 'confirmed'])) {
            return false;
        }

        // Check time-based restrictions (e.g., no modifications after 10 minutes of confirmation)
        if ($this->status === 'confirmed' && $this->updated_at->diffInMinutes(now()) > 10) {
            return false;
        }

        // Check if any items are already being prepared
        $itemsBeingPrepared = $this->items()->whereHas('kitchenQueue', function($query) {
            $query->whereIn('status', ['in_progress', 'ready']);
        })->count();

        if ($itemsBeingPrepared > 0) {
            return false;
        }

        return true;
    }

    /**
     * Check if order can be cancelled based on business rules
     */
    public function canBeCancelled()
    {
        // Order can only be cancelled in certain statuses
        if (!in_array($this->status, ['pending', 'confirmed'])) {
            return false;
        }

        // Check time-based restrictions (e.g., no cancellations after 15 minutes of confirmation)
        if ($this->status === 'confirmed' && $this->updated_at->diffInMinutes(now()) > 15) {
            return false;
        }

        // Check if any items are already being prepared
        $itemsBeingPrepared = $this->items()->whereHas('kitchenQueue', function($query) {
            $query->whereIn('status', ['in_progress', 'ready']);
        })->count();

        if ($itemsBeingPrepared > 0) {
            return false;
        }

        return true;
    }

    /**
     * Get modification restrictions for this order
     */
    public function getModificationRestrictions()
    {
        $restrictions = [];

        // Status-based restrictions
        if (!in_array($this->status, ['pending', 'confirmed'])) {
            $restrictions[] = 'Order is in ' . $this->status . ' status and cannot be modified';
        }

        // Time-based restrictions
        if ($this->status === 'confirmed') {
            $minutesSinceConfirmation = $this->updated_at->diffInMinutes(now());
            if ($minutesSinceConfirmation > 10) {
                $restrictions[] = 'Order was confirmed more than 10 minutes ago';
            }
        }

        // Item preparation restrictions
        $itemsBeingPrepared = $this->items()->whereHas('kitchenQueue', function($query) {
            $query->whereIn('status', ['in_progress', 'ready']);
        })->count();

        if ($itemsBeingPrepared > 0) {
            $restrictions[] = $itemsBeingPrepared . ' item(s) are already being prepared';
        }

        // Payment restrictions
        if ($this->sale && $this->sale->payment_status === 'paid') {
            $restrictions[] = 'Order has already been paid for';
        }

        return $restrictions;
    }

    /**
     * Get items that can be modified
     */
    public function getModifiableItems()
    {
        return $this->items()->whereHas('kitchenQueue', function($query) {
            $query->where('status', 'queued');
        })->orWhereDoesntHave('kitchenQueue')->get();
    }

    /**
     * Get items that cannot be modified and their reasons
     */
    public function getNonModifiableItems()
    {
        $nonModifiableItems = [];

        foreach ($this->items as $item) {
            $reasons = [];
            $kot = $item->getKOT();

            if ($kot) {
                switch ($kot->status) {
                    case 'in_progress':
                        $reasons[] = 'Item is currently being prepared';
                        break;
                    case 'ready':
                        $reasons[] = 'Item is ready and cannot be modified';
                        break;
                    case 'completed':
                        $reasons[] = 'Item has already been completed';
                        break;
                }
            }

            if ($item->status === 'served') {
                $reasons[] = 'Item has already been served';
            }

            if ($item->status === 'cancelled') {
                $reasons[] = 'Item has been cancelled';
            }

            if (!empty($reasons)) {
                $nonModifiableItems[] = [
                    'item' => $item,
                    'reasons' => $reasons
                ];
            }
        }

        return $nonModifiableItems;
    }

    /**
     * Validate order modification based on business rules
     */
    public function validateModification($modificationType = null, $itemData = null)
    {
        $errors = [];

        // Check basic modification permission
        if (!$this->canBeModified()) {
            $errors['permission'] = 'Order cannot be modified: ' . implode(', ', $this->getModificationRestrictions());
        }

        // Specific validation based on modification type
        if ($modificationType) {
            switch ($modificationType) {
                case 'add_item':
                    if ($itemData && isset($itemData['product_id'])) {
                        // Check if product can be added to this order type
                        $product = Product::find($itemData['product_id']);
                        if ($product && !$this->canProductBeAdded($product)) {
                            $errors['product'] = 'Product cannot be added to this order';
                        }
                    }
                    break;

                case 'remove_item':
                    // Check if order will become empty
                    if ($this->items->count() <= 1) {
                        $errors['items'] = 'Cannot remove the last item from an order. Consider cancelling the order instead.';
                    }
                    break;

                case 'cancel_order':
                    if (!$this->canBeCancelled()) {
                        $errors['cancellation'] = 'Order cannot be cancelled at this time';
                    }
                    break;
            }
        }

        return $errors;
    }

    /**
     * Check if a product can be added to this order
     */
    private function canProductBeAdded($product)
    {
        // Check if product is available for this order type
        if ($this->order_type === 'delivery' && !$product->is_delivery_available) {
            return false;
        }

        if ($this->order_type === 'takeaway' && !$product->is_takeaway_available) {
            return false;
        }

        // Check if product is available during current time
        if (!$product->isAvailableNow()) {
            return false;
        }

        return true;
    }

    /**
     * Record modification in order history
     */
    public function recordModification($action, $data = [], $userId = null)
    {
        // This would typically save to a modifications history table
        // For now, we'll log it and update the order's updated_at timestamp
        $this->touch();
        
        Log::info('Order modification recorded', [
            'order_id' => $this->id,
            'order_number' => $this->order_number,
            'action' => $action,
            'data' => $data,
            'user_id' => $userId ?? auth()->id(),
            'timestamp' => now()
        ]);
    }

    /**
     * Get modification history for this order
     */
    public function getModificationHistory()
    {
        // This would typically query a modifications history table
        // For now, we'll return an empty array
        return [];
    }

    /**
     * Check if order has pending modifications
     */
    public function hasPendingModifications()
    {
        // This would typically check a modifications table for pending changes
        return false;
    }

    /**
     * Get real-time modification status for frontend
     */
    public function getModificationStatus()
    {
        return [
            'can_modify' => $this->canBeModified(),
            'can_cancel' => $this->canBeCancelled(),
            'restrictions' => $this->getModificationRestrictions(),
            'modifiable_items' => $this->getModifiableItems()->pluck('id'),
            'non_modifiable_items' => collect($this->getNonModifiableItems())->map(function($item) {
                return [
                    'item_id' => $item['item']->id,
                    'product_name' => $item['item']->product->name,
                    'reasons' => $item['reasons']
                ];
            }),
            'time_until_lock' => $this->getTimeUntilModificationLock(),
        ];
    }

    /**
     * Get time remaining until order becomes non-modifiable
     */
    private function getTimeUntilModificationLock()
    {
        if ($this->status === 'pending') {
            return null; // No time limit for pending orders
        }

        if ($this->status === 'confirmed') {
            $minutesSinceConfirmation = $this->updated_at->diffInMinutes(now());
            $remainingMinutes = max(0, 10 - $minutesSinceConfirmation);
            
            return [
                'minutes' => $remainingMinutes,
                'seconds' => $remainingMinutes * 60,
                'locked_at' => $this->updated_at->copy()->addMinutes(10)
            ];
        }

        return null;
    }

    /**
     * Apply order modification with proper validation
     */
    public function applyModification($modificationType, $data, $userId = null)
    {
        // Validate modification
        $errors = $this->validateModification($modificationType, $data);
        if (!empty($errors)) {
            return [
                'success' => false,
                'errors' => $errors
            ];
        }

        // Record modification attempt
        $this->recordModification($modificationType, $data, $userId);

        return [
            'success' => true,
            'message' => 'Modification validated and recorded'
        ];
    }

    public function canBePaid()
    {
        return in_array($this->status, ['served', 'completed']);
    }

    /**
     * Check if order is fully paid
     */
    public function isFullyPaid(): bool
    {
        return $this->payment_status === 'paid';
    }

    /**
     * Check if order is partially paid
     */
    public function isPartiallyPaid(): bool
    {
        return $this->payment_status === 'partial';
    }

    /**
     * Get total paid amount
     */
    public function getTotalPaidAttribute(): float
    {
        return $this->payments()->where('status', 'completed')->sum('total_amount');
    }

    /**
     * Get total refunded amount
     */
    public function getTotalRefundedAttribute(): float
    {
        return $this->payments()->sum('refunded_amount');
    }

    /**
     * Get net paid amount (paid - refunded)
     */
    public function getNetPaidAttribute(): float
    {
        return $this->total_paid - $this->total_refunded;
    }

    /**
     * Get remaining amount to be paid
     */
    public function getRemainingAmountAttribute(): float
    {
        return max(0, $this->final_total - $this->net_paid);
    }

    /**
     * Get payment summary
     */
    public function getPaymentSummaryAttribute(): array
    {
        return [
            'total_amount' => $this->final_total,
            'total_paid' => $this->total_paid,
            'total_refunded' => $this->total_refunded,
            'net_paid' => $this->net_paid,
            'remaining_amount' => $this->remaining_amount,
            'payment_status' => $this->payment_status,
            'billing_status' => $this->billing_status,
            'payment_methods' => $this->payments()->pluck('payment_method')->unique()->values(),
            'payment_count' => $this->payments()->count(),
            'completed_payments' => $this->payments()->where('status', 'completed')->count(),
        ];
    }

    /**
     * Process payment completion workflow
     */
    public function processPaymentCompletion(): array
    {
        try {
            // Check if order is fully paid
            if ($this->payment_status !== 'paid') {
                return [
                    'success' => false,
                    'message' => 'Order is not fully paid'
                ];
            }

            // Update order status if needed
            if ($this->status !== 'completed') {
                $this->status = 'completed';
                $this->completed_at = now();
            }

            // Update table status
            if ($this->table) {
                $this->table->markAsAvailable();
            }

            // Create final invoice if not exists
            if (!$this->invoices()->exists()) {
                $this->generateInvoice();
            }

            $this->save();

            // Trigger completion events
            $this->triggerPaymentCompletionEvents();

            return [
                'success' => true,
                'message' => 'Payment completion workflow processed successfully',
                'order' => $this->fresh(),
            ];
        } catch (\Exception $e) {
            Log::error('Payment completion workflow failed', [
                'order_id' => $this->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Payment completion workflow failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Handle payment failure
     */
    public function handlePaymentFailure(string $failureReason): array
    {
        try {
            // Update payment status
            $this->payment_status = 'failed';
            $this->billing_notes = ($this->billing_notes ?? '') . ' | Payment failed: ' . $failureReason;
            $this->save();

            // Log the failure
            Log::warning('Order payment failed', [
                'order_id' => $this->id,
                'order_number' => $this->order_number,
                'failure_reason' => $failureReason,
            ]);

            // Trigger failure events
            $this->triggerPaymentFailureEvents($failureReason);

            return [
                'success' => true,
                'message' => 'Payment failure handled successfully',
            ];
        } catch (\Exception $e) {
            Log::error('Payment failure handling failed', [
                'order_id' => $this->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Payment failure handling failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get payment history
     */
    public function getPaymentHistory(): array
    {
        return $this->payments()
            ->with(['creator', 'processor', 'refunder'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($payment) {
                return [
                    'payment_number' => $payment->payment_number,
                    'method' => $payment->payment_method,
                    'type' => $payment->payment_type,
                    'amount' => $payment->amount,
                    'tip_amount' => $payment->tip_amount,
                    'total_amount' => $payment->total_amount,
                    'status' => $payment->status,
                    'created_at' => $payment->created_at,
                    'processed_at' => $payment->processed_at,
                    'refunded_amount' => $payment->refunded_amount,
                    'refunded_at' => $payment->refunded_at,
                    'created_by' => $payment->creator ? $payment->creator->name : null,
                    'processed_by' => $payment->processor ? $payment->processor->name : null,
                    'refunded_by' => $payment->refunder ? $payment->refunder->name : null,
                    'notes' => $payment->notes,
                ];
            })
            ->toArray();
    }

    /**
     * Get payment analytics for this order
     */
    public function getPaymentAnalytics(): array
    {
        $payments = $this->payments;
        
        return [
            'total_payments' => $payments->count(),
            'total_amount' => $payments->sum('total_amount'),
            'total_tips' => $payments->sum('tip_amount'),
            'total_processing_fees' => $payments->sum('processing_fee'),
            'payment_methods_breakdown' => $payments->groupBy('payment_method')->map(function($methodPayments) {
                return [
                    'count' => $methodPayments->count(),
                    'amount' => $methodPayments->sum('total_amount'),
                    'average_amount' => $methodPayments->avg('total_amount'),
                ];
            }),
            'payment_types_breakdown' => $payments->groupBy('payment_type')->map(function($typePayments) {
                return [
                    'count' => $typePayments->count(),
                    'amount' => $typePayments->sum('total_amount'),
                ];
            }),
            'status_breakdown' => $payments->groupBy('status')->map(function($statusPayments) {
                return [
                    'count' => $statusPayments->count(),
                    'amount' => $statusPayments->sum('total_amount'),
                ];
            }),
            'refund_rate' => $payments->sum('total_amount') > 0
                ? round(($payments->sum('refunded_amount') / $payments->sum('total_amount')) * 100, 2)
                : 0,
            'tip_rate' => $payments->sum('amount') > 0
                ? round(($payments->sum('tip_amount') / $payments->sum('amount')) * 100, 2)
                : 0,
        ];
    }

    /**
     * Check if payment method is available for this order
     */
    public function isPaymentMethodAvailable(string $paymentMethod): bool
    {
        // Check store-specific payment method availability
        $store = $this->store;
        if ($store && $store->payment_methods) {
            $availableMethods = json_decode($store->payment_methods, true);
            if (!in_array($paymentMethod, $availableMethods)) {
                return false;
            }
        }

        // Check order type restrictions
        $restrictedMethods = [
            'delivery' => ['cash'], // Cash might not be available for delivery
        ];

        if (isset($restrictedMethods[$this->order_type]) &&
            in_array($paymentMethod, $restrictedMethods[$this->order_type])) {
            return false;
        }

        return true;
    }

    /**
     * Get available payment methods for this order
     */
    public function getAvailablePaymentMethods(): array
    {
        $allMethods = RestaurantPayment::PAYMENT_METHODS;
        $availableMethods = [];

        foreach ($allMethods as $method => $displayName) {
            if ($this->isPaymentMethodAvailable($method)) {
                $availableMethods[$method] = $displayName;
            }
        }

        return $availableMethods;
    }

    /**
     * Trigger payment completion events
     */
    private function triggerPaymentCompletionEvents(): void
    {
        // This would trigger various events like:
        // - Send receipt to customer
        // - Update sales reports
        // - Notify kitchen staff
        // - Update table status
        // - Send notifications to management
        
        Log::info('Payment completion events triggered', [
            'order_id' => $this->id,
            'order_number' => $this->order_number,
            'total_amount' => $this->final_total,
        ]);
    }

    /**
     * Trigger payment failure events
     */
    private function triggerPaymentFailureEvents(string $failureReason): void
    {
        // This would trigger events like:
        // - Notify management
        // - Log for analytics
        // - Alert staff if needed
        
        Log::warning('Payment failure events triggered', [
            'order_id' => $this->id,
            'order_number' => $this->order_number,
            'failure_reason' => $failureReason,
        ]);
    }

    /**
     * Update table status based on order status
     */
    public function updateTableStatus()
    {
        if (!$this->table) {
            return;
        }

        switch ($this->status) {
            case 'pending':
            case 'confirmed':
                $this->table->markAsOccupied($this->id);
                break;
            case 'completed':
            case 'cancelled':
                $this->table->markAsAvailable();
                break;
        }
    }

    /**
     * Get real-time table status for order
     */
    public function getTableStatus()
    {
        if (!$this->table) {
            return null;
        }

        return [
            'table_id' => $this->table->id,
            'table_number' => $this->table->table_number,
            'status' => $this->table->status,
            'capacity' => $this->table->capacity,
            'current_order_id' => $this->table->current_order_id,
            'reserved_until' => $this->table->reserved_until,
        ];
    }

    /**
     * Get comprehensive order data for API responses
     */
    public function toDetailedArray()
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'table' => $this->table ? [
                'id' => $this->table->id,
                'table_number' => $this->table->table_number,
                'name' => $this->table->name,
                'section' => $this->table->section ? [
                    'id' => $this->table->section->id,
                    'name' => $this->table->section->name,
                ] : null,
            ] : null,
            'order_type' => $this->order_type,
            'status' => $this->status,
            'priority' => $this->priority,
            'customer_count' => $this->customer_count,
            'waiter' => $this->waiter ? [
                'id' => $this->waiter->id,
                'name' => $this->waiter->name,
            ] : null,
            'subtotal' => $this->subtotal,
            'tax_amount' => $this->tax_amount,
            'service_charge' => $this->service_charge,
            'discount_amount' => $this->discount_amount,
            'total_amount' => $this->total_amount,
            'order_date' => $this->order_date,
            'order_time' => $this->order_time,
            'special_instructions' => $this->special_instructions,
            'estimated_time' => $this->estimated_time,
            'actual_time' => $this->actual_time,
            'completed_at' => $this->completed_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'items' => $this->items->map(function($item) {
                return [
                    'id' => $item->id,
                    'product' => [
                        'id' => $item->product->id,
                        'name' => $item->product->name,
                        'description' => $item->product->description,
                    ],
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'unit_cost' => $item->unit_cost,
                    'discount' => $item->discount,
                    'status' => $item->status,
                    'special_instructions' => $item->special_instructions,
                    'preparation_notes' => $item->preparation_notes,
                    'course_number' => $item->course_number,
                    'is_complimentary' => $item->is_complimentary,
                    'void_reason' => $item->void_reason,
                    'kitchen_printed' => $item->kitchen_printed,
                    'kitchen_printed_at' => $item->kitchen_printed_at,
                    'served_by' => $item->served_by,
                    'served_at' => $item->served_at,
                    'subtotal' => $item->calculateSubtotal(),
                    'modifiers' => $item->modifiers->map(function($modifier) {
                        return [
                            'id' => $modifier->id,
                            'modifier' => [
                                'id' => $modifier->modifier->id,
                                'name' => $modifier->modifier->name,
                                'description' => $modifier->modifier->description,
                            ],
                            'quantity' => $modifier->quantity,
                            'price_adjustment' => $modifier->price_adjustment,
                        ];
                    }),
                ];
            }),
            'table_status' => $this->getTableStatus(),
        ];
    }
}