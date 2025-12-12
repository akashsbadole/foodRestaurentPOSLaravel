# Restaurant POS Model Designs

## Overview
This document outlines the Laravel Eloquent models for the restaurant POS system, extending the existing InfoShop POS functionality to support full-service restaurant operations.

## Restaurant-Specific Models

### 1. RestaurantTable Model
Manages restaurant table information and status

```php
<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Userstamps;
use App\Models\Store;
use App\Models\User;

class RestaurantTable extends Model
{
    use SoftDeletes, Userstamps;

    protected $table = 'restaurant_tables';

    protected $fillable = [
        'table_number',
        'name',
        'capacity',
        'section_id',
        'shape',
        'position_x',
        'position_y',
        'width',
        'height',
        'status',
        'current_order_id',
        'reserved_until',
        'notes',
        'store_id',
        'created_by',
    ];

    protected $casts = [
        'reserved_until' => 'datetime',
        'position_x' => 'decimal:2',
        'position_y' => 'decimal:2',
        'width' => 'decimal:2',
        'height' => 'decimal:2',
    ];

    // Relationships
    public function section()
    {
        return $this->belongsTo(TableSection::class, 'section_id');
    }

    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function currentOrder()
    {
        return $this->belongsTo(RestaurantOrder::class, 'current_order_id');
    }

    public function orders()
    {
        return $this->hasMany(RestaurantOrder::class, 'table_id');
    }

    public function reservations()
    {
        return $this->hasMany(TableReservation::class, 'table_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    public function scopeOccupied($query)
    {
        return $query->where('status', 'occupied');
    }

    public function scopeReserved($query)
    {
        return $query->where('status', 'reserved');
    }

    public function scopeBySection($query, $sectionId)
    {
        return $query->where('section_id', $sectionId);
    }

    public function scopeForStore($query, $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    // Methods
    public function isAvailable()
    {
        return $this->status === 'available' && 
               (!$this->reserved_until || $this->reserved_until->isPast());
    }

    public function canSeat($partySize)
    {
        return $this->isAvailable() && $this->capacity >= $partySize;
    }

    public function markAsOccupied($orderId = null)
    {
        $this->status = 'occupied';
        if ($orderId) {
            $this->current_order_id = $orderId;
        }
        $this->save();
    }

    public function markAsAvailable()
    {
        $this->status = 'available';
        $this->current_order_id = null;
        $this->reserved_until = null;
        $this->save();
    }

    public function markAsReserved($until)
    {
        $this->status = 'reserved';
        $this->reserved_until = $until;
        $this->save();
    }
}
```

### 2. TableSection Model
Manages restaurant sections/zones

```php
<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use App\Models\Store;

class TableSection extends Model
{
    protected $table = 'table_sections';

    protected $fillable = [
        'name',
        'description',
        'store_id',
    ];

    // Relationships
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function tables()
    {
        return $this->hasMany(RestaurantTable::class, 'section_id');
    }

    // Scopes
    public function scopeForStore($query, $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    // Methods
    public function getAvailableTablesCount()
    {
        return $this->tables()->available()->count();
    }

    public function getOccupiedTablesCount()
    {
        return $this->tables()->occupied()->count();
    }

    public function getTotalCapacity()
    {
        return $this->tables()->sum('capacity');
    }
}
```

### 3. RestaurantOrder Model
Extended order management for restaurant operations

```php
<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Userstamps;
use App\Models\Store;
use App\Models\User;
use App\Models\Sale;
use App\Models\Contact;

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
```

### 4. RestaurantOrderItem Model
Detailed order items with modifiers and preparation notes

```php
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
```

### 5. MenuModifier Model
Product modification options

```php
<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use App\Models\Store;

class MenuModifier extends Model
{
    protected $table = 'menu_modifiers';

    protected $fillable = [
        'name',
        'description',
        'modifier_type',
        'price_adjustment',
        'price_adjustment_type',
        'is_active',
        'display_order',
        'store_id',
    ];

    protected $casts = [
        'price_adjustment' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    // Relationships
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function groups()
    {
        return $this->belongsToMany(MenuModifierGroup::class, 'menu_modifier_group_items')
                    ->withPivot('price_adjustment', 'display_order')
                    ->withTimestamps();
    }

    public function orderItemModifiers()
    {
        return $this->hasMany(RestaurantOrderItemModifier::class, 'modifier_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('modifier_type', $type);
    }

    public function scopeForStore($query, $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    // Methods
    public function calculatePriceAdjustment($basePrice = 0)
    {
        if ($this->price_adjustment_type === 'percentage') {
            return $basePrice * ($this->price_adjustment / 100);
        }
        return $this->price_adjustment;
    }
}
```

