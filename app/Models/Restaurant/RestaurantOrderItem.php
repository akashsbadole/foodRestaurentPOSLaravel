<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Userstamps;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\User;

class RestaurantOrderItem extends Model
{
    use Userstamps;

    protected $table = 'restaurant_order_items';

    protected $fillable = [
        'order_id',
        'product_id',
        'batch_id',
        'quantity',
        'unit_price',
        'unit_cost',
        'discount',
        'status',
        'special_instructions',
        'preparation_notes',
        'course_number',
        'is_complimentary',
        'void_reason',
        'kitchen_printed',
        'kitchen_printed_at',
        'served_by',
        'served_at',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'discount' => 'decimal:2',
        'kitchen_printed_at' => 'datetime',
        'served_at' => 'datetime',
        'is_complimentary' => 'boolean',
    ];

    // Relationships
    public function order()
    {
        return $this->belongsTo(RestaurantOrder::class, 'order_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function batch()
    {
        return $this->belongsTo(ProductBatch::class);
    }

    public function modifiers()
    {
        return $this->hasMany(RestaurantOrderItemModifier::class, 'order_item_id');
    }

    public function kitchenQueue()
    {
        return $this->hasMany(KitchenOrderQueue::class, 'order_item_id');
    }

    public function servedBy()
    {
        return $this->belongsTo(User::class, 'served_by');
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByCourse($query, $courseNumber)
    {
        return $query->where('course_number', $courseNumber);
    }

    public function scopeForKitchen($query)
    {
        return $query->whereIn('status', ['pending', 'confirmed', 'preparing']);
    }

    // Methods
    public function calculateSubtotal()
    {
        $subtotal = $this->quantity * $this->unit_price;
        
        // Add modifier prices
        foreach ($this->modifiers as $modifier) {
            $subtotal += $modifier->price_adjustment * $this->quantity;
        }
        
        return $subtotal - $this->discount;
    }

    public function addToKitchenQueue($stationId)
    {
        return KitchenOrderQueue::create([
            'order_item_id' => $this->id,
            'station_id' => $stationId,
            'status' => 'queued',
            'priority' => $this->order->priority,
        ]);
    }

    public function markAsServed($servedBy = null)
    {
        $this->status = 'served';
        $this->served_by = $servedBy;
        $this->served_at = now();
        $this->save();
    }

    public function voidItem($reason)
    {
        $this->status = 'cancelled';
        $this->void_reason = $reason;
        $this->save();
    }
}