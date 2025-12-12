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
                if ($order->table) {
                    $order->table->markAsAvailable();
                }
            }
        }
    }
}