### 6. MenuModifierGroup Model
Groups of modifiers

```php
<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use App\Models\Store;

class MenuModifierGroup extends Model
{
    protected $table = 'menu_modifier_groups';

    protected $fillable = [
        'name',
        'description',
        'selection_type',
        'min_selections',
        'max_selections',
        'display_order',
        'is_active',
        'store_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relationships
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function modifiers()
    {
        return $this->belongsToMany(MenuModifier::class, 'menu_modifier_group_items')
                    ->withPivot('price_adjustment', 'display_order')
                    ->withTimestamps()
                    ->orderBy('menu_modifier_group_items.display_order');
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_modifier_groups')
                    ->withPivot('is_required', 'display_order')
                    ->withTimestamps();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForStore($query, $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    // Methods
    public function isValidSelection($selectedModifiers)
    {
        $count = count($selectedModifiers);
        
        if ($this->selection_type === 'single' && $count !== 1) {
            return false;
        }
        
        if ($count < $this->min_selections || $count > $this->max_selections) {
            return false;
        }
        
        return true;
    }
}
```

### 7. KitchenStation Model
Kitchen preparation stations

```php
<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use App\Models\Store;
use App\Models\User;

class KitchenStation extends Model
{
    protected $table = 'kitchen_stations';

    protected $fillable = [
        'name',
        'description',
        'printer_name',
        'is_active',
        'display_order',
        'store_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relationships
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'kitchen_station_items')
                    ->withPivot('preparation_time', 'display_order')
                    ->withTimestamps();
    }

    public function queueItems()
    {
        return $this->hasMany(KitchenOrderQueue::class, 'station_id');
    }

    public function staff()
    {
        return $this->hasMany(User::class, 'kitchen_station_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForStore($query, $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    // Methods
    public function getActiveQueueCount()
    {
        return $this->queueItems()->whereIn('status', ['queued', 'in_progress'])->count();
    }

    public function getReadyItems()
    {
        return $this->queueItems()->where('status', 'ready')->get();
    }
}
```

### 8. KitchenOrderQueue Model
Kitchen display system queue

```php
<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class KitchenOrderQueue extends Model
{
    protected $table = 'kitchen_order_queue';

    protected $fillable = [
        'order_item_id',
        'station_id',
        'status',
        'priority',
        'estimated_time',
        'started_at',
        'completed_at',
        'completed_by',
        'notes',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    // Relationships
    public function orderItem()
    {
        return $this->belongsTo(RestaurantOrderItem::class, 'order_item_id');
    }

    public function station()
    {
        return $this->belongsTo(KitchenStation::class, 'station_id');
    }

    public function completedBy()
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeForStation($query, $stationId)
    {
        return $query->where('station_id', $stationId);
    }

    // Methods
    public function startPreparation()
    {
        $this->status = 'in_progress';
        $this->started_at = now();
        $this->save();
    }

    public function markAsReady()
    {
        $this->status = 'ready';
        $this->save();
    }

    public function complete($completedBy)
    {
        $this->status = 'completed';
        $this->completed_at = now();
        $this->completed_by = $completedBy;
        $this->save();
    }

    public function getPreparationTime()
    {
        if ($this->started_at && $this->completed_at) {
            return $this->started_at->diffInMinutes($this->completed_at);
        }
        return null;
    }
}
```

### 9. OrderSplit Model
Split billing functionality

```php
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
```

### 10. TableReservation Model
Table reservation management

