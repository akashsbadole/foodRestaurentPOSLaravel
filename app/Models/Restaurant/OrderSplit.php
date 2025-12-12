<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use App\Models\Contact;

class OrderSplit extends Model
{
    protected $table = 'order_splits';

    protected $fillable = [
        'order_id',
        'split_type',
        'split_count',
        'split_number',
        'contact_id',
        'subtotal',
        'tax_amount',
        'discount_amount',
        'service_charge',
        'total_amount',
        'paid_amount',
        'status',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    // Relationships
    public function order()
    {
        return $this->belongsTo(RestaurantOrder::class, 'order_id');
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function items()
    {
        return $this->hasMany(OrderSplitItem::class, 'split_id');
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    // Methods
    public function calculateTotals()
    {
        $this->subtotal = $this->items()->sum(function($item) {
            return $item->quantity * $item->orderItem->unit_price;
        });
        
        // Calculate tax, service charge, etc.
        $this->tax_amount = $this->subtotal * 0.1; // Example
        $this->service_charge = $this->subtotal * 0.1; // Example
        $this->total_amount = $this->subtotal + $this->tax_amount + $this->service_charge - $this->discount_amount;
        
        $this->save();
    }

    public function markAsPaid($amount)
    {
        $this->paid_amount += $amount;
        if ($this->paid_amount >= $this->total_amount) {
            $this->status = 'paid';
        } else {
            $this->status = 'partial_paid';
        }
        $this->save();
    }

    public function getRemainingAmount()
    {
        return max(0, $this->total_amount - $this->paid_amount);
    }
}