<?php

namespace App\Services\Restaurant;

use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantOrderItem;
use App\Models\Restaurant\KitchenOrderQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;

class OrderRealTimeService
{
    /**
     * Broadcast order modification to all connected clients
     */
    public function broadcastOrderModification(RestaurantOrder $order, $modificationType, $data = [])
    {
        $broadcastData = [
            'type' => 'order_modification',
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'modification_type' => $modificationType,
            'data' => $data,
            'timestamp' => now()->toISOString(),
            'order_status' => $order->status,
            'modification_status' => $order->getModificationStatus(),
        ];

        // Broadcast to specific channels based on modification type
        $this->broadcastToChannels($broadcastData, [
            'orders.' . $order->id,
            'tables.' . $order->table_id,
            'store.' . $order->store_id . '.orders',
            'kitchen.' . $order->store_id,
        ]);

        // Update cache for quick access
        $this->updateOrderCache($order);

        Log::info('Order modification broadcasted', [
            'order_id' => $order->id,
            'modification_type' => $modificationType,
            'channels' => ['orders.' . $order->id, 'tables.' . $order->table_id, 'store.' . $order->store_id . '.orders', 'kitchen.' . $order->store_id]
        ]);
    }

    /**
     * Broadcast item modification to relevant clients
     */
    public function broadcastItemModification(RestaurantOrderItem $orderItem, $modificationType, $data = [])
    {
        $order = $orderItem->order;
        
        $broadcastData = [
            'type' => 'item_modification',
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'item_id' => $orderItem->id,
            'product_name' => $orderItem->product->name,
            'modification_type' => $modificationType,
            'data' => $data,
            'timestamp' => now()->toISOString(),
            'item_status' => $orderItem->status,
            'modification_status' => $orderItem->getModificationStatus(),
        ];

        // Broadcast to specific channels
        $this->broadcastToChannels($broadcastData, [
            'orders.' . $order->id,
            'items.' . $orderItem->id,
            'tables.' . $order->table_id,
            'store.' . $order->store_id . '.orders',
            'kitchen.' . $order->store_id,
        ]);

        // Update item cache
        $this->updateItemCache($orderItem);

        Log::info('Item modification broadcasted', [
            'order_id' => $order->id,
            'item_id' => $orderItem->id,
            'modification_type' => $modificationType
        ]);
    }

    /**
     * Broadcast KOT updates to kitchen displays
     */
    public function broadcastKOTUpdate(KitchenOrderQueue $kot, $updateType, $data = [])
    {
        $orderItem = $kot->orderItem;
        $order = $orderItem ? $orderItem->order : null;

        $broadcastData = [
            'type' => 'kot_update',
            'kot_id' => $kot->id,
            'kot_number' => $kot->kot_number,
            'update_type' => $updateType,
            'data' => $data,
            'timestamp' => now()->toISOString(),
            'kot_status' => $kot->status,
            'station_id' => $kot->station_id,
            'station_name' => $kot->station->name,
        ];

        if ($order) {
            $broadcastData['order_id'] = $order->id;
            $broadcastData['order_number'] = $order->order_number;
            $broadcastData['item_id'] = $orderItem->id;
            $broadcastData['product_name'] = $orderItem->product->name;
        }

        // Broadcast to kitchen-specific channels
        $this->broadcastToChannels($broadcastData, [
            'kitchen.' . ($order ? $order->store_id : 'global'),
            'station.' . $kot->station_id,
            'kots.' . $kot->id,
        ]);

        // Update KOT cache
        $this->updateKOTCache($kot);

        Log::info('KOT update broadcasted', [
            'kot_id' => $kot->id,
            'update_type' => $updateType,
            'station_id' => $kot->station_id
        ]);
    }

    /**
     * Broadcast table status changes
     */
    public function broadcastTableStatusUpdate($tableId, $status, $data = [])
    {
        $broadcastData = [
            'type' => 'table_status_update',
            'table_id' => $tableId,
            'status' => $status,
            'data' => $data,
            'timestamp' => now()->toISOString(),
        ];

        // Broadcast to table-specific channels
        $this->broadcastToChannels($broadcastData, [
            'tables.' . $tableId,
            'store.global.tables',
            'waitstaff.global',
        ]);

        // Update table cache
        $this->updateTableCache($tableId, $status, $data);

        Log::info('Table status update broadcasted', [
            'table_id' => $tableId,
            'status' => $status
        ]);
    }

    /**
     * Broadcast order status changes
     */
    public function broadcastOrderStatusUpdate(RestaurantOrder $order, $oldStatus, $newStatus)
    {
        $broadcastData = [
            'type' => 'order_status_update',
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
            'timestamp' => now()->toISOString(),
            'modification_status' => $order->getModificationStatus(),
        ];

        // Broadcast to relevant channels
        $this->broadcastToChannels($broadcastData, [
            'orders.' . $order->id,
            'tables.' . $order->table_id,
            'store.' . $order->store_id . '.orders',
            'kitchen.' . $order->store_id,
        ]);

        // Update order cache
        $this->updateOrderCache($order);

        Log::info('Order status update broadcasted', [
            'order_id' => $order->id,
            'old_status' => $oldStatus,
            'new_status' => $newStatus
        ]);
    }