```php
<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Userstamps;
use App\Models\Contact;
use App\Models\User;

class TableReservation extends Model
{
    use SoftDeletes, Userstamps;

    protected $table = 'table_reservations';

    protected $fillable = [
        'table_id',
        'contact_id',
        'customer_name',
        'customer_phone',
        'reservation_date',
        'reservation_time',
        'duration_minutes',
        'party_size',
        'status',
        'special_requests',
        'deposit_amount',
        'deposit_paid',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'reservation_date' => 'date',
        'reservation_time' => 'datetime',
        'deposit_amount' => 'decimal:2',
        'deposit_paid' => 'boolean',
    ];

    // Relationships
    public function table()
    {
        return $this->belongsTo(RestaurantTable::class, 'table_id');
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeForDate($query, $date)
    {
        return $query->whereDate('reservation_date', $date);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('reservation_date', '>=', today())
                    ->where('status', 'confirmed');
    }

    // Methods
    public function markAsSeated()
    {
        $this->status = 'seated';
        $this->save();
    }

    public function markAsCompleted()
    {
        $this->status = 'completed';
        $this->save();
    }

    public function markAsCancelled()
    {
        $this->status = 'cancelled';
        $this->save();
    }

    public function markAsNoShow()
    {
        $this->status = 'no_show';
        $this->save();
    }

    public function getEndTime()
    {
        return $this->reservation_time->copy()->addMinutes($this->duration_minutes);
    }

    public function conflictsWith($startTime, $duration)
    {
        $endTime = $startTime->copy()->addMinutes($duration);
        $reservationEnd = $this->getEndTime();

        return !($endTime <= $this->reservation_time || $startTime >= $reservationEnd);
    }
}
```

## Extended Existing Models

### Extended Product Model
Add restaurant-specific functionality to the existing Product model

```php
// Add to existing Product model

// Restaurant-specific relationships
public function modifierGroups()
{
    return $this->belongsToMany(MenuModifierGroup::class, 'product_modifier_groups')
                ->withPivot('is_required', 'display_order')
                ->withTimestamps();
}

public function kitchenStations()
{
    return $this->belongsToMany(KitchenStation::class, 'kitchen_station_items')
                ->withPivot('preparation_time', 'display_order')
                ->withTimestamps();
}

public function restaurantOrderItems()
{
    return $this->hasMany(RestaurantOrderItem::class);
}

// Restaurant-specific scopes
public function scopeFood($query)
{
    return $query->where('product_category', 'food');
}

public function scopeBeverage($query)
{
    return $query->where('product_category', 'beverage');
}

public function scopeKitchenItems($query)
{
    return $query->where('is_kitchen_item', true);
}

public function scopeAvailable($query)
{
    return $query->where('is_available', true);
}

// Restaurant-specific methods
public function isAvailableForRestaurant()
{
    return $this->is_active && $this->is_available;
}

public function getPreparationTime()
{
    return $this->preparation_time ?? 0;
}

public function getAllergenInfo()
{
    return $this->allergen_info ?? [];
}

public function getNutritionalInfo()
{
    return $this->nutritional_info ?? [];
}
```

### Extended Sale Model
Add restaurant-specific functionality to the existing Sale model

```php
// Add to existing Sale model

// Restaurant-specific relationships
public function restaurantOrder()
{
    return $this->belongsTo(RestaurantOrder::class, 'restaurant_order_id');
}

public function restaurantOrderItems()
{
    return $this->hasManyThrough(RestaurantOrderItem::class, RestaurantOrder::class, 'sale_id', 'order_id');
}

// Restaurant-specific scopes
public function scopeRestaurant($query)
{
    return $query->where('order_type', 'restaurant');
}

public function scopeRetail($query)
{
    return $query->where('order_type', 'retail');
}

// Restaurant-specific methods
public function isRestaurantOrder()
{
    return $this->order_type === 'restaurant';
}

public function getTipAmount()
{
    return $this->tip_amount ?? 0;
}

public function getServiceChargeAmount()
{
    return $this->service_charge_amount ?? 0;
}
```

### Extended SaleItem Model
Add restaurant-specific functionality to the existing SaleItem model

```php
// Add to existing SaleItem model

// Restaurant-specific relationships
public function restaurantOrderItem()
{
    return $this->belongsTo(RestaurantOrderItem::class, 'restaurant_order_item_id');
}

public function servedBy()
{
    return $this->belongsTo(User::class, 'served_by');
}

// Restaurant-specific scopes
public function scopeByCourse($query, $courseNumber)
{
    return $query->where('course_number', $courseNumber);
}

// Restaurant-specific methods
public function isRestaurantItem()
{
    return !is_null($this->restaurant_order_item_id);
}

public function getCourseNumber()
{
    return $this->course_number ?? 1;
}
```

