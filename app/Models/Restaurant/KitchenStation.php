<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use App\Models\Store;
use App\Models\User;
use App\Models\Product;

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