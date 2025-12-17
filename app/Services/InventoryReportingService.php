<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductStock;
use App\Models\ProductBatch;
use App\Models\Store;
use App\Models\InventoryTransaction;
use App\Models\InventoryTransactionItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class InventoryReportingService
{
    /**
     * Generate comprehensive inventory valuation report
     */
    public function generateInventoryValuationReport(int $storeId, string $startDate = null, string $endDate = null): array
    {
        try {
            $query = ProductStock::where('store_id', $storeId)
                ->with(['product', 'batch']);

            if ($startDate) {
                $query->whereDate('created_at', '>=', $startDate);
            }

            if ($endDate) {
                $query->whereDate('created_at', '<=', $endDate);
            }

            $stockData = $query->get();

            $reportData = [
                'store_id' => $storeId,
                'report_type' => 'inventory_valuation',
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'generated_at' => now()->toISOString(),
                ],
                'summary' => [
                    'total_products' => $stockData->count(),
                    'total_quantity' => $stockData->sum('quantity'),
                    'total_available' => $stockData->sum('available_quantity'),
                    'total_reserved' => $stockData->sum('reserved_quantity'),
                    'total_value' => $stockData->sum(function ($stock) {
                        return $stock->available_quantity * ($stock->product->cost_price ?? 0);
                    }),
                    'average_cost_per_item' => $stockData->count() > 0 ? 
                        $stockData->sum(function ($stock) {
                            return $stock->available_quantity * ($stock->product->cost_price ?? 0);
                        }) / $stockData->sum('available_quantity') : 0,
                ],
                'categories' => $this->getValuationByCategory($stockData),
                'low_stock_items' => $this->getLowStockItems($stockData),
                'out_of_stock_items' => $this->getOutOfStockItems($stockData),
                'expiring_items' => $this->getExpiringItems($stockData),
                'overstock_items' => $this->getOverstockItems($stockData),
                'top_value_items' => $this->getTopValueItems($stockData),
                'dead_stock_items' => $this->getDeadStockItems($stockData),
            ];

            Log::info('Inventory valuation report generated', [
                'store_id' => $storeId,
                'total_products' => $reportData['summary']['total_products'],
                'total_value' => $reportData['summary']['total_value'],
            ]);

            return [
                'success' => true,
                'data' => $reportData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate inventory valuation report', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate inventory valuation report: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate food cost analysis report
     */
    public function generateFoodCostAnalysisReport(int $storeId, string $startDate, string $endDate): array
    {
        try {
            $salesData = DB::table('restaurant_order_items')
                ->join('restaurant_orders', 'restaurant_order_items.order_id', '=', 'restaurant_orders.id')
                ->join('products', 'restaurant_order_items.product_id', '=', 'products.id')
                ->where('restaurant_orders.store_id', $storeId)
                ->whereBetween('restaurant_orders.created_at', [$startDate, $endDate])
                ->where('restaurant_orders.payment_status', 'paid')
                ->selectRaw('
                    products.id as product_id,
                    products.name as product_name,
                    products.cost_price as unit_cost,
                    SUM(restaurant_order_items.quantity) as total_quantity_sold,
                    SUM(restaurant_order_items.quantity * restaurant_order_items.unit_price) as total_revenue,
                    SUM(restaurant_order_items.quantity * products.cost_price) as total_cost,
                    AVG(restaurant_order_items.unit_price) as avg_selling_price,
                    COUNT(*) as order_count
                ')
                ->groupBy('products.id', 'products.name', 'products.cost_price')
                ->get();

            $foodCostAnalysis = $salesData->map(function ($item) {
                $foodCostPercentage = $item->total_revenue > 0 ? 
                    ($item->total_cost / $item->total_revenue) * 100 : 0;
                $profitMargin = $item->total_revenue > 0 ? 
                    (($item->total_revenue - $item->total_cost) / $item->total_revenue) * 100 : 0;

                return [
                    'product_id' => $item->product_id,
                    'product_name' => $item->product_name,
                    'unit_cost' => $item->unit_cost,
                    'avg_selling_price' => $item->avg_selling_price,
                    'total_quantity_sold' => $item->total_quantity_sold,
                    'total_revenue' => $item->total_revenue,
                    'total_cost' => $item->total_cost,
                    'food_cost_percentage' => round($foodCostPercentage, 2),
                    'profit_margin' => round($profitMargin, 2),
                    'order_count' => $item->order_count,
                ];
            });

            $summary = [
                'total_products' => $foodCostAnalysis->count(),
                'total_revenue' => $foodCostAnalysis->sum('total_revenue'),
                'total_cost' => $foodCostAnalysis->sum('total_cost'),
                'total_quantity_sold' => $foodCostAnalysis->sum('total_quantity_sold'),
                'average_food_cost_percentage' => $foodCostAnalysis->count() > 0 ? 
                    $foodCostAnalysis->sum('total_cost') / $foodCostAnalysis->sum('total_revenue') * 100 : 0,
                'average_profit_margin' => $foodCostAnalysis->count() > 0 ? 
                    $foodCostAnalysis->sum('total_revenue') > 0 ? 
                        (($foodCostAnalysis->sum('total_revenue') - $foodCostAnalysis->sum('total_cost')) / $foodCostAnalysis->sum('total_revenue')) * 100 : 0 : 0,
            ];

            $reportData = [
                'store_id' => $storeId,
                'report_type' => 'food_cost_analysis',
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'generated_at' => now()->toISOString(),
                ],
                'summary' => $summary,
                'products' => $foodCostAnalysis,
                'high_food_cost_items' => $foodCostAnalysis->filter(fn($item) => $item['food_cost_percentage'] > 40),
                'low_profit_items' => $foodCostAnalysis->filter(fn($item) => $item['profit_margin'] < 20),
                'best_performing_items' => $foodCostAnalysis->sortByDesc('profit_margin')->take(10),
                'worst_performing_items' => $foodCostAnalysis->sortBy('profit_margin')->take(10),
            ];

            Log::info('Food cost analysis report generated', [
                'store_id' => $storeId,
                'period' => $startDate . ' to ' . $endDate,
                'average_food_cost' => $summary['average_food_cost_percentage'],
            ]);

            return [
                'success' => true,
                'data' => $reportData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate food cost analysis report', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate food cost analysis report: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate waste and spoilage report
     */
    public function generateWasteSpoilageReport(int $storeId, string $startDate, string $endDate): array
    {
        try {
            // This would query waste tracking records
            // For now, simulate waste data from transactions
            $wasteData = $this->getWasteData($storeId, $startDate, $endDate);

            $summary = [
                'total_waste_value' => $wasteData->sum('waste_value'),
                'total_waste_quantity' => $wasteData->sum('waste_quantity'),
                'waste_percentage' => $this->calculateWastePercentage($storeId, $startDate, $endDate),
                'most_wasted_products' => $wasteData->sortByDesc('waste_value')->take(10),
                'waste_by_reason' => $wasteData->groupBy('waste_reason')->map(function ($group) {
                    return [
                        'reason' => $group->first()['waste_reason'],
                        'total_value' => $group->sum('waste_value'),
                        'total_quantity' => $group->sum('waste_quantity'),
                        'count' => $group->count(),
                    ];
                })->values(),
            ];

            $reportData = [
                'store_id' => $storeId,
                'report_type' => 'waste_spoilage',
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'generated_at' => now()->toISOString(),
                ],
                'summary' => $summary,
                'waste_items' => $wasteData,
            ];

            Log::info('Waste and spoilage report generated', [
                'store_id' => $storeId,
                'period' => $startDate . ' to ' . $endDate,
                'total_waste_value' => $summary['total_waste_value'],
            ]);

            return [
                'success' => true,
                'data' => $reportData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate waste and spoilage report', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate waste and spoilage report: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate inventory turnover report
     */
    public function generateInventoryTurnoverReport(int $storeId, string $startDate, string $endDate): array
    {
        try {
            $stockData = ProductStock::where('store_id', $storeId)
                ->with(['product', 'transactions'])
                ->get();

            $turnoverData = $stockData->map(function ($stock) {
                $turnoverRatio = $this->calculateTurnoverRatio($stock, $startDate, $endDate);
                $daysOfSupply = $this->calculateDaysOfSupply($stock);
                
                return [
                    'product_id' => $stock->product_id,
                    'product_name' => $stock->product->name,
                    'sku' => $stock->product->sku,
                    'current_stock' => $stock->available_quantity,
                    'average_stock' => $stock->quantity / 2, // Simplified average
                    'turnover_ratio' => $turnoverRatio,
                    'days_of_supply' => $daysOfSupply,
                    'turnover_classification' => $this->classifyTurnover($turnoverRatio),
                    'cost_of_goods_sold' => $this->calculateCostOfGoodsSold($stock, $startDate, $endDate),
                    'stock_value' => $stock->available_quantity * ($stock->product->cost_price ?? 0),
                ];
            });

            $summary = [
                'total_products' => $turnoverData->count(),
                'average_turnover_ratio' => $turnoverData->avg('turnover_ratio'),
                'average_days_of_supply' => $turnoverData->avg('days_of_supply'),
                'fast_moving_items' => $turnoverData->filter(fn($item) => $item['turnover_classification'] === 'fast')->count(),
                'slow_moving_items' => $turnoverData->filter(fn($item) => $item['turnover_classification'] === 'slow')->count(),
                'dead_stock_items' => $turnoverData->filter(fn($item) => $item['turnover_classification'] === 'dead')->count(),
            ];

            $reportData = [
                'store_id' => $storeId,
                'report_type' => 'inventory_turnover',
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'generated_at' => now()->toISOString(),
                ],
                'summary' => $summary,
                'products' => $turnoverData,
            ];

            Log::info('Inventory turnover report generated', [
                'store_id' => $storeId,
                'period' => $startDate . ' to ' . $endDate,
                'average_turnover' => $summary['average_turnover_ratio'],
            ]);

            return [
                'success' => true,
                'data' => $reportData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate inventory turnover report', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate inventory turnover report: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate ingredient usage report
     */
    public function generateIngredientUsageReport(int $storeId, string $startDate, string $endDate): array
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
                    products.sku as sku,
                    SUM(ABS(inventory_transaction_items.quantity)) as total_quantity_used,
                    COUNT(*) as usage_count,
                    AVG(inventory_transaction_items.unit_cost) as avg_cost,
                    SUM(ABS(inventory_transaction_items.total_cost)) as total_cost,
                    inventory_transactions.created_at as last_used_date
                ')
                ->groupBy('products.id', 'products.name', 'products.sku')
                ->orderBy('total_quantity_used', 'desc')
                ->get();

            $summary = [
                'total_ingredients_used' => $usageData->count(),
                'total_quantity_consumed' => $usageData->sum('total_quantity_used'),
                'total_cost' => $usageData->sum('total_cost'),
                'most_used_ingredients' => $usageData->sortByDesc('total_quantity_used')->take(10),
                'highest_cost_ingredients' => $usageData->sortByDesc('total_cost')->take(10),
                'usage_trends' => $this->analyzeUsageTrends($usageData),
            ];

            $reportData = [
                'store_id' => $storeId,
                'report_type' => 'ingredient_usage',
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'generated_at' => now()->toISOString(),
                ],
                'summary' => $summary,
                'ingredients' => $usageData,
            ];

            Log::info('Ingredient usage report generated', [
                'store_id' => $storeId,
                'period' => $startDate . ' to ' . $endDate,
                'total_ingredients' => $summary['total_ingredients_used'],
            ]);

            return [
                'success' => true,
                'data' => $reportData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate ingredient usage report', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate ingredient usage report: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate variance analysis report
     */
    public function generateVarianceAnalysisReport(int $storeId, string $startDate, string $endDate): array
    {
        try {
            $varianceData = $this->getVarianceData($storeId, $startDate, $endDate);

            $summary = [
                'total_variances' => $varianceData->count(),
                'total_positive_variance' => $varianceData->where('variance_amount', '>', 0)->sum('variance_amount'),
                'total_negative_variance' => abs($varianceData->where('variance_amount', '<', 0)->sum('variance_amount')),
                'average_variance_percentage' => $varianceData->count() > 0 ? 
                    $varianceData->avg('variance_percentage') : 0,
                'highest_positive_variance' => $varianceData->where('variance_amount', '>', 0)->max('variance_amount'),
                'highest_negative_variance' => $varianceData->where('variance_amount', '<', 0)->min('variance_amount'),
                'variance_by_reason' => $varianceData->groupBy('variance_reason')->map(function ($group) {
                    return [
                        'reason' => $group->first()['variance_reason'],
                        'count' => $group->count(),
                        'total_variance' => $group->sum('variance_amount'),
                        'average_variance' => $group->avg('variance_amount'),
                    ];
                })->values(),
            ];

            $reportData = [
                'store_id' => $storeId,
                'report_type' => 'variance_analysis',
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'generated_at' => now()->toISOString(),
                ],
                'summary' => $summary,
                'variances' => $varianceData,
            ];

            Log::info('Variance analysis report generated', [
                'store_id' => $storeId,
                'period' => $startDate . ' to ' . $endDate,
                'total_variances' => $summary['total_variances'],
            ]);

            return [
                'success' => true,
                'data' => $reportData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate variance analysis report', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate variance analysis report: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get valuation by category
     */
    private function getValuationByCategory($stockData)
    {
        return $stockData->groupBy(function ($stock) {
            $category = $stock->product->category ?? 'Uncategorized';
            return $category;
        })->map(function ($group) {
            $totalValue = $group->sum(function ($stock) {
                return $stock->available_quantity * ($stock->product->cost_price ?? 0);
            });

            return [
                'category' => $group->first()->product->category ?? 'Uncategorized',
                'total_products' => $group->count(),
                'total_quantity' => $group->sum('available_quantity'),
                'total_value' => $totalValue,
                'average_value_per_item' => $group->count() > 0 ? $totalValue / $group->sum('available_quantity') : 0,
            ];
        })->values();
    }

    /**
     * Get low stock items
     */
    private function getLowStockItems($stockData)
    {
        return $stockData->filter(function ($stock) {
            return $stock->available_quantity <= ($stock->product->alert_quantity ?? 10);
        })->map(function ($stock) {
            return [
                'product_id' => $stock->product_id,
                'product_name' => $stock->product->name,
                'current_stock' => $stock->available_quantity,
                'alert_threshold' => $stock->product->alert_quantity ?? 10,
                'shortfall' => max(0, ($stock->product->alert_quantity ?? 10) - $stock->available_quantity),
                'stock_value' => $stock->available_quantity * ($stock->product->cost_price ?? 0),
            ];
        })->values();
    }

    /**
     * Get out of stock items
     */
    private function getOutOfStockItems($stockData)
    {
        return $stockData->filter(function ($stock) {
            return $stock->available_quantity <= 0;
        })->map(function ($stock) {
            return [
                'product_id' => $stock->product_id,
                'product_name' => $stock->product->name,
                'current_stock' => $stock->available_quantity,
                'days_out_of_stock' => $this->calculateDaysOutOfStock($stock),
            ];
        })->values();
    }

    /**
     * Get expiring items
     */
    private function getExpiringItems($stockData)
    {
        return $stockData->filter(function ($stock) {
            return $stock->batch && 
                   $stock->batch->expiry_date && 
                   $stock->batch->expiry_date->isFuture() &&
                   $stock->batch->expiry_date->diffInDays(now()) <= 30;
        })->map(function ($stock) {
            return [
                'product_id' => $stock->product_id,
                'product_name' => $stock->product->name,
                'batch_number' => $stock->batch->batch_number,
                'quantity' => $stock->batch->quantity,
                'expiry_date' => $stock->batch->expiry_date,
                'days_until_expiry' => $stock->batch->expiry_date->diffInDays(now()),
                'stock_value' => $stock->batch->quantity * ($stock->product->cost_price ?? 0),
            ];
        })->values();
    }

    /**
     * Get overstock items
     */
    private function getOverstockItems($stockData)
    {
        return $stockData->filter(function ($stock) {
            $maxLevel = $stock->product->alert_quantity * 3; // 3x alert threshold
            return $stock->available_quantity > $maxLevel;
        })->map(function ($stock) {
            return [
                'product_id' => $stock->product_id,
                'product_name' => $stock->product->name,
                'current_stock' => $stock->available_quantity,
                'optimal_level' => $stock->product->alert_quantity * 3,
                'excess_quantity' => $stock->available_quantity - ($stock->product->alert_quantity * 3),
                'excess_value' => ($stock->available_quantity - ($stock->product->alert_quantity * 3)) * ($stock->product->cost_price ?? 0),
            ];
        })->values();
    }

    /**
     * Get top value items
     */
    private function getTopValueItems($stockData)
    {
        return $stockData->sortByDesc(function ($stock) {
            return $stock->available_quantity * ($stock->product->cost_price ?? 0);
        })->take(10)->map(function ($stock) {
            return [
                'product_id' => $stock->product_id,
                'product_name' => $stock->product->name,
                'current_stock' => $stock->available_quantity,
                'unit_cost' => $stock->product->cost_price ?? 0,
                'total_value' => $stock->available_quantity * ($stock->product->cost_price ?? 0),
            ];
        })->values();
    }

    /**
     * Get dead stock items
     */
    private function getDeadStockItems($stockData)
    {
        return $stockData->filter(function ($stock) {
            // Consider dead stock if no movement in 90 days
            $lastMovement = $stock->transactions()
                ->where('transaction_type', '!=', 'adjustment')
                ->orderBy('created_at', 'desc')
                ->first();

            return !$lastMovement || 
                   $lastMovement->created_at->diffInDays(now()) > 90;
        })->map(function ($stock) {
            return [
                'product_id' => $stock->product_id,
                'product_name' => $stock->product->name,
                'current_stock' => $stock->available_quantity,
                'days_since_last_movement' => $stock->transactions()
                    ->where('transaction_type', '!=', 'adjustment')
                    ->orderBy('created_at', 'desc')
                    ->first()
                    ? $stock->transactions()
                        ->where('transaction_type', '!=', 'adjustment')
                        ->orderBy('created_at', 'desc')
                        ->first()
                        ->created_at->diffInDays(now()) : 999,
                'stock_value' => $stock->available_quantity * ($stock->product->cost_price ?? 0),
            ];
        })->values();
    }

    /**
     * Get waste data (simulated)
     */
    private function getWasteData(int $storeId, string $startDate, string $endDate)
    {
        // This would query actual waste tracking records
        // For now, simulate waste data based on transactions
        return collect([
            [
                'product_id' => 1,
                'product_name' => 'Sample Product 1',
                'waste_quantity' => 5.5,
                'waste_value' => 27.50,
                'waste_reason' => 'Spoilage',
                'waste_date' => now()->subDays(10)->format('Y-m-d'),
            ],
            [
                'product_id' => 2,
                'product_name' => 'Sample Product 2',
                'waste_quantity' => 2.0,
                'waste_value' => 15.00,
                'waste_reason' => 'Preparation waste',
                'waste_date' => now()->subDays(5)->format('Y-m-d'),
            ],
        ]);
    }

    /**
     * Calculate waste percentage
     */
    private function calculateWastePercentage(int $storeId, string $startDate, string $endDate): float
    {
        // This would calculate based on actual waste tracking
        // For now, return simulated percentage
        return 2.5; // 2.5% waste rate
    }

    /**
     * Calculate turnover ratio
     */
    private function calculateTurnoverRatio($stock, string $startDate, string $endDate): float
    {
        // Simplified turnover calculation
        $totalSales = $this->calculateCostOfGoodsSold($stock, $startDate, $endDate);
        $averageStock = $stock->quantity / 2;
        
        return $averageStock > 0 ? $totalSales / $averageStock : 0;
    }

    /**
     * Calculate days of supply
     */
    private function calculateDaysOfSupply($stock): float
    {
        $dailyUsage = $this->calculateDailyUsage($stock);
        return $dailyUsage > 0 ? $stock->available_quantity / $dailyUsage : 999;
    }

    /**
     * Classify turnover
     */
    private function classifyTurnover(float $ratio): string
    {
        if ($ratio >= 12) {
            return 'fast';
        } elseif ($ratio >= 6) {
            return 'normal';
        } elseif ($ratio >= 3) {
            return 'slow';
        } else {
            return 'dead';
        }
    }

    /**
     * Calculate cost of goods sold
     */
    private function calculateCostOfGoodsSold($stock, string $startDate, string $endDate): float
    {
        // This would calculate based on actual sales data
        // For now, return simulated value
        return $stock->quantity * 0.8; // 80% of stock sold
    }

    /**
     * Calculate daily usage
     */
    private function calculateDailyUsage($stock): float
    {
        // This would calculate based on historical data
        // For now, return simulated value
        return $stock->quantity * 0.05; // 5% daily usage
    }

    /**
     * Calculate days out of stock
     */
    private function calculateDaysOutOfStock($stock): int
    {
        // Simplified calculation
        return 30; // Assume 30 days out of stock
    }

    /**
     * Analyze usage trends
     */
    private function analyzeUsageTrends($usageData): array
    {
        // This would analyze patterns in usage data
        // For now, return empty trends
        return [
            'increasing_trend' => [],
            'decreasing_trend' => [],
            'seasonal_patterns' => [],
        ];
    }

    /**
     * Get variance data
     */
    private function getVarianceData(int $storeId, string $startDate, string $endDate)
    {
        // This would query actual variance records
        // For now, return simulated variance data
        return collect([
            [
                'product_id' => 1,
                'product_name' => 'Sample Product 1',
                'variance_amount' => 2.5,
                'variance_percentage' => 5.2,
                'variance_reason' => 'Counting error',
                'variance_date' => now()->subDays(15)->format('Y-m-d'),
            ],
            [
                'product_id' => 2,
                'product_name' => 'Sample Product 2',
                'variance_amount' => -1.0,
                'variance_percentage' => -2.1,
                'variance_reason' => 'Theft',
                'variance_date' => now()->subDays(8)->format('Y-m-d'),
            ],
        ]);
    }
}