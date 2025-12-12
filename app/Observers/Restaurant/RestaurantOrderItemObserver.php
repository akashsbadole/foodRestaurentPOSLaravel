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