<?php

namespace App\Services\Restaurant;

use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantOrderItem;
use App\Models\Restaurant\RestaurantOrderItemModifier;
use App\Models\Product;
use App\Services\InventoryManagementService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class RestaurantInventoryIntegrationService
{
    protected InventoryManagementService $inventoryService;

    public function __construct(InventoryManagementService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Reserve stock for all items in an order
     */
    public function reserveOrderStock(RestaurantOrder $order): array
    {
        try {
            return DB::transaction(function() use ($order) {
                $reservationResults = [];
                $totalItemsProcessed = 0;
                $failedItems = [];

                foreach ($order->items as $orderItem) {
                    // Reserve main product stock
                    $productResult = $this->reserveOrderItemStock($orderItem, $order);
                    
                    if ($productResult['success']) {
                        $reservationResults[] = $productResult['data'];
                        $totalItemsProcessed++;
                    } else {
                        $failedItems[] = [
                            'item_id' => $orderItem->id,
                            'product_name' => $orderItem->product->name,
                            'error' => $productResult['message']
                        ];
                        continue;
                    }

                    // Reserve modifier stock
                    $modifierResults = $this->reserveModifierStock($orderItem, $order);
                    if ($modifierResults['success']) {
                        $reservationResults = array_merge($reservationResults, $modifierResults['data']);
                    } else {
                        $failedItems[] = array_merge($failedItems, $modifierResults['failed_items']);
                    }
                }

                // Check if any items failed
                if (!empty($failedItems)) {
                    // Rollback all reservations
                    $this->rollbackOrderReservations($order, $reservationResults);
                    
                    return [
                        'success' => false,
                        'message' => 'Stock reservation failed for some items',
                        'failed_items' => $failedItems,
                        'data' => [
                            'items_processed' => $totalItemsProcessed,
                            'failed_count' => count($failedItems),
                        ]
                    ];
                }

                Log::info('Order stock reserved successfully', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'items_processed' => $totalItemsProcessed,
                ]);

                return [
                    'success' => true,
                    'message' => 'Stock reserved successfully for all order items',
                    'data' => [
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                        'items_processed' => $totalItemsProcessed,
                        'reservations' => $reservationResults,
                    ]
                ];
            });
        } catch (\Exception $e) {
            Log::error('Order stock reservation failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Order stock reservation failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Reserve stock for a single order item
     */
    private function reserveOrderItemStock(RestaurantOrderItem $orderItem, RestaurantOrder $order): array
    {
        $product = $orderItem->product;
        
        if (!$product || !$product->is_stock_managed) {
            return [
                'success' => true,
                'data' => [
                    'type' => 'product',
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity_reserved' => $orderItem->quantity,
                    'stock_managed' => false,
                ]
            ];
        }

        // Handle recipe-based stock deduction for complex menu items
        if ($product->is_recipe) {
            return $this->reserveRecipeStock($product, $orderItem->quantity, $order);
        }

        // Reserve simple product stock
        return $this->inventoryService->reserveStock(
            $product->id,
            $order->store_id,
            $orderItem->quantity,
            $order->order_number
        );
    }

    /**
     * Reserve stock for recipe ingredients
     */
    private function reserveRecipeStock(Product $recipeProduct, float $quantity, RestaurantOrder $order): array
    {
        try {
            $recipeIngredients = $this->getRecipeIngredients($recipeProduct->id);
            $ingredientReservations = [];
            $failedIngredients = [];

            foreach ($recipeIngredients as $ingredient) {
                $requiredQuantity = $ingredient->quantity * $quantity;
                
                $result = $this->inventoryService->reserveStock(
                    $ingredient->ingredient_product_id,
                    $order->store_id,
                    $requiredQuantity,
                    $order->order_number . ' (Recipe: ' . $recipeProduct->name . ')'
                );

                if ($result['success']) {
                    $ingredientReservations[] = array_merge($result['data'], [
                        'type' => 'recipe_ingredient',
                        'recipe_product_id' => $recipeProduct->id,
                        'recipe_product_name' => $recipeProduct->name,
                        'ingredient_product_id' => $ingredient->ingredient_product_id,
                        'ingredient_name' => $ingredient->ingredient->name,
                    ]);
                } else {
                    $failedIngredients[] = [
                        'ingredient_name' => $ingredient->ingredient->name,
                        'error' => $result['message']
                    ];
                }
            }

            if (!empty($failedIngredients)) {
                // Rollback ingredient reservations
                $this->rollbackIngredientReservations($ingredientReservations, $order->store_id);
                
                return [
                    'success' => false,
                    'message' => 'Failed to reserve recipe ingredients',
                    'failed_ingredients' => $failedIngredients
                ];
            }

            return [
                'success' => true,
                'data' => $ingredientReservations
            ];
        } catch (\Exception $e) {
            Log::error('Recipe stock reservation failed', [
                'recipe_product_id' => $recipeProduct->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Recipe stock reservation failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Reserve stock for item modifiers
     */
    private function reserveModifierStock(RestaurantOrderItem $orderItem, RestaurantOrder $order): array
    {
        $modifierReservations = [];
        $failedModifiers = [];

        foreach ($orderItem->modifiers as $modifier) {
            $modifierProduct = $modifier->modifier;
            
            if (!$modifierProduct || !$modifierProduct->is_stock_managed) {
                continue;
            }

            $requiredQuantity = $modifier->quantity * $orderItem->quantity;
            
            $result = $this->inventoryService->reserveStock(
                $modifierProduct->id,
                $order->store_id,
                $requiredQuantity,
                $order->order_number . ' (Modifier: ' . $modifierProduct->name . ')'
            );

            if ($result['success']) {
                $modifierReservations[] = array_merge($result['data'], [
                    'type' => 'modifier',
                    'modifier_id' => $modifier->id,
                    'modifier_name' => $modifierProduct->name,
                    'order_item_id' => $orderItem->id,
                ]);
            } else {
                $failedModifiers[] = [
                    'modifier_name' => $modifierProduct->name,
                    'error' => $result['message']
                ];
            }
        }

        return [
            'success' => empty($failedModifiers),
            'data' => $modifierReservations,
            'failed_items' => $failedModifiers
        ];
    }

    /**
     * Release reserved stock for cancelled/modified order
     */
    public function releaseOrderStock(RestaurantOrder $order, string $reason = 'Order cancelled'): array
    {
        try {
            return DB::transaction(function() use ($order, $reason) {
                $releaseResults = [];
                $totalItemsProcessed = 0;

                foreach ($order->items as $orderItem) {
                    // Release main product stock
                    $productResult = $this->releaseOrderItemStock($orderItem, $order, $reason);
                    
                    if ($productResult['success']) {
                        $releaseResults[] = $productResult['data'];
                        $totalItemsProcessed++;
                    }

                    // Release modifier stock
                    $modifierResults = $this->releaseModifierStock($orderItem, $order, $reason);
                    if ($modifierResults['success']) {
                        $releaseResults = array_merge($releaseResults, $modifierResults['data']);
                    }
                }

                Log::info('Order stock released successfully', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'items_processed' => $totalItemsProcessed,
                    'reason' => $reason,
                ]);

                return [
                    'success' => true,
                    'message' => 'Stock released successfully',
                    'data' => [
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                        'items_processed' => $totalItemsProcessed,
                        'releases' => $releaseResults,
                    ]
                ];
            });
        } catch (\Exception $e) {
            Log::error('Order stock release failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Order stock release failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Release stock for a single order item
     */
    private function releaseOrderItemStock(RestaurantOrderItem $orderItem, RestaurantOrder $order, string $reason): array
    {
        $product = $orderItem->product;
        
        if (!$product || !$product->is_stock_managed) {
            return [
                'success' => true,
                'data' => [
                    'type' => 'product',
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity_released' => $orderItem->quantity,
                    'stock_managed' => false,
                ]
            ];
        }

        // Handle recipe-based stock release
        if ($product->is_recipe) {
            return $this->releaseRecipeStock($product, $orderItem->quantity, $order->store_id, $reason);
        }

        // Release simple product stock
        return $this->inventoryService->releaseReservedStock(
            $product->id,
            $order->store_id,
            $orderItem->quantity,
            $reason . ' - Order: ' . $order->order_number
        );
    }

    /**
     * Release recipe ingredient stock
     */
    private function releaseRecipeStock(Product $recipeProduct, float $quantity, int $storeId, string $reason): array
    {
        try {
            $recipeIngredients = $this->getRecipeIngredients($recipeProduct->id);
            $ingredientReleases = [];

            foreach ($recipeIngredients as $ingredient) {
                $releaseQuantity = $ingredient->quantity * $quantity;
                
                $result = $this->inventoryService->releaseReservedStock(
                    $ingredient->ingredient_product_id,
                    $storeId,
                    $releaseQuantity,
                    $reason . ' - Recipe: ' . $recipeProduct->name
                );

                if ($result['success']) {
                    $ingredientReleases[] = array_merge($result['data'], [
                        'type' => 'recipe_ingredient',
                        'recipe_product_id' => $recipeProduct->id,
                        'recipe_product_name' => $recipeProduct->name,
                        'ingredient_product_id' => $ingredient->ingredient_product_id,
                        'ingredient_name' => $ingredient->ingredient->name,
                    ]);
                }
            }

            return [
                'success' => true,
                'data' => $ingredientReleases
            ];
        } catch (\Exception $e) {
            Log::error('Recipe stock release failed', [
                'recipe_product_id' => $recipeProduct->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Recipe stock release failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Release modifier stock
     */
    private function releaseModifierStock(RestaurantOrderItem $orderItem, RestaurantOrder $order, string $reason): array
    {
        $modifierReleases = [];

        foreach ($orderItem->modifiers as $modifier) {
            $modifierProduct = $modifier->modifier;
            
            if (!$modifierProduct || !$modifierProduct->is_stock_managed) {
                continue;
            }

            $releaseQuantity = $modifier->quantity * $orderItem->quantity;
            
            $result = $this->inventoryService->releaseReservedStock(
                $modifierProduct->id,
                $order->store_id,
                $releaseQuantity,
                $reason . ' - Modifier: ' . $modifierProduct->name
            );

            if ($result['success']) {
                $modifierReleases[] = array_merge($result['data'], [
                    'type' => 'modifier',
                    'modifier_id' => $modifier->id,
                    'modifier_name' => $modifierProduct->name,
                    'order_item_id' => $orderItem->id,
                ]);
            }
        }

        return [
            'success' => true,
            'data' => $modifierReleases
        ];
    }

    /**
     * Deduct stock on payment completion
     */
    public function deductOrderStock(RestaurantOrder $order): array
    {
        try {
            return DB::transaction(function() use ($order) {
                $deductionResults = [];
                $totalItemsProcessed = 0;

                foreach ($order->items as $orderItem) {
                    // Deduct main product stock
                    $productResult = $this->deductOrderItemStock($orderItem, $order);
                    
                    if ($productResult['success']) {
                        $deductionResults[] = $productResult['data'];
                        $totalItemsProcessed++;
                    }

                    // Deduct modifier stock
                    $modifierResults = $this->deductModifierStock($orderItem, $order);
                    if ($modifierResults['success']) {
                        $deductionResults = array_merge($deductionResults, $modifierResults['data']);
                    }
                }

                // Track waste and spoilage
                $this->trackWasteAndSpoilage($order, $deductionResults);

                Log::info('Order stock deducted successfully', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'items_processed' => $totalItemsProcessed,
                ]);

                return [
                    'success' => true,
                    'message' => 'Stock deducted successfully',
                    'data' => [
                        'order_id' => $order->id,
                        'order_number' => $order->order_number,
                        'items_processed' => $totalItemsProcessed,
                        'deductions' => $deductionResults,
                    ]
                ];
            });
        } catch (\Exception $e) {
            Log::error('Order stock deduction failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Order stock deduction failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Deduct stock for a single order item
     */
    private function deductOrderItemStock(RestaurantOrderItem $orderItem, RestaurantOrder $order): array
    {
        $product = $orderItem->product;
        
        if (!$product || !$product->is_stock_managed) {
            return [
                'success' => true,
                'data' => [
                    'type' => 'product',
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity_deducted' => $orderItem->quantity,
                    'stock_managed' => false,
                ]
            ];
        }

        // Handle recipe-based stock deduction
        if ($product->is_recipe) {
            return $this->deductRecipeStock($product, $orderItem->quantity, $order);
        }

        // Deduct simple product stock
        return $this->inventoryService->deductStock(
            $product->id,
            $order->store_id,
            $orderItem->quantity,
            'restaurant_order',
            $order->id
        );
    }

    /**
     * Deduct recipe ingredient stock
     */
    private function deductRecipeStock(Product $recipeProduct, float $quantity, RestaurantOrder $order): array
    {
        try {
            $recipeIngredients = $this->getRecipeIngredients($recipeProduct->id);
            $ingredientDeductions = [];

            foreach ($recipeIngredients as $ingredient) {
                $deductQuantity = $ingredient->quantity * $quantity;
                
                $result = $this->inventoryService->deductStock(
                    $ingredient->ingredient_product_id,
                    $order->store_id,
                    $deductQuantity,
                    'restaurant_order_recipe',
                    $order->id
                );

                if ($result['success']) {
                    $ingredientDeductions[] = array_merge($result['data'], [
                        'type' => 'recipe_ingredient',
                        'recipe_product_id' => $recipeProduct->id,
                        'recipe_product_name' => $recipeProduct->name,
                        'ingredient_product_id' => $ingredient->ingredient_product_id,
                        'ingredient_name' => $ingredient->ingredient->name,
                    ]);
                }
            }

            return [
                'success' => true,
                'data' => $ingredientDeductions
            ];
        } catch (\Exception $e) {
            Log::error('Recipe stock deduction failed', [
                'recipe_product_id' => $recipeProduct->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Recipe stock deduction failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Deduct modifier stock
     */
    private function deductModifierStock(RestaurantOrderItem $orderItem, RestaurantOrder $order): array
    {
        $modifierDeductions = [];

        foreach ($orderItem->modifiers as $modifier) {
            $modifierProduct = $modifier->modifier;
            
            if (!$modifierProduct || !$modifierProduct->is_stock_managed) {
                continue;
            }

            $deductQuantity = $modifier->quantity * $orderItem->quantity;
            
            $result = $this->inventoryService->deductStock(
                $modifierProduct->id,
                $order->store_id,
                $deductQuantity,
                'restaurant_order_modifier',
                $order->id
            );

            if ($result['success']) {
                $modifierDeductions[] = array_merge($result['data'], [
                    'type' => 'modifier',
                    'modifier_id' => $modifier->id,
                    'modifier_name' => $modifierProduct->name,
                    'order_item_id' => $orderItem->id,
                ]);
            }
        }

        return [
            'success' => true,
            'data' => $modifierDeductions
        ];
    }

    /**
     * Get recipe ingredients for a product
     */
    private function getRecipeIngredients(int $recipeProductId)
    {
        // This would query a recipe_ingredients table
        // For now, return empty collection as placeholder
        return collect([]);
    }

    /**
     * Rollback order reservations
     */
    private function rollbackOrderReservations(RestaurantOrder $order, array $reservations): void
    {
        foreach ($reservations as $reservation) {
            if ($reservation['stock_managed']) {
                $this->inventoryService->releaseReservedStock(
                    $reservation['product_id'],
                    $reservation['store_id'] ?? $order->store_id,
                    $reservation['quantity_reserved'],
                    'Rollback - Order reservation failed'
                );
            }
        }
    }

    /**
     * Rollback ingredient reservations
     */
    private function rollbackIngredientReservations(array $reservations, int $storeId): void
    {
        foreach ($reservations as $reservation) {
            if ($reservation['stock_managed']) {
                $this->inventoryService->releaseReservedStock(
                    $reservation['ingredient_product_id'],
                    $storeId,
                    $reservation['quantity_reserved'],
                    'Rollback - Recipe reservation failed'
                );
            }
        }
    }

    /**
     * Track waste and spoilage
     */
    private function trackWasteAndSpoilage(RestaurantOrder $order, array $deductions): void
    {
        // This would track waste based on actual usage vs expected usage
        // For now, it's a placeholder for future implementation
        Log::info('Waste tracking', [
            'order_id' => $order->id,
            'deductions_count' => count($deductions),
        ]);
    }

    /**
     * Get stock forecasting based on sales data
     */
    public function getStockForecasting(int $storeId, int $daysAhead = 7): array
    {
        try {
            $forecastData = [];
            $products = Product::where('is_stock_managed', true)->get();

            foreach ($products as $product) {
                // Calculate average daily usage based on last 30 days
                $avgDailyUsage = $this->calculateAverageDailyUsage($product->id, $storeId);
                
                // Get current stock
                $currentStock = $this->inventoryService->getStockAvailability($product->id);
                
                if (!$currentStock['success']) {
                    continue;
                }

                $storeStock = $currentStock['data']['stores']->firstWhere('store_id', $storeId);
                if (!$storeStock) {
                    continue;
                }

                // Generate forecast for each day
                $dailyForecast = [];
                $projectedStock = $storeStock['available_quantity'];

                for ($day = 1; $day <= $daysAhead; $day++) {
                    $projectedStock = max(0, $projectedStock - $avgDailyUsage);
                    $forecastDate = now()->addDays($day)->format('Y-m-d');
                    
                    $dailyForecast[] = [
                        'date' => $forecastDate,
                        'projected_stock' => $projectedStock,
                        'reorder_point' => $product->alert_quantity ?? 10,
                        'reorder_needed' => $projectedStock <= ($product->alert_quantity ?? 10),
                        'days_of_stock' => $avgDailyUsage > 0 ? floor($projectedStock / $avgDailyUsage) : 999,
                    ];
                }

                $forecastData[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'current_stock' => $storeStock['available_quantity'],
                    'avg_daily_usage' => $avgDailyUsage,
                    'forecast' => $dailyForecast,
                    'reorder_suggested' => $storeStock['available_quantity'] <= ($product->alert_quantity ?? 10),
                    'suggested_order_quantity' => max(0, ($product->alert_quantity ?? 10) * 2 - $storeStock['available_quantity']),
                ];
            }

            return [
                'success' => true,
                'data' => [
                    'store_id' => $storeId,
                    'forecast_days' => $daysAhead,
                    'generated_at' => now()->toISOString(),
                    'products' => $forecastData,
                    'summary' => [
                        'total_products' => count($forecastData),
                        'products_needing_reorder' => collect($forecastData)->where('reorder_suggested', true)->count(),
                    ]
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Stock forecasting failed', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Stock forecasting failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Calculate average daily usage for a product
     */
    private function calculateAverageDailyUsage(int $productId, int $storeId): float
    {
        // This would calculate based on historical sales data
        // For now, return a simple calculation
        try {
            $usage = DB::table('inventory_transaction_items')
                ->join('inventory_transactions', 'inventory_transaction_items.inventory_transaction_id', '=', 'inventory_transactions.id')
                ->where('inventory_transaction_items.product_id', $productId)
                ->where('inventory_transactions.store_id', $storeId)
                ->where('inventory_transactions.transaction_type', 'sale')
                ->where('inventory_transactions.created_at', '>=', now()->subDays(30))
                ->sum('inventory_transaction_items.quantity');

            return abs($usage) / 30; // Average daily usage
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Get ingredient usage analytics
     */
    public function getIngredientUsageAnalytics(int $storeId, string $startDate, string $endDate): array
    {
        try {
            $usageData = DB::table('inventory_transaction_items')
                ->join('inventory_transactions', 'inventory_transaction_items.inventory_transaction_id', '=', 'inventory_transactions.id')
                ->join('products', 'inventory_transaction_items.product_id', '=', 'products.id')
                ->where('inventory_transactions.store_id', $storeId)
                ->where('inventory_transactions.transaction_type', 'sale')
                ->whereBetween('inventory_transactions.created_at', [$startDate, $endDate])
                ->selectRaw('
                    products.id as product_id,
                    products.name as product_name,
                    SUM(ABS(inventory_transaction_items.quantity)) as total_used,
                    COUNT(*) as usage_count,
                    AVG(inventory_transaction_items.unit_cost) as avg_cost,
                    SUM(ABS(inventory_transaction_items.total_cost)) as total_cost
                ')
                ->groupBy('products.id', 'products.name')
                ->orderBy('total_used', 'desc')
                ->get();

            return [
                'success' => true,
                'data' => [
                    'store_id' => $storeId,
                    'period' => [
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ],
                    'ingredients' => $usageData->map(function($item) {
                        return [
                            'product_id' => $item->product_id,
                            'product_name' => $item->product_name,
                            'total_used' => $item->total_used,
                            'usage_count' => $item->usage_count,
                            'avg_cost' => $item->avg_cost,
                            'total_cost' => $item->total_cost,
                            'cost_per_unit' => $item->total_used > 0 ? $item->total_cost / $item->total_used : 0,
                        ];
                    }),
                    'summary' => [
                        'total_ingredients_used' => $usageData->count(),
                        'total_quantity_used' => $usageData->sum('total_used'),
                        'total_cost' => $usageData->sum('total_cost'),
                    ]
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Ingredient usage analytics failed', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Ingredient usage analytics failed: ' . $e->getMessage()
            ];
        }
    }
}