### Extended User Model
Add restaurant-specific functionality to the existing User model

```php
// Add to existing User model

// Restaurant-specific relationships
public function kitchenStation()
{
    return $this->belongsTo(KitchenStation::class, 'kitchen_station_id');
}

public function waiterOrders()
{
    return $this->hasMany(RestaurantOrder::class, 'waiter_id');
}

public function createdReservations()
{
    return $this->hasMany(TableReservation::class, 'created_by');
}

public function servedItems()
{
    return $this->hasMany(SaleItem::class, 'served_by');
}

// Restaurant-specific scopes
public function scopeWaiters($query)
{
    return $query->where('employee_role', 'waiter');
}

public function scopeKitchenStaff($query)
{
    return $query->where('employee_role', 'kitchen');
}

public function scopeHosts($query)
{
    return $query->where('employee_role', 'host');
}

// Restaurant-specific methods
public function isWaiter()
{
    return $this->employee_role === 'waiter';
}

public function isKitchenStaff()
{
    return $this->employee_role === 'kitchen';
}

public function isHost()
{
    return $this->employee_role === 'host';
}

public function canTakeOrders()
{
    return $this->can_take_orders ?? false;
}

public function canProcessPayments()
{
    return $this->can_process_payments ?? false;
}

public function canManageTables()
{
    return $this->can_manage_tables ?? false;
}
```

## Model Relationships Summary

```
RestaurantTable
├── belongsTo TableSection
├── belongsTo Store
├── hasMany RestaurantOrder
└── hasMany TableReservation

RestaurantOrder
├── belongsTo RestaurantTable
├── belongsTo User (waiter)
├── belongsTo Store
├── belongsTo Sale
├── hasMany RestaurantOrderItem
└── hasMany OrderSplit

RestaurantOrderItem
├── belongsTo RestaurantOrder
├── belongsTo Product
├── belongsTo ProductBatch
├── hasMany RestaurantOrderItemModifier
└── hasMany KitchenOrderQueue

MenuModifier
├── belongsTo Store
├── belongsToMany MenuModifierGroup
└── hasMany RestaurantOrderItemModifier

MenuModifierGroup
├── belongsTo Store
├── belongsToMany MenuModifier
├── belongsToMany Product

KitchenStation
├── belongsTo Store
├── belongsToMany Product
├── hasMany KitchenOrderQueue
└── hasMany User

OrderSplit
├── belongsTo RestaurantOrder
├── belongsTo Contact
└── hasMany OrderSplitItem

TableReservation
├── belongsTo RestaurantTable
├── belongsTo Contact
└── belongsTo User
```

## Model Events and Observers

### RestaurantOrderObserver
```php
<?php

namespace App\Observers\Restaurant;

use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantTable;

class RestaurantOrderObserver
{
    public function created(RestaurantOrder $order)
    {
        // Generate order number
        $order->order_number = 'ORD-' . date('Y-m-d') . '-' . str_pad($order->id, 4, '0', STR_PAD_LEFT);
        $order->save();
    }

    public function updated(RestaurantOrder $order)
    {
        // Update table status based on order status
        if ($order->wasChanged('status')) {
            if ($order->status === 'completed') {
                $order->table->markAsAvailable();
            }
        }
    }
}
```

### RestaurantOrderItemObserver
```php
<?php

namespace App\Observers\Restaurant;

use App\Models\Restaurant\RestaurantOrderItem;
use App\Models\Restaurant\KitchenOrderQueue;

class RestaurantOrderItemObserver
{
    public function created(RestaurantOrderItem $item)
    {
        // Add to kitchen queue for each station
        foreach ($item->product->kitchenStations as $station) {
            KitchenOrderQueue::create([
                'order_item_id' => $item->id,
                'station_id' => $station->id,
                'status' => 'queued',
                'priority' => $item->order->priority,
            ]);
        }
    }
}
```

These models provide a comprehensive foundation for restaurant POS operations while maintaining compatibility with the existing InfoShop POS system.