    /**
     * Broadcast kitchen queue updates
     */
    public function broadcastKitchenQueueUpdate($storeId, $stationId = null)
    {
        $query = KitchenOrderQueue::whereHas('orderItem.order', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            });

        if ($stationId) {
            $query->where('station_id', $stationId);
        }

        $kots = $query->with(['orderItem.product', 'station'])
            ->orderBy('priority_score', 'desc')
            ->get();

        $broadcastData = [
            'type' => 'kitchen_queue_update',
            'store_id' => $storeId,
            'station_id' => $stationId,
            'kots' => $kots->map(function($kot) {
                return $kot->getRealTimeStatus();
            }),
            'timestamp' => now()->toISOString(),
        ];

        // Broadcast to kitchen channels
        $channels = ['kitchen.' . $storeId];
        if ($stationId) {
            $channels[] = 'station.' . $stationId;
        }

        $this->broadcastToChannels($broadcastData, $channels);

        // Update queue cache
        $this->updateQueueCache($storeId, $stationId, $kots);

        Log::info('Kitchen queue update broadcasted', [
            'store_id' => $storeId,
            'station_id' => $stationId,
            'kot_count' => $kots->count()
        ]);
    }

    /**
     * Send real-time notification to specific users
     */
    public function sendUserNotification($userId, $notificationType, $data = [])
    {
        $broadcastData = [
            'type' => 'user_notification',
            'user_id' => $userId,
            'notification_type' => $notificationType,
            'data' => $data,
            'timestamp' => now()->toISOString(),
        ];

        // Broadcast to user-specific channel
        $this->broadcastToChannels($broadcastData, [
            'user.' . $userId,
        ]);

        Log::info('User notification sent', [
            'user_id' => $userId,
            'notification_type' => $notificationType
        ]);
    }

    /**
     * Broadcast to multiple channels efficiently
     */
    private function broadcastToChannels($data, $channels)
    {
        foreach ($channels as $channel) {
            // This would typically use WebSocket, Pusher, or similar real-time service
            // For now, we'll simulate the broadcast with logging
            
            Queue::push(function() use ($channel, $data) {
                // Simulate broadcast delay
                usleep(100000); // 100ms delay
                
                Log::debug('Broadcast to channel', [
                    'channel' => $channel,
                    'data_type' => $data['type'],
                    'timestamp' => $data['timestamp']
                ]);
            });
        }
    }

    /**
     * Update order cache for quick access
     */
    private function updateOrderCache(RestaurantOrder $order)
    {
        $cacheKey = "order_{$order->id}_realtime";
        $cacheData = [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'status' => $order->status,
            'modification_status' => $order->getModificationStatus(),
            'total_amount' => $order->total_amount,
            'updated_at' => $order->updated_at->toISOString(),
            'items_count' => $order->items->count(),
        ];

        Cache::put($cacheKey, $cacheData, now()->addMinutes(30));
    }

    /**
     * Update item cache for quick access
     */
    private function updateItemCache(RestaurantOrderItem $orderItem)
    {
        $cacheKey = "order_item_{$orderItem->id}_realtime";
        $cacheData = [
            'id' => $orderItem->id,
            'product_name' => $orderItem->product->name,
            'quantity' => $orderItem->quantity,
            'status' => $orderItem->status,
            'modification_status' => $orderItem->getModificationStatus(),
            'updated_at' => $orderItem->updated_at->toISOString(),
        ];

        Cache::put($cacheKey, $cacheData, now()->addMinutes(30));
    }

    /**
     * Update KOT cache for quick access
     */
    private function updateKOTCache(KitchenOrderQueue $kot)
    {
        $cacheKey = "kot_{$kot->id}_realtime";
        $cacheData = [
            'id' => $kot->id,
            'kot_number' => $kot->kot_number,
            'status' => $kot->status,
            'priority' => $kot->priority,
            'station_id' => $kot->station_id,
            'updated_at' => $kot->updated_at->toISOString(),
        ];

        Cache::put($cacheKey, $cacheData, now()->addMinutes(30));
    }

    /**
     * Update table cache for quick access
     */
    private function updateTableCache($tableId, $status, $data = [])
    {
        $cacheKey = "table_{$tableId}_realtime";
        $cacheData = [
            'table_id' => $tableId,
            'status' => $status,
            'data' => $data,
            'updated_at' => now()->toISOString(),
        ];

        Cache::put($cacheKey, $cacheData, now()->addMinutes(30));
    }

    /**
     * Update queue cache for quick access
     */
    private function updateQueueCache($storeId, $stationId, $kots)
    {
        $cacheKey = $stationId 
            ? "queue_store_{$storeId}_station_{$stationId}_realtime"
            : "queue_store_{$storeId}_realtime";
            
        $cacheData = [
            'store_id' => $storeId,
            'station_id' => $stationId,
            'kots' => $kots->map(function($kot) {
                return [
                    'id' => $kot->id,
                    'status' => $kot->status,
                    'priority' => $kot->priority,
                    'product_name' => $kot->orderItem->product->name,
                ];
            })->toArray(),
            'updated_at' => now()->toISOString(),
        ];

        Cache::put($cacheKey, $cacheData, now()->addMinutes(5));
    }

    /**
     * Get real-time order data from cache
     */
    public function getOrderRealTimeData($orderId)
    {
        $cacheKey = "order_{$orderId}_realtime";
        return Cache::get($cacheKey);
    }

    /**
     * Get real-time item data from cache
     */
    public function getItemRealTimeData($itemId)
    {
        $cacheKey = "order_item_{$itemId}_realtime";
        return Cache::get($cacheKey);
    }

    /**
     * Get real-time KOT data from cache
     */
    public function getKOTRealTimeData($kotId)
    {
        $cacheKey = "kot_{$kotId}_realtime";
        return Cache::get($cacheKey);
    }

    /**
     * Get real-time table data from cache
     */
    public function getTableRealTimeData($tableId)
    {
        $cacheKey = "table_{$tableId}_realtime";
        return Cache::get($cacheKey);
    }

    /**
     * Get real-time queue data from cache
     */
    public function getQueueRealTimeData($storeId, $stationId = null)
    {
        $cacheKey = $stationId 
            ? "queue_store_{$storeId}_station_{$stationId}_realtime"
            : "queue_store_{$storeId}_realtime";
            
        return Cache::get($cacheKey);
    }

    /**
     * Clear real-time cache for specific entity
     */
    public function clearRealTimeCache($entityType, $entityId)
    {
        $cacheKey = "{$entityType}_{$entityId}_realtime";
        Cache::forget($cacheKey);
        
        Log::info('Real-time cache cleared', [
            'entity_type' => $entityType,
            'entity_id' => $entityId
        ]);
    }

    /**
     * Get comprehensive real-time dashboard data
     */
    public function getDashboardRealTimeData($storeId)
    {
        return [
            'store_id' => $storeId,
            'timestamp' => now()->toISOString(),
            'orders' => $this->getActiveOrdersRealTime($storeId),
            'kitchen_queues' => $this->getKitchenQueuesRealTime($storeId),
            'tables' => $this->getTablesRealTime($storeId),
            'notifications' => $this->getActiveNotificationsRealTime($storeId),
        ];
    }

    /**
     * Get active orders real-time data
     */
    private function getActiveOrdersRealTime($storeId)
    {
        $orders = RestaurantOrder::forStore($storeId)
            ->whereIn('status', ['pending', 'confirmed', 'preparing', 'ready'])
            ->with(['table', 'items.product'])
            ->get();

        return $orders->map(function($order) {
            return [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'status' => $order->status,
                'table_number' => $order->table ? $order->table->table_number : null,
                'items_count' => $order->items->count(),
                'total_amount' => $order->total_amount,
                'modification_status' => $order->getModificationStatus(),
            ];
        })->toArray();
    }

    /**
     * Get kitchen queues real-time data
     */
    private function getKitchenQueuesRealTime($storeId)
    {
        $stations = \App\Models\Restaurant\KitchenStation::where('store_id', $storeId)
            ->with(['kots.orderItem.product'])
            ->get();

        return $stations->map(function($station) {
            return [
                'id' => $station->id,
                'name' => $station->name,
                'active_kots' => $station->kots->whereIn('status', ['queued', 'in_progress'])->count(),
                'kots' => $station->kots->map(function($kot) {
                    return [
                        'id' => $kot->id,
                        'kot_number' => $kot->kot_number,
                        'status' => $kot->status,
                        'priority' => $kot->priority,
                        'product_name' => $kot->orderItem->product->name,
                    ];
                })->toArray(),
            ];
        })->toArray();
    }

    /**
     * Get tables real-time data
     */
    private function getTablesRealTime($storeId)
    {
        $tables = \App\Models\Restaurant\RestaurantTable::where('store_id', $storeId)
            ->with(['section', 'currentOrder'])
            ->get();

        return $tables->map(function($table) {
            return [
                'id' => $table->id,
                'table_number' => $table->table_number,
                'name' => $table->name,
                'status' => $table->status,
                'capacity' => $table->capacity,
                'current_order' => $table->currentOrder ? [
                    'id' => $table->currentOrder->id,
                    'order_number' => $table->currentOrder->order_number,
                    'status' => $table->currentOrder->status,
                ] : null,
            ];
        })->toArray();
    }

    /**
     * Get active notifications real-time data
     */
    private function getActiveNotificationsRealTime($storeId)
    {
        // This would typically query a notifications table
        // For now, we'll return an empty array
        return [];
    }
}