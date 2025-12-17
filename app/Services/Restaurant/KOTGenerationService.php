<?php

namespace App\Services\Restaurant;

use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantOrderItem;
use App\Models\Restaurant\KitchenOrderQueue;
use App\Models\Restaurant\KitchenStation;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\InventoryTransaction;
use App\Models\InventoryTransactionItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

class KOTGenerationService
{
    /**
     * Generate KOT for a confirmed order
     */
    public function generateKOTForOrder(RestaurantOrder $order): array
    {
        if ($order->status !== 'confirmed') {
            throw new \Exception('Order must be confirmed to generate KOT');
        }

        DB::beginTransaction();
        try {
            $kotItems = [];
            $generatedKOTs = [];
            $stockIssues = [];

            foreach ($order->items as $orderItem) {
                // Skip items that are already processed
                if ($orderItem->status !== 'pending') {
                    continue;
                }

                // Verify stock availability
                $stockCheck = $this->verifyStockAvailability($orderItem, $order->store_id);
                if (!$stockCheck['available']) {
                    $stockIssues[] = [
                        'item_id' => $orderItem->id,
                        'product_name' => $orderItem->product->name,
                        'issue' => $stockCheck['message']
                    ];
                    continue;
                }

                // Determine station for this item
                $station = $this->determineStationForItem($orderItem, $order->store_id);
                if (!$station) {
                    $stockIssues[] = [
                        'item_id' => $orderItem->id,
                        'product_name' => $orderItem->product->name,
                        'issue' => 'No kitchen station assigned for this product'
                    ];
                    continue;
                }

                // Create KOT queue entry
                $queueItem = $this->createKOTQueueEntry($orderItem, $station, $order);
                
                // Reserve stock
                $this->reserveStockForKOT($orderItem, $order->store_id);
                
                // Update order item status
                $orderItem->status = 'confirmed';
                $orderItem->kitchen_printed = true;
                $orderItem->kitchen_printed_at = now();
                $orderItem->save();

                $kotItems[] = $queueItem;
                $generatedKOTs[] = [
                    'kot_id' => $queueItem->id,
                    'order_item_id' => $orderItem->id,
                    'product_name' => $orderItem->product->name,
                    'station' => $station->name,
                    'quantity' => $orderItem->quantity,
                    'estimated_time' => $queueItem->estimated_time
                ];
            }

            // Update order status if all items have KOTs
            $this->updateOrderStatusAfterKOTGeneration($order);

            DB::commit();

            return [
                'success' => true,
                'generated_kots' => $generatedKOTs,
                'stock_issues' => $stockIssues,
                'message' => count($generatedKOTs) . ' KOT(s) generated successfully'
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('KOT generation failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => 'KOT generation failed: ' . $e->getMessage(),
                'generated_kots' => [],
                'stock_issues' => $stockIssues ?? []
            ];
        }
    }

    /**
     * Verify stock availability for an order item
     */
    private function verifyStockAvailability(RestaurantOrderItem $orderItem, int $storeId): array
    {
        $product = $orderItem->product;
        
        if (!$product->is_stock_managed) {
            return ['available' => true];
        }

        $availableStock = ProductStock::where('product_id', $product->id)
            ->where('store_id', $storeId)
            ->sum('quantity');

        $requiredQuantity = $orderItem->quantity;

        // Check modifier stock requirements
        foreach ($orderItem->modifiers as $modifier) {
            if ($modifier->modifier->is_stock_managed) {
                $modifierStock = ProductStock::where('product_id', $modifier->modifier->id)
                    ->where('store_id', $storeId)
                    ->sum('quantity');
                
                $requiredModifierQuantity = $modifier->quantity * $orderItem->quantity;
                if ($modifierStock < $requiredModifierQuantity) {
                    return [
                        'available' => false,
                        'message' => "Insufficient stock for modifier '{$modifier->modifier->name}'. Available: {$modifierStock}, Required: {$requiredModifierQuantity}"
                    ];
                }
            }
        }

        if ($availableStock < $requiredQuantity) {
            return [
                'available' => false,
                'message' => "Insufficient stock for '{$product->name}'. Available: {$availableStock}, Required: {$requiredQuantity}"
            ];
        }

        return ['available' => true];
    }

    /**
     * Determine the appropriate kitchen station for an order item
     */
    private function determineStationForItem(RestaurantOrderItem $orderItem, int $storeId): ?KitchenStation
    {
        // First, check if product is directly assigned to a station
        $productStations = KitchenStation::whereHas('products', function($query) use ($orderItem) {
                $query->where('product_id', $orderItem->product_id);
            })
            ->forStore($storeId)
            ->active()
            ->get();

        if ($productStations->count() === 1) {
            return $productStations->first();
        }

        // If multiple stations, check for the one with least queue
        if ($productStations->count() > 1) {
            return $productStations->sortBy(function($station) {
                return $station->getActiveQueueCount();
            })->first();
        }

        // If no direct assignment, check modifier-based routing
        foreach ($orderItem->modifiers as $modifier) {
            $modifierStations = KitchenStation::whereHas('products', function($query) use ($modifier) {
                    $query->where('product_id', $modifier->modifier_id);
                })
                ->forStore($storeId)
                ->active()
                ->get();

            if ($modifierStations->isNotEmpty()) {
                return $modifierStations->first();
            }
        }

        // Default fallback - get first active station
        return KitchenStation::forStore($storeId)->active()->first();
    }

    /**
     * Create KOT queue entry
     */
    private function createKOTQueueEntry(RestaurantOrderItem $orderItem, KitchenStation $station, RestaurantOrder $order): KitchenOrderQueue
    {
        // Calculate estimated preparation time
        $estimatedTime = $this->calculateEstimatedPreparationTime($orderItem, $station);

        // Determine priority
        $priority = $this->determineKOTPriority($orderItem, $order);

        return KitchenOrderQueue::create([
            'order_item_id' => $orderItem->id,
            'station_id' => $station->id,
            'status' => 'queued',
            'priority' => $priority,
            'estimated_time' => $estimatedTime,
            'notes' => $this->generateKOTNotes($orderItem, $order)
        ]);
    }

    /**
     * Calculate estimated preparation time for an item
     */
    private function calculateEstimatedPreparationTime(RestaurantOrderItem $orderItem, KitchenStation $station): int
    {
        // Get base preparation time from station-product mapping
        $stationProduct = $station->products()
            ->where('product_id', $orderItem->product_id)
            ->first();

        $baseTime = $stationProduct ? $stationProduct->pivot->preparation_time : 15; // Default 15 minutes

        // Adjust based on quantity
        $quantityMultiplier = max(1, $orderItem->quantity / 2); // Every 2 units adds more time

        // Add time for complex modifiers
        $modifierTime = 0;
        foreach ($orderItem->modifiers as $modifier) {
            if ($modifier->modifier->modifier_type === 'preparation_heavy') {
                $modifierTime += 5;
            }
        }

        // Adjust based on station current load
        $stationLoad = $station->getActiveQueueCount();
        $loadMultiplier = 1 + ($stationLoad * 0.1); // 10% increase per queued item

        return (int) round(($baseTime + $modifierTime) * $quantityMultiplier * $loadMultiplier);
    }

    /**
     * Determine KOT priority based on various factors
     */
    private function determineKOTPriority(RestaurantOrderItem $orderItem, RestaurantOrder $order): string
    {
        // Start with order priority
        $priority = $order->priority;

        // Upgrade priority for urgent situations
        if ($order->order_type === 'delivery' && $order->estimated_time < 30) {
            $priority = 'urgent';
        } elseif ($order->order_type === 'takeaway' && $order->estimated_time < 15) {
            $priority = 'high';
        }

        // Consider customer wait time
        if ($order->created_at->diffInMinutes(now()) > 45) {
            $priority = 'high';
        }

        // Check for VIP customers or special occasions
        if ($order->special_instructions && str_contains(strtolower($order->special_instructions), 'urgent')) {
            $priority = 'urgent';
        }

        return $priority;
    }

    /**
     * Generate KOT notes for kitchen staff
     */
    private function generateKOTNotes(RestaurantOrderItem $orderItem, RestaurantOrder $order): string
    {
        $notes = [];

        // Add order-level special instructions
        if ($order->special_instructions) {
            $notes[] = "Order: " . $order->special_instructions;
        }

        // Add item-level special instructions
        if ($orderItem->special_instructions) {
            $notes[] = "Item: " . $orderItem->special_instructions;
        }

        // Add preparation notes
        if ($orderItem->preparation_notes) {
            $notes[] = "Prep: " . $orderItem->preparation_notes;
        }

        // Add modifier information
        if ($orderItem->modifiers->isNotEmpty()) {
            $modifierList = $orderItem->modifiers->map(function($modifier) {
                return $modifier->modifier->name . ' x' . $modifier->quantity;
            })->join(', ');
            $notes[] = "Modifiers: " . $modifierList;
        }

        // Add course information for multi-course meals
        if ($orderItem->course_number > 1) {
            $notes[] = "Course: " . $orderItem->course_number;
        }

        return implode(' | ', $notes);
    }

    /**
     * Reserve stock for KOT
     */
    private function reserveStockForKOT(RestaurantOrderItem $orderItem, int $storeId): void
    {
        $product = $orderItem->product;
        
        if (!$product->is_stock_managed) {
            return;
        }

        // Create inventory transaction for stock reservation
        $transaction = InventoryTransaction::create([
            'store_id' => $storeId,
            'transaction_type' => 'reservation',
            'reference_type' => 'restaurant_order_item',
            'reference_id' => $orderItem->id,
            'notes' => "Stock reserved for KOT - Order Item ID: {$orderItem->id}",
            'created_by' => auth()->id() ?? 1
        ]);

        // Reserve main product stock
        $this->createInventoryTransactionItem($transaction, $product, $orderItem->quantity, 'reserve');

        // Reserve modifier stock
        foreach ($orderItem->modifiers as $modifier) {
            if ($modifier->modifier->is_stock_managed) {
                $modifierQuantity = $modifier->quantity * $orderItem->quantity;
                $this->createInventoryTransactionItem($transaction, $modifier->modifier, $modifierQuantity, 'reserve');
            }
        }
    }

    /**
     * Create inventory transaction item
     */
    private function createInventoryTransactionItem(InventoryTransaction $transaction, Product $product, float $quantity, string $action): void
    {
        InventoryTransactionItem::create([
            'inventory_transaction_id' => $transaction->id,
            'product_id' => $product->id,
            'quantity' => $quantity,
            'action' => $action, // 'reserve' or 'consume'
            'unit_cost' => $product->cost ?? 0
        ]);

        // Update stock quantity
        $stock = ProductStock::where('product_id', $product->id)
            ->where('store_id', $transaction->store_id)
            ->first();

        if ($stock) {
            if ($action === 'reserve') {
                $stock->quantity -= $quantity;
            }
            $stock->save();
        }
    }

    /**
     * Update order status after KOT generation
     */
    private function updateOrderStatusAfterKOTGeneration(RestaurantOrder $order): void
    {
        $allItemsProcessed = $order->items()->where('status', 'pending')->count() === 0;
        $hasConfirmedItems = $order->items()->where('status', 'confirmed')->count() > 0;

        if ($allItemsProcessed && $hasConfirmedItems) {
            $order->status = 'preparing';
            $order->save();
        }
    }

    /**
     * Regenerate KOT for modified order items
     */
    public function regenerateKOTForItem(RestaurantOrderItem $orderItem): array
    {
        if (!in_array($orderItem->status, ['confirmed', 'preparing'])) {
            throw new \Exception('Cannot regenerate KOT for item in ' . $orderItem->status . ' status');
        }

        DB::beginTransaction();
        try {
            // Cancel existing KOT entries
            KitchenOrderQueue::where('order_item_id', $orderItem->id)
                ->whereIn('status', ['queued', 'in_progress'])
                ->update(['status' => 'cancelled']);

            // Release previously reserved stock
            $this->releaseReservedStock($orderItem);

            // Generate new KOT
            $order = $orderItem->order;
            $result = $this->generateKOTForOrder($order);

            DB::commit();

            return $result;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('KOT regeneration failed', [
                'order_item_id' => $orderItem->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'KOT regeneration failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Release reserved stock
     */
    private function releaseReservedStock(RestaurantOrderItem $orderItem): void
    {
        $product = $orderItem->product;
        
        if (!$product->is_stock_managed) {
            return;
        }

        // Find and reverse reservation transactions
        $transactions = InventoryTransaction::where('reference_type', 'restaurant_order_item')
            ->where('reference_id', $orderItem->id)
            ->where('transaction_type', 'reservation')
            ->get();

        foreach ($transactions as $transaction) {
            foreach ($transaction->items as $item) {
                // Restore stock quantity
                $stock = ProductStock::where('product_id', $item->product_id)
                    ->where('store_id', $transaction->store_id)
                    ->first();

                if ($stock) {
                    $stock->quantity += $item->quantity;
                    $stock->save();
                }
            }

            // Mark transaction as reversed
            $transaction->status = 'reversed';
            $transaction->save();
        }
    }

    /**
     * Get KOT statistics for a store
     */
    public function getKOTStatistics(int $storeId, string $period = 'today'): array
    {
        $startDate = $this->getStartDate($period);
        $endDate = now();

        $query = KitchenOrderQueue::whereHas('orderItem.order', function($query) use ($storeId) {
            $query->where('store_id', $storeId);
        })->whereBetween('created_at', [$startDate, $endDate]);

        $totalKOTs = $query->count();
        $completedKOTs = $query->where('status', 'completed')->count();
        $avgPreparationTime = $query->whereNotNull('started_at')
            ->whereNotNull('completed_at')
            ->avg(\DB::raw('TIMESTAMPDIFF(MINUTE, started_at, completed_at)'));

        $kotsByStatus = $query->clone()
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $kotsByStation = $query->clone()
            ->join('kitchen_stations', 'kitchen_order_queue.station_id', '=', 'kitchen_stations.id')
            ->selectRaw('kitchen_stations.name, COUNT(*) as count')
            ->groupBy('kitchen_stations.id', 'kitchen_stations.name')
            ->orderBy('count', 'desc')
            ->get();

        return [
            'period' => $period,
            'total_kots' => $totalKOTs,
            'completed_kots' => $completedKOTs,
            'completion_rate' => $totalKOTs > 0 ? round(($completedKOTs / $totalKOTs) * 100, 2) : 0,
            'avg_preparation_time' => round($avgPreparationTime ?? 0, 1),
            'kots_by_status' => $kotsByStatus,
            'kots_by_station' => $kotsByStation
        ];
    }

    /**
     * Get start date based on period
     */
    private function getStartDate(string $period): Carbon
    {
        switch ($period) {
            case 'today':
                return now()->startOfDay();
            case 'week':
                return now()->startOfWeek();
            case 'month':
                return now()->startOfMonth();
            case 'year':
                return now()->startOfYear();
            default:
                return now()->startOfDay();
        }
    }
}