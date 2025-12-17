<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductStock;
use App\Models\ProductBatch;
use App\Models\Store;
use App\Models\User;
use App\Services\InventoryAlertService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class InventoryRealTimeService
{
    protected InventoryAlertService $alertService;

    public function __construct(InventoryAlertService $alertService)
    {
        $this->alertService = $alertService;
    }

    /**
     * Broadcast stock level changes in real-time
     */
    public function broadcastStockChange(array $stockData): array
    {
        try {
            $channel = 'inventory-updates';
            $event = 'stock-level-changed';
            
            // Prepare broadcast data
            $broadcastData = [
                'event' => $event,
                'timestamp' => now()->toISOString(),
                'store_id' => $stockData['store_id'],
                'product_id' => $stockData['product_id'],
                'product_name' => $stockData['product_name'],
                'sku' => $stockData['sku'] ?? null,
                'previous_quantity' => $stockData['previous_quantity'],
                'new_quantity' => $stockData['new_quantity'],
                'change_type' => $stockData['change_type'], // 'increase', 'decrease', 'reserve', 'release'
                'change_amount' => $stockData['change_amount'],
                'available_quantity' => $stockData['available_quantity'],
                'reserved_quantity' => $stockData['reserved_quantity'],
                'batch_info' => $stockData['batch_info'] ?? null,
                'triggered_by' => $stockData['triggered_by'] ?? 'system',
                'reason' => $stockData['reason'] ?? 'Stock update',
            ];

            // Broadcast to specific channels
            $this->broadcastToChannels($channel, $broadcastData, [
                "store-{$stockData['store_id']}",
                "product-{$stockData['product_id']}",
                "inventory-managers",
                "kitchen-staff",
            ]);

            // Cache latest stock state
            $this->cacheStockState($stockData['product_id'], $stockData['store_id'], $broadcastData);

            // Check if alerts should be triggered
            $this->checkAndTriggerAlerts($stockData);

            Log::info('Stock change broadcasted', [
                'product_id' => $stockData['product_id'],
                'store_id' => $stockData['store_id'],
                'change_type' => $stockData['change_type'],
                'change_amount' => $stockData['change_amount'],
            ]);

            return [
                'success' => true,
                'message' => 'Stock change broadcasted successfully',
                'data' => $broadcastData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to broadcast stock change', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to broadcast stock change: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Broadcast batch updates
     */
    public function broadcastBatchUpdate(array $batchData): array
    {
        try {
            $channel = 'inventory-updates';
            $event = 'batch-updated';
            
            $broadcastData = [
                'event' => $event,
                'timestamp' => now()->toISOString(),
                'batch_id' => $batchData['batch_id'],
                'batch_number' => $batchData['batch_number'],
                'product_id' => $batchData['product_id'],
                'product_name' => $batchData['product_name'],
                'previous_quantity' => $batchData['previous_quantity'],
                'new_quantity' => $batchData['new_quantity'],
                'change_amount' => $batchData['change_amount'],
                'expiry_date' => $batchData['expiry_date'],
                'cost' => $batchData['cost'],
                'total_value' => $batchData['new_quantity'] * $batchData['cost'],
                'store_id' => $batchData['store_id'],
                'triggered_by' => $batchData['triggered_by'] ?? 'system',
                'reason' => $batchData['reason'] ?? 'Batch update',
            ];

            $this->broadcastToChannels($channel, $broadcastData, [
                "store-{$batchData['store_id']}",
                "product-{$batchData['product_id']}",
                "batch-{$batchData['batch_id']}",
                "inventory-managers",
            ]);

            Log::info('Batch update broadcasted', [
                'batch_id' => $batchData['batch_id'],
                'product_id' => $batchData['product_id'],
                'change_amount' => $batchData['change_amount'],
            ]);

            return [
                'success' => true,
                'message' => 'Batch update broadcasted successfully',
                'data' => $broadcastData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to broadcast batch update', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to broadcast batch update: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Broadcast low stock alert
     */
    public function broadcastLowStockAlert(array $alertData): array
    {
        try {
            $channel = 'inventory-alerts';
            $event = 'low-stock-alert';
            
            $broadcastData = [
                'event' => $event,
                'timestamp' => now()->toISOString(),
                'alert_id' => $alertData['alert_id'],
                'store_id' => $alertData['store_id'],
                'product_id' => $alertData['product_id'],
                'product_name' => $alertData['product_name'],
                'sku' => $alertData['sku'] ?? null,
                'current_stock' => $alertData['current_stock'],
                'alert_threshold' => $alertData['alert_threshold'],
                'severity' => $alertData['severity'], // 'critical', 'warning'
                'shortfall' => $alertData['shortfall'],
                'days_of_stock' => $alertData['days_of_stock'],
                'suggested_reorder_quantity' => $alertData['suggested_reorder_quantity'],
                'requires_immediate_action' => $alertData['severity'] === 'critical',
            ];

            $this->broadcastToChannels($channel, $broadcastData, [
                "store-{$alertData['store_id']}",
                "product-{$alertData['product_id']}",
                "inventory-managers",
                "purchasing-department",
            ]);

            // Send immediate notifications for critical alerts
            if ($alertData['severity'] === 'critical') {
                $this->sendImmediateNotification($broadcastData);
            }

            Log::info('Low stock alert broadcasted', [
                'product_id' => $alertData['product_id'],
                'store_id' => $alertData['store_id'],
                'severity' => $alertData['severity'],
            ]);

            return [
                'success' => true,
                'message' => 'Low stock alert broadcasted successfully',
                'data' => $broadcastData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to broadcast low stock alert', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to broadcast low stock alert: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Broadcast expiration alert
     */
    public function broadcastExpirationAlert(array $alertData): array
    {
        try {
            $channel = 'inventory-alerts';
            $event = 'expiration-alert';
            
            $broadcastData = [
                'event' => $event,
                'timestamp' => now()->toISOString(),
                'alert_id' => $alertData['alert_id'],
                'store_id' => $alertData['store_id'],
                'batch_id' => $alertData['batch_id'],
                'batch_number' => $alertData['batch_number'],
                'product_id' => $alertData['product_id'],
                'product_name' => $alertData['product_name'],
                'sku' => $alertData['sku'] ?? null,
                'quantity' => $alertData['quantity'],
                'expiry_date' => $alertData['expiry_date'],
                'days_until_expiry' => $alertData['days_until_expiry'],
                'severity' => $alertData['severity'],
                'total_value' => $alertData['total_value'],
                'suggested_action' => $alertData['suggested_action'],
                'requires_immediate_action' => $alertData['days_until_expiry'] <= 1,
            ];

            $this->broadcastToChannels($channel, $broadcastData, [
                "store-{$alertData['store_id']}",
                "product-{$alertData['product_id']}",
                "batch-{$alertData['batch_id']}",
                "inventory-managers",
                "kitchen-staff",
            ]);

            // Send immediate notifications for critical expiration
            if ($alertData['days_until_expiry'] <= 1) {
                $this->sendImmediateNotification($broadcastData);
            }

            Log::info('Expiration alert broadcasted', [
                'batch_id' => $alertData['batch_id'],
                'product_id' => $alertData['product_id'],
                'days_until_expiry' => $alertData['days_until_expiry'],
            ]);

            return [
                'success' => true,
                'message' => 'Expiration alert broadcasted successfully',
                'data' => $broadcastData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to broadcast expiration alert', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to broadcast expiration alert: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Broadcast reorder suggestion
     */
    public function broadcastReorderSuggestion(array $suggestionData): array
    {
        try {
            $channel = 'inventory-alerts';
            $event = 'reorder-suggestion';
            
            $broadcastData = [
                'event' => $event,
                'timestamp' => now()->toISOString(),
                'suggestion_id' => $suggestionData['suggestion_id'],
                'store_id' => $suggestionData['store_id'],
                'product_id' => $suggestionData['product_id'],
                'product_name' => $suggestionData['product_name'],
                'sku' => $suggestionData['sku'] ?? null,
                'current_stock' => $suggestionData['current_stock'],
                'reorder_point' => $suggestionData['reorder_point'],
                'suggested_quantity' => $suggestionData['suggested_quantity'],
                'priority' => $suggestionData['priority'],
                'days_of_stock' => $suggestionData['days_of_stock'],
                'daily_usage' => $suggestionData['daily_usage'],
                'estimated_cost' => $suggestionData['estimated_cost'],
                'supplier_info' => $suggestionData['supplier_info'],
            ];

            $this->broadcastToChannels($channel, $broadcastData, [
                "store-{$suggestionData['store_id']}",
                "product-{$suggestionData['product_id']}",
                "inventory-managers",
                "purchasing-department",
            ]);

            Log::info('Reorder suggestion broadcasted', [
                'product_id' => $suggestionData['product_id'],
                'store_id' => $suggestionData['store_id'],
                'priority' => $suggestionData['priority'],
            ]);

            return [
                'success' => true,
                'message' => 'Reorder suggestion broadcasted successfully',
                'data' => $broadcastData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to broadcast reorder suggestion', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to broadcast reorder suggestion: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get real-time stock dashboard data
     */
    public function getRealTimeDashboard(int $storeId): array
    {
        try {
            // Get current stock levels
            $stockLevels = ProductStock::where('store_id', $storeId)
                ->with(['product', 'batch'])
                ->get()
                ->map(function ($stock) {
                    return [
                        'product_id' => $stock->product_id,
                        'product_name' => $stock->product->name,
                        'sku' => $stock->product->sku,
                        'total_quantity' => $stock->quantity,
                        'available_quantity' => $stock->available_quantity,
                        'reserved_quantity' => $stock->reserved_quantity,
                        'status' => $stock->getStockStatus(),
                        'stock_health' => $stock->getStockHealthPercentage(),
                        'last_updated' => $stock->updated_at,
                        'batch_info' => $stock->batch ? [
                            'batch_number' => $stock->batch->batch_number,
                            'expiry_date' => $stock->batch->expiry_date,
                            'days_until_expiry' => $stock->batch->expiry_date ? 
                                Carbon::now()->diffInDays($stock->batch->expiry_date) : null,
                        ] : null,
                    ];
                });

            // Get recent transactions
            $recentTransactions = DB::table('inventory_transaction_items')
                ->join('inventory_transactions', 'inventory_transaction_items.inventory_transaction_id', '=', 'inventory_transactions.id')
                ->join('products', 'inventory_transaction_items.product_id', '=', 'products.id')
                ->where('inventory_transactions.store_id', $storeId)
                ->where('inventory_transactions.created_at', '>', now()->subMinutes(30))
                ->select([
                    'inventory_transactions.id',
                    'inventory_transactions.transaction_type',
                    'inventory_transactions.created_at',
                    'products.name as product_name',
                    'inventory_transaction_items.quantity',
                    'inventory_transaction_items.unit_cost',
                ])
                ->orderBy('inventory_transactions.created_at', 'desc')
                ->limit(20)
                ->get();

            // Get active alerts
            $activeAlerts = $this->getActiveAlerts($storeId);

            // Get system metrics
            $systemMetrics = $this->getSystemMetrics($storeId);

            $dashboardData = [
                'store_id' => $storeId,
                'generated_at' => now()->toISOString(),
                'stock_levels' => $stockLevels,
                'recent_transactions' => $recentTransactions,
                'active_alerts' => $activeAlerts,
                'system_metrics' => $systemMetrics,
                'summary' => [
                    'total_products' => $stockLevels->count(),
                    'low_stock_items' => $stockLevels->where('status', 'low_stock')->count(),
                    'out_of_stock_items' => $stockLevels->where('status', 'out_of_stock')->count(),
                    'expiring_soon_items' => $stockLevels->filter(function($stock) {
                        return isset($stock['batch_info']['days_until_expiry']) && 
                               $stock['batch_info']['days_until_expiry'] <= 7;
                    })->count(),
                    'total_alerts' => count($activeAlerts),
                    'critical_alerts' => collect($activeAlerts)->where('severity', 'critical')->count(),
                ],
            ];

            return [
                'success' => true,
                'data' => $dashboardData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get real-time dashboard', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to get real-time dashboard: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Subscribe user to inventory updates
     */
    public function subscribeToUpdates(int $userId, array $preferences): array
    {
        try {
            // Store subscription preferences
            $subscriptionData = [
                'user_id' => $userId,
                'preferences' => $preferences,
                'subscribed_at' => now()->toISOString(),
                'channels' => $this->getUserChannels($userId, $preferences),
            ];

            // Cache subscription
            Cache::put("inventory-subscription-{$userId}", $subscriptionData, 3600); // 1 hour

            Log::info('User subscribed to inventory updates', [
                'user_id' => $userId,
                'preferences' => $preferences,
            ]);

            return [
                'success' => true,
                'message' => 'Successfully subscribed to inventory updates',
                'data' => $subscriptionData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to subscribe to inventory updates', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to subscribe to inventory updates: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Broadcast to specific channels
     */
    private function broadcastToChannels(string $channel, array $data, array $channels): void
    {
        foreach ($channels as $channelName) {
            try {
                Broadcast::channel($channelName)->broadcast($data);
            } catch (\Exception $e) {
                Log::error('Failed to broadcast to channel', [
                    'channel' => $channelName,
                    'error' => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * Cache stock state
     */
    private function cacheStockState(int $productId, int $storeId, array $data): void
    {
        $cacheKey = "stock-state-{$productId}-{$storeId}";
        Cache::put($cacheKey, $data, 300); // 5 minutes
    }

    /**
     * Check and trigger alerts based on stock changes
     */
    private function checkAndTriggerAlerts(array $stockData): void
    {
        $productId = $stockData['product_id'];
        $storeId = $stockData['store_id'];
        $newQuantity = $stockData['available_quantity'];

        // Check for low stock
        $product = Product::find($productId);
        if ($product && $product->alert_quantity && $newQuantity <= $product->alert_quantity) {
            $alertData = [
                'alert_id' => 'low-stock-' . time(),
                'product_id' => $productId,
                'product_name' => $stockData['product_name'],
                'sku' => $stockData['sku'] ?? null,
                'store_id' => $storeId,
                'current_stock' => $newQuantity,
                'alert_threshold' => $product->alert_quantity,
                'severity' => $newQuantity <= 0 ? 'critical' : 'warning',
                'shortfall' => max(0, $product->alert_quantity - $newQuantity),
                'days_of_stock' => $this->calculateDaysOfStock($productId, $storeId, $newQuantity),
                'suggested_reorder_quantity' => $product->alert_quantity * 2 - $newQuantity,
            ];

            $this->broadcastLowStockAlert($alertData);
        }

        // Check for batch expiration
        if (isset($stockData['batch_info']) && $stockData['batch_info']['days_until_expiry'] <= 7) {
            $alertData = [
                'alert_id' => 'expiration-' . time(),
                'batch_id' => $stockData['batch_info']['batch_id'] ?? null,
                'batch_number' => $stockData['batch_info']['batch_number'] ?? null,
                'product_id' => $productId,
                'product_name' => $stockData['product_name'],
                'sku' => $stockData['sku'] ?? null,
                'store_id' => $storeId,
                'quantity' => $stockData['batch_info']['quantity'] ?? $newQuantity,
                'expiry_date' => $stockData['batch_info']['expiry_date'],
                'days_until_expiry' => $stockData['batch_info']['days_until_expiry'],
                'severity' => $stockData['batch_info']['days_until_expiry'] <= 1 ? 'critical' : 'warning',
                'total_value' => ($stockData['batch_info']['quantity'] ?? $newQuantity) * ($stockData['batch_info']['cost'] ?? 0),
                'suggested_action' => $this->getExpirationSuggestedAction($stockData['batch_info']['days_until_expiry']),
            ];

            $this->broadcastExpirationAlert($alertData);
        }
    }

    /**
     * Calculate days of stock
     */
    private function calculateDaysOfStock(int $productId, int $storeId, float $currentStock): float
    {
        // Get average daily usage
        $dailyUsage = DB::table('inventory_transaction_items')
            ->join('inventory_transactions', 'inventory_transaction_items.inventory_transaction_id', '=', 'inventory_transactions.id')
            ->where('inventory_transaction_items.product_id', $productId)
            ->where('inventory_transactions.store_id', $storeId)
            ->where('inventory_transactions.transaction_type', 'sale')
            ->where('inventory_transactions.created_at', '>=', now()->subDays(30))
            ->sum('inventory_transaction_items.quantity');

        $avgDailyUsage = abs($dailyUsage) / 30;
        
        return $avgDailyUsage > 0 ? floor($currentStock / $avgDailyUsage) : 999;
    }

    /**
     * Get suggested action for expiring items
     */
    private function getExpirationSuggestedAction(int $daysUntilExpiry): string
    {
        if ($daysUntilExpiry <= 1) {
            return 'Immediate use or discount required';
        } elseif ($daysUntilExpiry <= 3) {
            return 'Promote immediately';
        } elseif ($daysUntilExpiry <= 7) {
            return 'Feature in daily specials';
        } else {
            return 'Monitor closely';
        }
    }

    /**
     * Get active alerts for a store
     */
    private function getActiveAlerts(int $storeId): array
    {
        // This would query an active alerts table
        // For now, return empty array as placeholder
        return [];
    }

    /**
     * Get system metrics
     */
    private function getSystemMetrics(int $storeId): array
    {
        return [
            'total_products' => Product::where('track_inventory', true)->count(),
            'total_stock_value' => ProductStock::where('store_id', $storeId)
                ->with('product')
                ->get()
                ->sum(function ($stock) {
                    return $stock->available_quantity * ($stock->product->cost_price ?? 0);
                }),
            'last_sync_time' => now()->toISOString(),
            'connected_users' => Cache::get("connected-users-{$storeId}", 0),
            'api_calls_today' => $this->getAPICallsCount($storeId),
        ];
    }

    /**
     * Get API calls count for today
     */
    private function getAPICallsCount(int $storeId): int
    {
        // This would track API calls in a metrics table
        // For now, return 0 as placeholder
        return 0;
    }

    /**
     * Get user channels based on preferences
     */
    private function getUserChannels(int $userId, array $preferences): array
    {
        $channels = ["user-{$userId}"];

        if ($preferences['low_stock'] ?? true) {
            $channels[] = 'low-stock-alerts';
        }

        if ($preferences['expiration'] ?? true) {
            $channels[] = 'expiration-alerts';
        }

        if ($preferences['reorder'] ?? true) {
            $channels[] = 'reorder-suggestions';
        }

        return $channels;
    }

    /**
     * Send immediate notification
     */
    private function sendImmediateNotification(array $data): void
    {
        // This would integrate with your notification system
        // Could send email, SMS, push notification, etc.
        Log::info('Immediate notification sent', $data);
    }

    /**
     * Process real-time inventory sync
     */
    public function processInventorySync(int $storeId, array $syncData): array
    {
        try {
            $processedItems = [];
            $errors = [];

            foreach ($syncData as $item) {
                $productId = $item['product_id'];
                $newQuantity = $item['quantity'];
                $batchInfo = $item['batch_info'] ?? null;

                // Get current stock
                $stock = ProductStock::where('product_id', $productId)
                    ->where('store_id', $storeId)
                    ->first();

                if (!$stock) {
                    $errors[] = "Product {$productId} not found in store {$storeId}";
                    continue;
                }

                $previousQuantity = $stock->available_quantity;

                // Update stock
                $stock->quantity = $newQuantity;
                $stock->available_quantity = $newQuantity - $stock->reserved_quantity;
                $stock->save();

                // Update batch if provided
                if ($batchInfo && isset($batchInfo['batch_id'])) {
                    $batch = ProductBatch::find($batchInfo['batch_id']);
                    if ($batch && $batch->product_id == $productId) {
                        $batch->quantity = $batchInfo['quantity'] ?? $batch->quantity;
                        $batch->save();
                    }
                }

                // Broadcast change
                $stockData = [
                    'store_id' => $storeId,
                    'product_id' => $productId,
                    'product_name' => $stock->product->name,
                    'sku' => $stock->product->sku,
                    'previous_quantity' => $previousQuantity,
                    'new_quantity' => $newQuantity,
                    'change_type' => $newQuantity > $previousQuantity ? 'increase' : 'decrease',
                    'change_amount' => abs($newQuantity - $previousQuantity),
                    'available_quantity' => $stock->available_quantity,
                    'reserved_quantity' => $stock->reserved_quantity,
                    'batch_info' => $batchInfo,
                    'triggered_by' => 'sync',
                    'reason' => 'Inventory synchronization',
                ];

                $this->broadcastStockChange($stockData);
                $processedItems[] = $productId;
            }

            Log::info('Inventory sync processed', [
                'store_id' => $storeId,
                'items_processed' => count($processedItems),
                'errors_count' => count($errors),
                'errors' => $errors,
            ]);

            return [
                'success' => empty($errors),
                'message' => empty($errors) ? 'Inventory sync processed successfully' : 'Some items failed to sync',
                'data' => [
                    'items_processed' => $processedItems,
                    'errors_count' => count($errors),
                    'errors' => $errors,
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Inventory sync failed', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Inventory sync failed: ' . $e->getMessage()
            ];
        }
    }
}