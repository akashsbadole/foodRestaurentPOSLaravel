<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;

class RestaurantOrderItemModifier extends Model
{
    protected $table = 'restaurant_order_item_modifiers';

    protected $fillable = [
        'order_item_id',
        'modifier_id',
        'quantity',
        'price_adjustment',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'price_adjustment' => 'decimal:2',
    ];

    // Relationships
    public function orderItem()
    {
        return $this->belongsTo(RestaurantOrderItem::class, 'order_item_id');
    }

    public function modifier()
    {
        return $this->belongsTo(MenuModifier::class, 'modifier_id');
    }
}