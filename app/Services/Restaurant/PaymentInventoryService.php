<?php

namespace App\Services\Restaurant;

use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantPayment;
use App\Models\Product;
use App\Models\InventoryTransaction;
use App\Models\InventoryTransactionItem;
use App\Models\ProductStock;
use App\Models\ProductBatch;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentInventoryService
{
    /**
     * Update inventory on successful payment
     */
    public function updateInventoryOnPayment(RestaurantOrder $order, RestaurantPayment $payment): array
    {
        try {
            return DB::transaction(function() use ($order, $payment) {
                $inventoryUpdates = [];
                $totalItemsProcessed = 0;

                foreach ($order->items as $orderItem) {
                    $product = $orderItem->product;
                    
                    if (!$product || !$product->track_inventory) {
                        continue;
                    }

                    // Process inventory update for this item
                    $updateResult = $this->processInventoryUpdate($orderItem, $order, $payment);
                    
                    if ($updateResult['success']) {
                        $inventoryUpdates[] = $updateResult['data'];
                        $totalItemsProcessed++;
                    } else {
                        throw new \Exception("Inventory update failed for item {$orderItem->id}: " . $updateResult['message']);
                    }
                }

                // Update product popularity metrics
                $this->updateProductPopularity($order);

                // Generate inventory report
                $this->generateInventoryReport($order, $payment, $inventoryUpdates);

                Log::info('Inventory updated on payment', [
                    'order_id' => $order->id,
                    'payment_id' => $payment->id,
                    'items_processed' => $totalItemsProcessed,
                ]);

                return [
                    'success' => true,
                    'message' => 'Inventory updated successfully',
                    'data' => [
                        'items_processed' => $totalItemsProcessed,
                        'inventory_updates' => $inventoryUpdates,
                    ],
                ];
            });
        } catch (\Exception $e) {
            Log::error('Inventory update on payment failed', [
                'order_id' => $order->id,
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Inventory update failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Reverse inventory on refund
     */
    public function reverseInventoryOnRefund(RestaurantOrder $order, RestaurantPayment $payment, float $refundAmount): array
    {
        try {
            return DB::transaction(function() use ($order, $payment, $refundAmount) {
                $inventoryReversals = [];
                $totalItemsReversed = 0;

                // Calculate refund percentage
                $refundPercentage = $payment->total_amount > 0 ? $refundAmount / $payment->total_amount : 0;

                foreach ($order->items as $orderItem) {
                    $product = $orderItem->product;
                    
                    if (!$product || !$product->track_inventory) {
                        continue;
                    }

                    // Calculate quantity to restore based on refund percentage
                    $quantityToRestore = round($orderItem->quantity * $refundPercentage, 2);
                    
                    if ($quantityToRestore <= 0) {
                        continue;
                    }

                    // Process inventory reversal for this item
                    $reversalResult = $this->processInventoryReversal($orderItem, $quantityToRestore, $order, $payment);
                    
                    if ($reversalResult['success']) {
                        $inventoryReversals[] = $reversalResult['data'];
                        $totalItemsReversed++;
                    } else {
                        throw new \Exception("Inventory reversal failed for item {$orderItem->id}: " . $reversalResult['message']);
                    }
                }

                // Update product popularity metrics (decrease)
                $this->decreaseProductPopularity($order, $refundPercentage);

                // Generate inventory reversal report
                $this->generateInventoryReversalReport($order, $payment, $inventoryReversals, $refundAmount);

                Log::info('Inventory reversed on refund', [
                    'order_id' => $order->id,
                    'payment_id' => $payment->id,
                    'refund_amount' => $refundAmount,
                    'items_reversed' => $totalItemsReversed,
                ]);

                return [
                    'success' => true,
                    'message' => 'Inventory reversed successfully',
                    'data' => [
                        'items_reversed' => $totalItemsReversed,
                        'inventory_reversals' => $inventoryReversals,
                    ],
                ];
            });
        } catch (\Exception $e) {
            Log::error('Inventory reversal on refund failed', [
                'order_id' => $order->id,
                'payment_id' => $payment->id,
                'refund_amount' => $refundAmount,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Inventory reversal failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Process inventory update for an order item
     */
    private function processInventoryUpdate($orderItem, RestaurantOrder $order, RestaurantPayment $payment): array
    {
        try {
            $product = $orderItem->product;
            $storeId = $order->store_id;
            $quantity = $orderItem->quantity;

            // Get current stock for this store
            $productStock = ProductStock::where('product_id', $product->id)
                ->where('store_id', $storeId)
                ->first();

            if (!$productStock) {
                // Create stock record if it doesn't exist
                $productStock = ProductStock::create([
                    'product_id' => $product->id,
                    'store_id' => $storeId,
                    'quantity' => 0,
                    'reserved_quantity' => 0,
                    'available_quantity' => 0,
                ]);
            }

            // Check if sufficient stock is available
            if ($productStock->available_quantity < $quantity) {
                return [
                    'success' => false,
                    'message' => "Insufficient stock for product {$product->name}. Available: {$productStock->available_quantity}, Required: {$quantity}",
                ];
            }

            // Update stock quantities
            $productStock->quantity -= $quantity;
            $productStock->reserved_quantity -= min($quantity, $productStock->reserved_quantity);
            $productStock->available_quantity = $productStock->quantity - $productStock->reserved_quantity;
            $productStock->save();

            // Create inventory transaction
            $inventoryTransaction = InventoryTransaction::create([
                'store_id' => $storeId,
                'transaction_type' => 'sale',
                'reference_type' => 'restaurant_payment',
                'reference_id' => $payment->id,
                'notes' => "Sold {$quantity} units for order {$order->order_number}",
                'created_by' => $payment->processed_by ?? $payment->created_by,
            ]);

            // Create inventory transaction item
            InventoryTransactionItem::create([
                'inventory_transaction_id' => $inventoryTransaction->id,
                'product_id' => $product->id,
                'quantity' => -$quantity,
                'unit_cost' => $product->cost_price ?? 0,
                'total_cost' => ($product->cost_price ?? 0) * $quantity,
                'batch_id' => $this->selectBatchForProduct($product->id, $storeId, $quantity),
            ]);

            // Update product batch if applicable
            $this->updateProductBatch($product->id, $storeId, $quantity);

            return [
                'success' => true,
                'data' => [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $quantity,
                    'remaining_stock' => $productStock->available_quantity,
                    'transaction_id' => $inventoryTransaction->id,
                ],
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Process inventory reversal for an order item
     */
    private function processInventoryReversal($orderItem, float $quantityToRestore, RestaurantOrder $order, RestaurantPayment $payment): array
    {
        try {
            $product = $orderItem->product;
            $storeId = $order->store_id;

            // Get current stock for this store
            $productStock = ProductStock::where('product_id', $product->id)
                ->where('store_id', $storeId)
                ->first();

            if (!$productStock) {
                // Create stock record if it doesn't exist
                $productStock = ProductStock::create([
                    'product_id' => $product->id,
                    'store_id' => $storeId,
                    'quantity' => 0,
                    'reserved_quantity' => 0,
                    'available_quantity' => 0,
                ]);
            }

            // Update stock quantities
            $productStock->quantity += $quantityToRestore;
            $productStock->available_quantity = $productStock->quantity - $productStock->reserved_quantity;
            $productStock->save();

            // Create inventory transaction for reversal
            $inventoryTransaction = InventoryTransaction::create([
                'store_id' => $storeId,
                'transaction_type' => 'return',
                'reference_type' => 'restaurant_payment_refund',
                'reference_id' => $payment->id,
                'notes' => "Restored {$quantityToRestore} units from refund for order {$order->order_number}",
                'created_by' => $payment->refunded_by ?? auth()->id(),
            ]);

            // Create inventory transaction item
            InventoryTransactionItem::create([
                'inventory_transaction_id' => $inventoryTransaction->id,
                'product_id' => $product->id,
                'quantity' => $quantityToRestore,
                'unit_cost' => $product->cost_price ?? 0,
                'total_cost' => ($product->cost_price ?? 0) * $quantityToRestore,
            ]);

            return [
                'success' => true,
                'data' => [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity_restored' => $quantityToRestore,
                    'new_stock' => $productStock->available_quantity,
                    'transaction_id' => $inventoryTransaction->id,
                ],
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Select appropriate batch for product
     */
    private function selectBatchForProduct(int $productId, int $storeId, float $quantity): ?int
    {
        // Find the oldest batch with sufficient quantity
        $batch = ProductBatch::where('product_id', $productId)
            ->where('store_id', $storeId)
            ->where('quantity', '>', 0)
            ->orderBy('expiry_date', 'asc')
            ->orderBy('created_at', 'asc')
            ->first();

        if ($batch && $batch->quantity >= $quantity) {
            // Reduce batch quantity
            $batch->quantity -= $quantity;
            $batch->save();
            
            return $batch->id;
        }

        return null;
    }

    /**
     * Update product batch
     */
    private function updateProductBatch(int $productId, int $storeId, float $quantity): void
    {
        // This method could be used to update batch-specific information
        // For now, it's a placeholder for future batch management
    }

    /**
     * Update product popularity metrics
     */
    private function updateProductPopularity(RestaurantOrder $order): void
    {
        foreach ($order->items as $orderItem) {
            $product = $orderItem->product;
            
            if (!$product) {
                continue;
            }

            // Update popularity score (simple implementation)
            $product->increment('popularity_score', $orderItem->quantity);
            $product->increment('order_count', 1);
            $product->increment('total_sold', $orderItem->quantity);
            
            // Update last sold date
            $product->last_sold_at = now();
            $product->save();
        }
    }

    /**
     * Decrease product popularity metrics on refund
     */
    private function decreaseProductPopularity(RestaurantOrder $order, float $refundPercentage): void
    {
        foreach ($order->items as $orderItem) {
            $product = $orderItem->product;
            
            if (!$product) {
                continue;
            }

            // Decrease popularity score proportionally
            $decreaseAmount = round($orderItem->quantity * $refundPercentage, 2);
            
            $product->decrement('popularity_score', $decreaseAmount);
            $product->decrement('total_sold', $decreaseAmount);
            
            // Ensure values don't go negative
            $product->popularity_score = max(0, $product->popularity_score);
            $product->total_sold = max(0, $product->total_sold);
            $product->save();
        }
    }

    /**
     * Generate inventory report
     */
    private function generateInventoryReport(RestaurantOrder $order, RestaurantPayment $payment, array $inventoryUpdates): void
    {
        $reportData = [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'payment_id' => $payment->id,
            'payment_number' => $payment->payment_number,
            'store_id' => $order->store_id,
            'transaction_date' => now()->toISOString(),
            'items_updated' => $inventoryUpdates,
            'total_items' => count($inventoryUpdates),
            'total_quantity' => array_sum(array_column($inventoryUpdates, 'quantity')),
        ];

        // In a real implementation, this would save to a reports table
        Log::info('Inventory report generated', $reportData);
    }

    /**
     * Generate inventory reversal report
     */
    private function generateInventoryReversalReport(RestaurantOrder $order, RestaurantPayment $payment, array $inventoryReversals, float $refundAmount): void
    {
        $reportData = [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'payment_id' => $payment->id,
            'payment_number' => $payment->payment_number,
            'refund_amount' => $refundAmount,
            'store_id' => $order->store_id,
            'transaction_date' => now()->toISOString(),
            'items_reversed' => $inventoryReversals,
            'total_items' => count($inventoryReversals),
            'total_quantity' => array_sum(array_column($inventoryReversals, 'quantity_restored')),
        ];

        // In a real implementation, this would save to a reports table
        Log::info('Inventory reversal report generated', $reportData);
    }

    /**
     * Get low stock alerts for store
     */
    public function getLowStockAlerts(int $storeId): array
    {
        try {
            $lowStockThreshold = setting('restaurant.low_stock_threshold', 10, $storeId);
            
            $lowStockItems = ProductStock::where('store_id', $storeId)
                ->where('available_quantity', '<=', $lowStockThreshold)
                ->with('product')
                ->get()
                ->map(function ($stock) {
                    return [
                        'product_id' => $stock->product_id,
                        'product_name' => $stock->product->name,
                        'current_stock' => $stock->available_quantity,
                        'threshold' => $lowStockThreshold,
                        'severity' => $stock->available_quantity <= 0 ? 'critical' : 'warning',
                    ];
                });

            return [
                'success' => true,
                'data' => $lowStockItems,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get low stock alerts', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to get low stock alerts: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Get inventory movement report for a period
     */
    public function getInventoryMovementReport(int $storeId, string $startDate, string $endDate): array
    {
        try {
            $transactions = InventoryTransaction::where('store_id', $storeId)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->with(['items.product'])
                ->orderBy('created_at', 'desc')
                ->get();

            $movementData = $transactions->groupBy('transaction_type')->map(function ($typeTransactions) {
                return [
                    'count' => $typeTransactions->count(),
                    'total_quantity' => $typeTransactions->sum(function ($transaction) {
                        return abs($transaction->items->sum('quantity'));
                    }),
                    'total_value' => $typeTransactions->sum(function ($transaction) {
                        return $transaction->items->sum('total_cost');
                    }),
                ];
            });

            return [
                'success' => true,
                'data' => [
                    'period' => [
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ],
                    'summary' => $movementData,
                    'transactions' => $transactions->map(function ($transaction) {
                        return [
                            'id' => $transaction->id,
                            'type' => $transaction->transaction_type,
                            'reference_type' => $transaction->reference_type,
                            'reference_id' => $transaction->reference_id,
                            'notes' => $transaction->notes,
                            'created_at' => $transaction->created_at,
                            'items' => $transaction->items->map(function ($item) {
                                return [
                                    'product_name' => $item->product->name,
                                    'quantity' => $item->quantity,
                                    'unit_cost' => $item->unit_cost,
                                    'total_cost' => $item->total_cost,
                                ];
                            }),
                        ];
                    }),
                ],
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get inventory movement report', [
                'store_id' => $storeId,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to get inventory movement report: ' . $e->getMessage(),
            ];
        }
    }
}