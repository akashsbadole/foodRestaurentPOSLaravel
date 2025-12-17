<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductStock;
use App\Models\ProductBatch;
use App\Models\InventoryTransaction;
use App\Models\InventoryTransactionItem;
use App\Models\Store;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class InventoryManagementService
{
    /**
     * Reserve stock for an order item
     */
    public function reserveStock(int $productId, int $storeId, float $quantity, string $orderNumber = null): array
    {
        try {
            return DB::transaction(function() use ($productId, $storeId, $quantity, $orderNumber) {
                $product = Product::find($productId);
                
                if (!$product) {
                    return [
                        'success' => false,
                        'message' => 'Product not found'
                    ];
                }

                if (!$product->is_stock_managed) {
                    return [
                        'success' => true,
                        'message' => 'Product does not require stock management',
                        'data' => [
                            'product_id' => $productId,
                            'quantity_reserved' => $quantity,
                            'stock_managed' => false
                        ]
                    ];
                }

                // Get current stock with lock
                $productStock = ProductStock::where('product_id', $productId)
                    ->where('store_id', $storeId)
                    ->lockForUpdate()
                    ->first();

                if (!$productStock) {
                    return [
                        'success' => false,
                        'message' => 'No stock record found for this product in the specified store'
                    ];
                }

                // Check if sufficient stock is available
                if ($productStock->available_quantity < $quantity) {
                    return [
                        'success' => false,
                        'message' => "Insufficient stock. Available: {$productStock->available_quantity}, Required: {$quantity}",
                        'data' => [
                            'available_quantity' => $productStock->available_quantity,
                            'required_quantity' => $quantity,
                            'shortfall' => $quantity - $productStock->available_quantity
                        ]
                    ];
                }

                // Reserve stock
                $productStock->reserved_quantity += $quantity;
                $productStock->available_quantity = $productStock->quantity - $productStock->reserved_quantity;
                $productStock->save();

                // Create reservation transaction
                $transaction = InventoryTransaction::create([
                    'store_id' => $storeId,
                    'transaction_type' => 'reservation',
                    'reference_type' => 'order',
                    'reference_id' => $orderNumber,
                    'notes' => "Reserved {$quantity} units for order {$orderNumber}",
                    'created_by' => auth()->id(),
                ]);

                InventoryTransactionItem::create([
                    'inventory_transaction_id' => $transaction->id,
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'unit_cost' => $product->cost_price ?? 0,
                    'total_cost' => ($product->cost_price ?? 0) * $quantity,
                ]);

                Log::info('Stock reserved successfully', [
                    'product_id' => $productId,
                    'store_id' => $storeId,
                    'quantity' => $quantity,
                    'order_number' => $orderNumber,
                ]);

                return [
                    'success' => true,
                    'message' => 'Stock reserved successfully',
                    'data' => [
                        'product_id' => $productId,
                        'quantity_reserved' => $quantity,
                        'remaining_available' => $productStock->available_quantity,
                        'transaction_id' => $transaction->id,
                    ]
                ];
            });
        } catch (\Exception $e) {
            Log::error('Stock reservation failed', [
                'product_id' => $productId,
                'store_id' => $storeId,
                'quantity' => $quantity,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Stock reservation failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Release reserved stock
     */
    public function releaseReservedStock(int $productId, int $storeId, float $quantity, string $reason = 'Order cancelled'): array
    {
        try {
            return DB::transaction(function() use ($productId, $storeId, $quantity, $reason) {
                $product = Product::find($productId);
                
                if (!$product || !$product->is_stock_managed) {
                    return [
                        'success' => true,
                        'message' => 'Product does not require stock management'
                    ];
                }

                // Get current stock with lock
                $productStock = ProductStock::where('product_id', $productId)
                    ->where('store_id', $storeId)
                    ->lockForUpdate()
                    ->first();

                if (!$productStock) {
                    return [
                        'success' => false,
                        'message' => 'No stock record found for this product in the specified store'
                    ];
                }

                // Check if there's enough reserved stock to release
                if ($productStock->reserved_quantity < $quantity) {
                    return [
                        'success' => false,
                        'message' => "Insufficient reserved stock. Reserved: {$productStock->reserved_quantity}, Requested: {$quantity}"
                    ];
                }

                // Release reserved stock
                $productStock->reserved_quantity -= $quantity;
                $productStock->available_quantity = $productStock->quantity - $productStock->reserved_quantity;
                $productStock->save();

                // Create release transaction
                $transaction = InventoryTransaction::create([
                    'store_id' => $storeId,
                    'transaction_type' => 'release',
                    'notes' => "Released {$quantity} units: {$reason}",
                    'created_by' => auth()->id(),
                ]);

                InventoryTransactionItem::create([
                    'inventory_transaction_id' => $transaction->id,
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'unit_cost' => $product->cost_price ?? 0,
                    'total_cost' => ($product->cost_price ?? 0) * $quantity,
                ]);

                Log::info('Reserved stock released', [
                    'product_id' => $productId,
                    'store_id' => $storeId,
                    'quantity' => $quantity,
                    'reason' => $reason,
                ]);

                return [
                    'success' => true,
                    'message' => 'Reserved stock released successfully',
                    'data' => [
                        'product_id' => $productId,
                        'quantity_released' => $quantity,
                        'remaining_reserved' => $productStock->reserved_quantity,
                        'available_quantity' => $productStock->available_quantity,
                        'transaction_id' => $transaction->id,
                    ]
                ];
            });
        } catch (\Exception $e) {
            Log::error('Stock release failed', [
                'product_id' => $productId,
                'store_id' => $storeId,
                'quantity' => $quantity,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Stock release failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Deduct stock on payment completion
     */
    public function deductStock(int $productId, int $storeId, float $quantity, string $referenceType = null, int $referenceId = null): array
    {
        try {
            return DB::transaction(function() use ($productId, $storeId, $quantity, $referenceType, $referenceId) {
                $product = Product::find($productId);
                
                if (!$product || !$product->is_stock_managed) {
                    return [
                        'success' => true,
                        'message' => 'Product does not require stock management'
                    ];
                }

                // Get current stock with lock
                $productStock = ProductStock::where('product_id', $productId)
                    ->where('store_id', $storeId)
                    ->lockForUpdate()
                    ->first();

                if (!$productStock) {
                    return [
                        'success' => false,
                        'message' => 'No stock record found for this product in the specified store'
                    ];
                }

                // Check if sufficient reserved stock is available
                if ($productStock->reserved_quantity < $quantity) {
                    return [
                        'success' => false,
                        'message' => "Insufficient reserved stock. Reserved: {$productStock->reserved_quantity}, Required: {$quantity}"
                    ];
                }

                // Select batch for deduction (FIFO)
                $batchId = $this->selectBatchForDeduction($productId, $storeId, $quantity);

                // Deduct stock
                $productStock->quantity -= $quantity;
                $productStock->reserved_quantity -= $quantity;
                $productStock->available_quantity = $productStock->quantity - $productStock->reserved_quantity;
                $productStock->save();

                // Create deduction transaction
                $transaction = InventoryTransaction::create([
                    'store_id' => $storeId,
                    'transaction_type' => 'sale',
                    'reference_type' => $referenceType,
                    'reference_id' => $referenceId,
                    'notes' => "Deducted {$quantity} units from stock",
                    'created_by' => auth()->id(),
                ]);

                InventoryTransactionItem::create([
                    'inventory_transaction_id' => $transaction->id,
                    'product_id' => $productId,
                    'quantity' => -$quantity,
                    'unit_cost' => $product->cost_price ?? 0,
                    'total_cost' => ($product->cost_price ?? 0) * $quantity,
                    'batch_id' => $batchId,
                ]);

                Log::info('Stock deducted successfully', [
                    'product_id' => $productId,
                    'store_id' => $storeId,
                    'quantity' => $quantity,
                    'reference_type' => $referenceType,
                    'reference_id' => $referenceId,
                ]);

                return [
                    'success' => true,
                    'message' => 'Stock deducted successfully',
                    'data' => [
                        'product_id' => $productId,
                        'quantity_deducted' => $quantity,
                        'remaining_quantity' => $productStock->quantity,
                        'available_quantity' => $productStock->available_quantity,
                        'batch_id' => $batchId,
                        'transaction_id' => $transaction->id,
                    ]
                ];
            });
        } catch (\Exception $e) {
            Log::error('Stock deduction failed', [
                'product_id' => $productId,
                'store_id' => $storeId,
                'quantity' => $quantity,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Stock deduction failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Add stock to inventory
     */
    public function addStock(int $productId, int $storeId, float $quantity, array $batchData = null): array
    {
        try {
            return DB::transaction(function() use ($productId, $storeId, $quantity, $batchData) {
                $product = Product::find($productId);
                
                if (!$product) {
                    return [
                        'success' => false,
                        'message' => 'Product not found'
                    ];
                }

                // Create or update batch if provided
                $batchId = null;
                if ($batchData) {
                    $batch = ProductBatch::create([
                        'product_id' => $productId,
                        'batch_number' => $batchData['batch_number'] ?? $this->generateBatchNumber(),
                        'expiry_date' => $batchData['expiry_date'] ?? null,
                        'cost' => $batchData['cost'] ?? $product->cost_price ?? 0,
                        'price' => $batchData['price'] ?? $product->price ?? 0,
                        'supplier_id' => $batchData['supplier_id'] ?? null,
                        'quantity' => $quantity,
                    ]);
                    $batchId = $batch->id;
                }

                // Get or create stock record
                $productStock = ProductStock::firstOrCreate(
                    ['product_id' => $productId, 'store_id' => $storeId],
                    ['quantity' => 0, 'reserved_quantity' => 0, 'available_quantity' => 0]
                );

                // Add stock
                $productStock->quantity += $quantity;
                $productStock->available_quantity = $productStock->quantity - $productStock->reserved_quantity;
                $productStock->save();

                // Create addition transaction
                $transaction = InventoryTransaction::create([
                    'store_id' => $storeId,
                    'transaction_type' => 'purchase',
                    'notes' => "Added {$quantity} units to inventory",
                    'created_by' => auth()->id(),
                ]);

                InventoryTransactionItem::create([
                    'inventory_transaction_id' => $transaction->id,
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'unit_cost' => $batchData['cost'] ?? $product->cost_price ?? 0,
                    'total_cost' => ($batchData['cost'] ?? $product->cost_price ?? 0) * $quantity,
                    'batch_id' => $batchId,
                ]);

                Log::info('Stock added successfully', [
                    'product_id' => $productId,
                    'store_id' => $storeId,
                    'quantity' => $quantity,
                    'batch_id' => $batchId,
                ]);

                return [
                    'success' => true,
                    'message' => 'Stock added successfully',
                    'data' => [
                        'product_id' => $productId,
                        'quantity_added' => $quantity,
                        'total_quantity' => $productStock->quantity,
                        'available_quantity' => $productStock->available_quantity,
                        'batch_id' => $batchId,
                        'transaction_id' => $transaction->id,
                    ]
                ];
            });
        } catch (\Exception $e) {
            Log::error('Stock addition failed', [
                'product_id' => $productId,
                'store_id' => $storeId,
                'quantity' => $quantity,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Stock addition failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Transfer stock between stores
     */
    public function transferStock(int $productId, int $fromStoreId, int $toStoreId, float $quantity): array
    {
        try {
            return DB::transaction(function() use ($productId, $fromStoreId, $toStoreId, $quantity) {
                // Check source stock
                $sourceStock = ProductStock::where('product_id', $productId)
                    ->where('store_id', $fromStoreId)
                    ->lockForUpdate()
                    ->first();

                if (!$sourceStock || $sourceStock->available_quantity < $quantity) {
                    return [
                        'success' => false,
                        'message' => "Insufficient stock in source store. Available: {$sourceStock?->available_quantity ?? 0}, Required: {$quantity}"
                    ];
                }

                // Get or create destination stock
                $destStock = ProductStock::firstOrCreate(
                    ['product_id' => $productId, 'store_id' => $toStoreId],
                    ['quantity' => 0, 'reserved_quantity' => 0, 'available_quantity' => 0]
                );

                // Transfer stock
                $sourceStock->quantity -= $quantity;
                $sourceStock->available_quantity = $sourceStock->quantity - $sourceStock->reserved_quantity;
                $sourceStock->save();

                $destStock->quantity += $quantity;
                $destStock->available_quantity = $destStock->quantity - $destStock->reserved_quantity;
                $destStock->save();

                // Create transfer transaction
                $transaction = InventoryTransaction::create([
                    'store_id' => $fromStoreId,
                    'transaction_type' => 'transfer_out',
                    'notes' => "Transferred {$quantity} units to store {$toStoreId}",
                    'created_by' => auth()->id(),
                ]);

                InventoryTransactionItem::create([
                    'inventory_transaction_id' => $transaction->id,
                    'product_id' => $productId,
                    'quantity' => -$quantity,
                    'unit_cost' => 0, // Transfer doesn't affect cost
                    'total_cost' => 0,
                ]);

                // Create receiving transaction
                $receiveTransaction = InventoryTransaction::create([
                    'store_id' => $toStoreId,
                    'transaction_type' => 'transfer_in',
                    'notes' => "Received {$quantity} units from store {$fromStoreId}",
                    'created_by' => auth()->id(),
                ]);

                InventoryTransactionItem::create([
                    'inventory_transaction_id' => $receiveTransaction->id,
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'unit_cost' => 0,
                    'total_cost' => 0,
                ]);

                Log::info('Stock transferred successfully', [
                    'product_id' => $productId,
                    'from_store_id' => $fromStoreId,
                    'to_store_id' => $toStoreId,
                    'quantity' => $quantity,
                ]);

                return [
                    'success' => true,
                    'message' => 'Stock transferred successfully',
                    'data' => [
                        'product_id' => $productId,
                        'quantity_transferred' => $quantity,
                        'source_remaining' => $sourceStock->quantity,
                        'destination_total' => $destStock->quantity,
                        'transaction_id' => $transaction->id,
                    ]
                ];
            });
        } catch (\Exception $e) {
            Log::error('Stock transfer failed', [
                'product_id' => $productId,
                'from_store_id' => $fromStoreId,
                'to_store_id' => $toStoreId,
                'quantity' => $quantity,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Stock transfer failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get stock availability across all stores
     */
    public function getStockAvailability(int $productId): array
    {
        try {
            $product = Product::find($productId);
            
            if (!$product) {
                return [
                    'success' => false,
                    'message' => 'Product not found'
                ];
            }

            $stocks = ProductStock::where('product_id', $productId)
                ->with('store')
                ->get()
                ->map(function ($stock) {
                    return [
                        'store_id' => $stock->store_id,
                        'store_name' => $stock->store->name,
                        'total_quantity' => $stock->quantity,
                        'reserved_quantity' => $stock->reserved_quantity,
                        'available_quantity' => $stock->available_quantity,
                        'status' => $this->getStockStatus($stock->available_quantity, $stock->quantity),
                    ];
                });

            $totalStock = $stocks->sum('total_quantity');
            $totalReserved = $stocks->sum('reserved_quantity');
            $totalAvailable = $stocks->sum('available_quantity');

            return [
                'success' => true,
                'data' => [
                    'product_id' => $productId,
                    'product_name' => $product->name,
                    'stock_managed' => $product->is_stock_managed,
                    'stores' => $stocks,
                    'summary' => [
                        'total_stock' => $totalStock,
                        'total_reserved' => $totalReserved,
                        'total_available' => $totalAvailable,
                        'overall_status' => $this->getStockStatus($totalAvailable, $totalStock),
                    ]
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get stock availability', [
                'product_id' => $productId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to get stock availability: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get low stock items for a store
     */
    public function getLowStockItems(int $storeId, int $threshold = null): array
    {
        try {
            $threshold = $threshold ?? config('inventory.low_stock_threshold', 10);
            
            $lowStockItems = ProductStock::where('store_id', $storeId)
                ->where('available_quantity', '<=', $threshold)
                ->with('product')
                ->get()
                ->map(function ($stock) use ($threshold) {
                    return [
                        'product_id' => $stock->product_id,
                        'product_name' => $stock->product->name,
                        'sku' => $stock->product->sku,
                        'current_stock' => $stock->available_quantity,
                        'threshold' => $threshold,
                        'severity' => $stock->available_quantity <= 0 ? 'critical' : 'warning',
                        'shortfall' => max(0, $threshold - $stock->available_quantity),
                        'last_updated' => $stock->updated_at,
                    ];
                });

            return [
                'success' => true,
                'data' => [
                    'store_id' => $storeId,
                    'threshold' => $threshold,
                    'items' => $lowStockItems,
                    'count' => $lowStockItems->count(),
                    'critical_count' => $lowStockItems->where('severity', 'critical')->count(),
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get low stock items', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to get low stock items: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get expiring items
     */
    public function getExpiringItems(int $storeId, int $daysAhead = 7): array
    {
        try {
            $expiryDate = Carbon::now()->addDays($daysAhead);
            
            $expiringItems = ProductBatch::whereHas('productStock', function($query) use ($storeId) {
                    $query->where('store_id', $storeId);
                })
                ->where('expiry_date', '<=', $expiryDate)
                ->where('expiry_date', '>', now())
                ->with(['product', 'productStock.store'])
                ->get()
                ->map(function ($batch) {
                    $daysUntilExpiry = Carbon::now()->diffInDays($batch->expiry_date);
                    
                    return [
                        'batch_id' => $batch->id,
                        'batch_number' => $batch->batch_number,
                        'product_id' => $batch->product_id,
                        'product_name' => $batch->product->name,
                        'quantity' => $batch->quantity,
                        'expiry_date' => $batch->expiry_date,
                        'days_until_expiry' => $daysUntilExpiry,
                        'severity' => $daysUntilExpiry <= 3 ? 'critical' : ($daysUntilExpiry <= 7 ? 'warning' : 'info'),
                        'cost' => $batch->cost,
                        'total_value' => $batch->quantity * $batch->cost,
                    ];
                });

            return [
                'success' => true,
                'data' => [
                    'store_id' => $storeId,
                    'days_ahead' => $daysAhead,
                    'items' => $expiringItems,
                    'count' => $expiringItems->count(),
                    'critical_count' => $expiringItems->where('severity', 'critical')->count(),
                    'total_value_at_risk' => $expiringItems->sum('total_value'),
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get expiring items', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to get expiring items: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Select batch for stock deduction (FIFO)
     */
    private function selectBatchForDeduction(int $productId, int $storeId, float $quantity): ?int
    {
        $batch = ProductBatch::where('product_id', $productId)
            ->whereHas('productStock', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->where('quantity', '>', 0)
            ->orderBy('expiry_date', 'asc')
            ->orderBy('created_at', 'asc')
            ->first();

        if ($batch && $batch->quantity >= $quantity) {
            $batch->quantity -= $quantity;
            $batch->save();
            
            return $batch->id;
        }

        return null;
    }

    /**
     * Get stock status based on available quantity
     */
    private function getStockStatus(float $available, float $total): string
    {
        if ($available <= 0) {
            return 'out_of_stock';
        } elseif ($available <= $total * 0.1) {
            return 'critical';
        } elseif ($available <= $total * 0.25) {
            return 'low';
        } else {
            return 'adequate';
        }
    }

    /**
     * Generate batch number
     */
    private function generateBatchNumber(): string
    {
        return 'BATCH-' . date('Ymd') . '-' . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
    }

    /**
     * Get inventory valuation for a store
     */
    public function getInventoryValuation(int $storeId): array
    {
        try {
            $stocks = ProductStock::where('store_id', $storeId)
                ->with(['product', 'batches'])
                ->get();

            $totalValue = 0;
            $categories = [];

            foreach ($stocks as $stock) {
                $stockValue = $stock->quantity * ($stock->product->cost_price ?? 0);
                $totalValue += $stockValue;

                $category = $stock->product->category ?? 'Uncategorized';
                if (!isset($categories[$category])) {
                    $categories[$category] = [
                        'name' => $category,
                        'value' => 0,
                        'items' => 0,
                    ];
                }
                $categories[$category]['value'] += $stockValue;
                $categories[$category]['items']++;
            }

            return [
                'success' => true,
                'data' => [
                    'store_id' => $storeId,
                    'total_value' => $totalValue,
                    'total_items' => $stocks->count(),
                    'categories' => array_values($categories),
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get inventory valuation', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to get inventory valuation: ' . $e->getMessage()
            ];
        }
    }
}