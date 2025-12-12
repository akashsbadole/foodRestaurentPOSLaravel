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