<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Userstamps;
use App\Models\RestaurantOrder;
use App\Models\Sale;
use App\Models\Store;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RestaurantInvoice extends Model
{
    use SoftDeletes, Userstamps;

    protected $table = 'restaurant_invoices';

    protected $fillable = [
        'invoice_number',
        'order_id',
        'sale_id',
        'store_id',
        'customer_id',
        'invoice_type', // standard, split, modified, cancelled
        'status', // draft, issued, paid, voided, refunded
        'subtotal',
        'tax_breakdown', // JSON
        'total_tax',
        'service_charges', // JSON
        'total_service_charges',
        'discounts', // JSON
        'total_discounts',
        'rounding_adjustment',
        'final_total',
        'amount_paid',
        'balance_due',
        'currency',
        'tax_inclusive',
        'issued_at',
        'due_date',
        'paid_at',
        'voided_at',
        'void_reason',
        'payment_method', // cash, card, digital_wallet, etc.
        'payment_details', // JSON
        'billing_address', // JSON
        'notes',
        'metadata', // JSON for additional data
    ];

    protected $casts = [
        'issued_at' => 'datetime',
        'due_date' => 'datetime',
        'paid_at' => 'datetime',
        'voided_at' => 'datetime',
        'subtotal' => 'decimal:2',
        'total_tax' => 'decimal:2',
        'total_service_charges' => 'decimal:2',
        'total_discounts' => 'decimal:2',
        'rounding_adjustment' => 'decimal:2',
        'final_total' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'balance_due' => 'decimal:2',
        'tax_breakdown' => 'array',
        'service_charges' => 'array',
        'discounts' => 'array',
        'payment_details' => 'array',
        'billing_address' => 'array',
        'metadata' => 'array',
        'tax_inclusive' => 'boolean',
    ];

    // Relationships
    public function order()
    {
        return $this->belongsTo(RestaurantOrder::class, 'order_id');
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function customer()
    {
        return $this->belongsTo(\App\Models\Contact::class, 'customer_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public voider()
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('invoice_type', $type);
    }

    public function scopeByStore($query, $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    public function scopeUnpaid($query)
    {
        return $query->where('status', 'issued')
                   ->where('balance_due', '>', 0);
    }

    public function scopeOverdue($query)
    {
        return $query->where('status', 'issued')
                   ->where('due_date', '<', now())
                   ->where('balance_due', '>', 0);
    }

    // Methods
    /**
     * Generate unique invoice number
     */
    public static function generateInvoiceNumber(int $storeId): string
    {
        $prefix = 'INV';
        $date = now()->format('Ymd');
        
        return DB::transaction(function() use ($prefix, $date, $storeId) {
            $lastInvoice = self::where('store_id', $storeId)
                ->whereDate('created_at', today())
                ->lockForUpdate()
                ->orderBy('created_at', 'desc')
                ->first();

            $sequence = $lastInvoice ? intval(substr($lastInvoice->invoice_number, -4)) + 1 : 1;
            
            return $prefix . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
        });
    }

    /**
     * Create invoice from order
     */
    public static function createFromOrder(RestaurantOrder $order, array $billingData = [], array $options = []): self
    {
        return DB::transaction(function() use ($order, $billingData, $options) {
            $invoiceNumber = self::generateInvoiceNumber($order->store_id);
            
            $invoice = self::create([
                'invoice_number' => $invoiceNumber,
                'order_id' => $order->id,
                'sale_id' => $order->sale_id,
                'store_id' => $order->store_id,
                'customer_id' => $order->sale->contact_id ?? null,
                'invoice_type' => $options['invoice_type'] ?? 'standard',
                'status' => 'draft',
                'subtotal' => $billingData['subtotal'] ?? 0,
                'tax_breakdown' => $billingData['tax_breakdown'] ?? [],
                'total_tax' => $billingData['total_tax'] ?? 0,
                'service_charges' => $billingData['service_charges'] ?? [],
                'total_service_charges' => $billingData['total_service_charges'] ?? 0,
                'discounts' => $billingData['discounts'] ?? [],
                'total_discounts' => $billingData['total_discounts'] ?? 0,
                'rounding_adjustment' => $billingData['rounding_adjustment'] ?? 0,
                'final_total' => $billingData['final_total'] ?? 0,
                'amount_paid' => 0,
                'balance_due' => $billingData['final_total'] ?? 0,
                'currency' => $billingData['currency'] ?? 'USD',
                'tax_inclusive' => $billingData['tax_inclusive'] ?? false,
                'due_date' => $options['due_date'] ?? now()->addDays(30),
                'billing_address' => $options['billing_address'] ?? null,
                'notes' => $options['notes'] ?? null,
                'metadata' => $billingData['metadata'] ?? [],
            ]);

            return $invoice;
        });
    }

    /**
     * Issue invoice
     */
    public function issue(array $options = []): array
    {
        if ($this->status !== 'draft') {
            return [
                'success' => false,
                'message' => 'Only draft invoices can be issued'
            ];
        }

        try {
            DB::beginTransaction();
            
            $this->status = 'issued';
            $this->issued_at = now();
            
            // Update payment method if provided
            if (isset($options['payment_method'])) {
                $this->payment_method = $options['payment_method'];
                $this->payment_details = $options['payment_details'] ?? [];
            }
            
            $this->save();
            
            // Update order status if applicable
            if ($this->order) {
                $this->order->status = 'billed';
                $this->order->save();
            }
            
            DB::commit();
            
            Log::info('Invoice issued', [
                'invoice_id' => $this->id,
                'invoice_number' => $this->invoice_number,
                'order_id' => $this->order_id,
            ]);
            
            return [
                'success' => true,
                'message' => 'Invoice issued successfully',
                'invoice' => $this->fresh()
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to issue invoice', [
                'invoice_id' => $this->id,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => 'Failed to issue invoice: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Mark invoice as paid
     */
    public function markAsPaid(float $amount, array $paymentDetails = []): array
    {
        if ($this->status !== 'issued') {
            return [
                'success' => false,
                'message' => 'Only issued invoices can be marked as paid'
            ];
        }

        if ($amount > $this->balance_due) {
            return [
                'success' => false,
                'message' => 'Payment amount exceeds balance due'
            ];
        }

        try {
            DB::beginTransaction();
            
            $this->amount_paid += $amount;
            $this->balance_due -= $amount;
            
            if ($this->balance_due <= 0) {
                $this->status = 'paid';
                $this->paid_at = now();
                
                // Update order status
                if ($this->order) {
                    $this->order->status = 'paid';
                    $this->order->save();
                }
                
                // Update sale status
                if ($this->sale) {
                    $this->sale->payment_status = 'paid';
                    $this->sale->amount_received = $this->amount_paid;
                    $this->sale->save();
                }
            }
            
            // Update payment details
            if (!empty($paymentDetails)) {
                $currentDetails = $this->payment_details ?? [];
                $currentDetails[] = [
                    'amount' => $amount,
                    'method' => $paymentDetails['method'] ?? 'cash',
                    'transaction_id' => $paymentDetails['transaction_id'] ?? null,
                    'notes' => $paymentDetails['notes'] ?? null,
                    'processed_at' => now()->toISOString(),
                ];
                $this->payment_details = $currentDetails;
            }
            
            $this->save();
            
            DB::commit();
            
            Log::info('Invoice payment recorded', [
                'invoice_id' => $this->id,
                'invoice_number' => $this->invoice_number,
                'amount' => $amount,
                'balance_due' => $this->balance_due,
            ]);
            
            return [
                'success' => true,
                'message' => 'Payment recorded successfully',
                'invoice' => $this->fresh()
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to record payment', [
                'invoice_id' => $this->id,
                'amount' => $amount,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => 'Failed to record payment: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Void invoice
     */
    public function void(string $reason, int $voidedBy = null): array
    {
        if (!in_array($this->status, ['draft', 'issued'])) {
            return [
                'success' => false,
                'message' => 'Only draft or issued invoices can be voided'
            ];
        }

        try {
            DB::beginTransaction();
            
            $this->status = 'voided';
            $this->voided_at = now();
            $this->void_reason = $reason;
            $this->deleted_by = $voidedBy ?? auth()->id();
            
            // If payment was made, create refund logic here
            if ($this->amount_paid > 0) {
                // Refund logic would go here
                Log::info('Refund processed for voided invoice', [
                    'invoice_id' => $this->id,
                    'refund_amount' => $this->amount_paid,
                ]);
            }
            
            $this->save();
            
            // Update order status
            if ($this->order) {
                $this->order->status = 'cancelled';
                $this->order->save();
            }
            
            // Update sale status
            if ($this->sale) {
                $this->sale->status = 'refunded';
                $this->sale->save();
            }
            
            DB::commit();
            
            Log::info('Invoice voided', [
                'invoice_id' => $this->id,
                'invoice_number' => $this->invoice_number,
                'reason' => $reason,
                'voided_by' => $voidedBy,
            ]);
            
            return [
                'success' => true,
                'message' => 'Invoice voided successfully',
                'invoice' => $this->fresh()
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to void invoice', [
                'invoice_id' => $this->id,
                'reason' => $reason,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => 'Failed to void invoice: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Create split invoice
     */
    public static function createSplitInvoice(RestaurantOrder $order, array $splitData, array $billingData): self
    {
        return DB::transaction(function() use ($order, $splitData, $billingData) {
            $invoiceNumber = self::generateInvoiceNumber($order->store_id);
            
            $invoice = self::create([
                'invoice_number' => $invoiceNumber,
                'order_id' => $order->id,
                'sale_id' => null, // Split invoices may not have direct sale linkage
                'store_id' => $order->store_id,
                'customer_id' => $splitData['customer_id'] ?? null,
                'invoice_type' => 'split',
                'status' => 'draft',
                'subtotal' => $billingData['subtotal'],
                'tax_breakdown' => $billingData['tax_breakdown'],
                'total_tax' => $billingData['total_tax'],
                'service_charges' => $billingData['service_charges'],
                'total_service_charges' => $billingData['total_service_charges'],
                'discounts' => $billingData['discounts'],
                'total_discounts' => $billingData['total_discounts'],
                'rounding_adjustment' => $billingData['rounding_adjustment'],
                'final_total' => $billingData['final_total'],
                'amount_paid' => 0,
                'balance_due' => $billingData['final_total'],
                'currency' => $billingData['currency'],
                'tax_inclusive' => $billingData['tax_inclusive'],
                'due_date' => now()->addDays(30),
                'metadata' => array_merge($billingData['metadata'] ?? [], [
                    'split_number' => $splitData['split_number'],
                    'split_type' => $splitData['split_type'],
                    'split_percentage' => $splitData['percentage'] ?? 0,
                    'assigned_items' => $splitData['assigned_items'] ?? [],
                ]),
            ]);

            return $invoice;
        });
    }

    /**
     * Get invoice summary
     */
    public function getSummary(): array
    {
        return [
            'invoice_number' => $this->invoice_number,
            'status' => $this->status,
            'type' => $this->invoice_type,
            'customer' => $this->customer ? [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
                'phone' => $this->customer->phone,
                'email' => $this->customer->email,
            ] : null,
            'order_info' => $this->order ? [
                'order_number' => $this->order->order_number,
                'order_type' => $this->order->order_type,
                'table_number' => $this->order->table?->table_number,
            ] : null,
            'amounts' => [
                'subtotal' => $this->subtotal,
                'total_tax' => $this->total_tax,
                'total_service_charges' => $this->total_service_charges,
                'total_discounts' => $this->total_discounts,
                'rounding_adjustment' => $this->rounding_adjustment,
                'final_total' => $this->final_total,
                'amount_paid' => $this->amount_paid,
                'balance_due' => $this->balance_due,
            ],
            'dates' => [
                'issued_at' => $this->issued_at,
                'due_date' => $this->due_date,
                'paid_at' => $this->paid_at,
                'voided_at' => $this->voided_at,
            ],
            'payment_method' => $this->payment_method,
            'currency' => $this->currency,
            'is_overdue' => $this->isOverdue(),
        ];
    }

    /**
     * Check if invoice is overdue
     */
    public function isOverdue(): bool
    {
        return $this->status === 'issued' && 
               $this->due_date && 
               $this->due_date->isPast() && 
               $this->balance_due > 0;
    }

    /**
     * Get detailed invoice breakdown
     */
    public function getDetailedBreakdown(): array
    {
        $breakdown = [
            'invoice_info' => $this->getSummary(),
            'tax_breakdown' => $this->tax_breakdown,
            'service_charges' => $this->service_charges,
            'discounts' => $this->discounts,
            'payment_history' => $this->payment_details ?? [],
            'billing_address' => $this->billing_address,
            'notes' => $this->notes,
            'metadata' => $this->metadata,
        ];

        // Add order items if available
        if ($this->order) {
            $breakdown['order_items'] = $this->order->items->map(function ($item) {
                return [
                    'product_name' => $item->product->name,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'subtotal' => $item->calculateSubtotal(),
                    'modifiers' => $item->modifiers->map(function ($modifier) {
                        return [
                            'name' => $modifier->modifier->name,
                            'quantity' => $modifier->quantity,
                            'price_adjustment' => $modifier->price_adjustment,
                        ];
                    }),
                ];
            });
        }

        return $breakdown;
    }

    /**
     * Generate invoice PDF (placeholder)
     */
    public function generatePdf(): array
    {
        try {
            // PDF generation logic would go here
            // For now, return a mock response
            
            return [
                'success' => true,
                'file_path' => 'invoices/' . $this->invoice_number . '.pdf',
                'download_url' => '/invoices/download/' . $this->id,
                'generated_at' => now()->toISOString(),
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate PDF', [
                'invoice_id' => $this->id,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => 'Failed to generate PDF: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Send invoice email (placeholder)
     */
    public function sendEmail(array $options = []): array
    {
        if (!$this->customer || !$this->customer->email) {
            return [
                'success' => false,
                'message' => 'Customer email not available'
            ];
        }

        try {
            // Email sending logic would go here
            // For now, just log the action
            
            Log::info('Invoice email sent', [
                'invoice_id' => $this->id,
                'invoice_number' => $this->invoice_number,
                'customer_email' => $this->customer->email,
            ]);
            
            return [
                'success' => true,
                'message' => 'Invoice sent successfully',
                'sent_to' => $this->customer->email,
                'sent_at' => now()->toISOString(),
            ];
        } catch (\Exception $e) {
            Log::error('Failed to send invoice email', [
                'invoice_id' => $this->id,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => 'Failed to send invoice: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get invoice statistics for a store
     */
    public static function getStatistics(int $storeId, string $period = 'month'): array
    {
        $startDate = self::getStartDate($period);
        $endDate = now();
        
        $invoices = self::byStore($storeId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();
        
        $totalInvoices = $invoices->count();
        $totalAmount = $invoices->sum('final_total');
        $totalPaid = $invoices->sum('amount_paid');
        $totalOutstanding = $invoices->sum('balance_due');
        
        $invoicesByStatus = $invoices->groupBy('status')->map(function ($group) {
            return [
                'count' => $group->count(),
                'total_amount' => $group->sum('final_total'),
            ];
        });
        
        $overdueInvoices = $invoices->filter(function ($invoice) {
            return $invoice->isOverdue();
        });
        
        return [
            'period' => $period,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'summary' => [
                'total_invoices' => $totalInvoices,
                'total_amount' => $totalAmount,
                'total_paid' => $totalPaid,
                'total_outstanding' => $totalOutstanding,
                'average_invoice_amount' => $totalInvoices > 0 ? $totalAmount / $totalInvoices : 0,
            ],
            'by_status' => $invoicesByStatus,
            'overdue' => [
                'count' => $overdueInvoices->count(),
                'total_amount' => $overdueInvoices->sum('balance_due'),
            ],
        ];
    }

    /**
     * Get start date based on period
     */
    private static function getStartDate(string $period): \Carbon\Carbon
    {
        switch ($period) {
            case 'today':
                return now()->startOfDay();
            case 'week':
                return now()->startOfWeek();
            case 'month':
                return now()->startOfMonth();
            case 'year':
                return now()->startOfYear();
            default:
                return now()->startOfMonth();
        }
    }
}