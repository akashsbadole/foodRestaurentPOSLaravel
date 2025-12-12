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