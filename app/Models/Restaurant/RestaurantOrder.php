<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Userstamps;
use App\Models\Store;
use App\Models\User;
use App\Models\Sale;
use App\Models\Contact;
use Illuminate\Support\Facades\DB;

class RestaurantOrder extends Model
{
    use SoftDeletes, Userstamps;

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

    public function items()
    {
        return $this->hasMany(RestaurantOrderItem::class, 'order_id');
    }

    public function splits()
    {
        return $this->hasMany(OrderSplit::class, 'order_id');
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

    // Methods
    public function calculateTotals()
    {
        $this->subtotal = $this->items()->sum(DB::raw('quantity * unit_price'));
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

    public function markAsConfirmed()
    {
        $this->status = 'confirmed';
        $this->save();
        
        // Update table status
        if ($this->table) {
            $this->table->markAsOccupied($this->id);
        }
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
        return in_array($this->status, ['pending', 'confirmed']);
    }

    public function canBePaid()
    {
        return in_array($this->status, ['served', 'completed']);
    }
}