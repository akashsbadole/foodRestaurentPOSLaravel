<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;

class OrderSplitItem extends Model
{
    protected $table = 'order_split_items';

    protected $fillable = [
        'split_id',
        'order_item_id',
        'quantity',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
    ];

    // Relationships
    public function split()
    {
        return $this->belongsTo(OrderSplit::class, 'split_id');
    }

    public function orderItem()
    {
        return $this->belongsTo(RestaurantOrderItem::class, 'order_item_id');
    }
}