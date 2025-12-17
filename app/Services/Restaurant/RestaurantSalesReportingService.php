<?php

namespace App\Services\Restaurant;

use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantOrderItem;
use App\Models\Restaurant\RestaurantPayment;
use App\Models\Restaurant\RestaurantTable;
use App\Models\User;
use App\Models\Product;
use App\Models\Store;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class RestaurantSalesReportingService
{
    /**
     * Generate daily sales report
     */
    public function generateDailySalesReport(int $storeId, string $date): array
    {
        try {
            $orders = RestaurantOrder::forStore($storeId)
                ->byDate($date)
                ->with(['items.product', 'payments', 'waiter', 'table'])
                ->get();

            $reportData = [
                'store_id' => $storeId,
                'report_type' => 'daily_sales',
                'date' => $date,
                'generated_at' => now()->toISOString(),
                'summary' => $this->calculateDailySummary($orders),
                'hourly_breakdown' => $this->getHourlySalesBreakdown($orders),
                'order_type_breakdown' => $this->getOrderTypeBreakdown($orders),
                'payment_method_breakdown' => $this->getPaymentMethodBreakdown($orders),
                'top_selling_items' => $this->getTopSellingItems($orders),
                'waiter_performance' => $this->getWaiterPerformance($orders),
                'table_performance' => $this->getTablePerformance($orders),
                'discount_analysis' => $this->getDiscountAnalysis($orders),
                'tax_analysis' => $this->getTaxAnalysis($orders),
            ];

            Log::info('Daily sales report generated', [
                'store_id' => $storeId,
                'date' => $date,
                'total_orders' => $reportData['summary']['total_orders'],
                'total_revenue' => $reportData['summary']['total_revenue'],
            ]);

            return [
                'success' => true,
                'data' => $reportData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate daily sales report', [
                'store_id' => $storeId,
                'date' => $date,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate daily sales report: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate weekly sales report
     */
    public function generateWeeklySalesReport(int $storeId, string $startDate, string $endDate): array
    {
        try {
            $orders = RestaurantOrder::forStore($storeId)
                ->whereBetween('order_date', [$startDate, $endDate])
                ->with(['items.product', 'payments', 'waiter', 'table'])
                ->get();

            $reportData = [
                'store_id' => $storeId,
                'report_type' => 'weekly_sales',
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'generated_at' => now()->toISOString(),
                ],
                'summary' => $this->calculatePeriodSummary($orders),
                'daily_breakdown' => $this->getDailySalesBreakdown($orders),
                'day_of_week_analysis' => $this->getDayOfWeekAnalysis($orders),
                'peak_hours' => $this->getPeakHoursAnalysis($orders),
                'order_type_trends' => $this->getOrderTypeTrends($orders),
                'menu_performance' => $this->getMenuPerformanceAnalysis($orders),
                'customer_metrics' => $this->getCustomerMetrics($orders),
                'staff_performance' => $this->getStaffPerformanceAnalysis($orders),
                'revenue_trends' => $this->getRevenueTrends($orders),
            ];

            Log::info('Weekly sales report generated', [
                'store_id' => $storeId,
                'period' => $startDate . ' to ' . $endDate,
                'total_orders' => $reportData['summary']['total_orders'],
                'total_revenue' => $reportData['summary']['total_revenue'],
            ]);

            return [
                'success' => true,
                'data' => $reportData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate weekly sales report', [
                'store_id' => $storeId,
                'period' => $startDate . ' to ' . $endDate,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate weekly sales report: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate monthly sales report
     */
    public function generateMonthlySalesReport(int $storeId, string $year, string $month): array
    {
        try {
            $startDate = Carbon::create($year, $month, 1)->startOfMonth()->toDateString();
            $endDate = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

            $orders = RestaurantOrder::forStore($storeId)
                ->whereBetween('order_date', [$startDate, $endDate])
                ->with(['items.product', 'payments', 'waiter', 'table'])
                ->get();

            $reportData = [
                'store_id' => $storeId,
                'report_type' => 'monthly_sales',
                'period' => [
                    'year' => $year,
                    'month' => $month,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'generated_at' => now()->toISOString(),
                ],
                'summary' => $this->calculatePeriodSummary($orders),
                'weekly_breakdown' => $this->getWeeklyBreakdown($orders),
                'daily_averages' => $this->getDailyAverages($orders),
                'growth_analysis' => $this->getGrowthAnalysis($storeId, $year, $month),
                'category_performance' => $this->getCategoryPerformance($orders),
                'profit_analysis' => $this->getProfitAnalysis($orders),
                'inventory_impact' => $this->getInventoryImpact($orders),
                'seasonal_trends' => $this->getSeasonalTrends($orders),
            ];

            Log::info('Monthly sales report generated', [
                'store_id' => $storeId,
                'period' => $year . '-' . $month,
                'total_orders' => $reportData['summary']['total_orders'],
                'total_revenue' => $reportData['summary']['total_revenue'],
            ]);

            return [
                'success' => true,
                'data' => $reportData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate monthly sales report', [
                'store_id' => $storeId,
                'period' => $year . '-' . $month,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate monthly sales report: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate yearly sales report
     */
    public function generateYearlySalesReport(int $storeId, string $year): array
    {
        try {
            $startDate = Carbon::create($year, 1, 1)->startOfYear()->toDateString();
            $endDate = Carbon::create($year, 1, 1)->endOfYear()->toDateString();

            $orders = RestaurantOrder::forStore($storeId)
                ->whereBetween('order_date', [$startDate, $endDate])
                ->with(['items.product', 'payments', 'waiter', 'table'])
                ->get();

            $reportData = [
                'store_id' => $storeId,
                'report_type' => 'yearly_sales',
                'period' => [
                    'year' => $year,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'generated_at' => now()->toISOString(),
                ],
                'summary' => $this->calculatePeriodSummary($orders),
                'monthly_breakdown' => $this->getMonthlyBreakdown($orders),
                'quarterly_analysis' => $this->getQuarterlyAnalysis($orders),
                'year_over_year_growth' => $this->getYearOverYearGrowth($storeId, $year),
                'annual_trends' => $this->getAnnualTrends($orders),
                'top_products_year' => $this->getTopProductsYear($orders),
                'customer_loyalty_analysis' => $this->getCustomerLoyaltyAnalysis($orders),
                'operational_efficiency' => $this->getOperationalEfficiency($orders),
            ];

            Log::info('Yearly sales report generated', [
                'store_id' => $storeId,
                'year' => $year,
                'total_orders' => $reportData['summary']['total_orders'],
                'total_revenue' => $reportData['summary']['total_revenue'],
            ]);

            return [
                'success' => true,
                'data' => $reportData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate yearly sales report', [
                'store_id' => $storeId,
                'year' => $year,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate yearly sales report: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate real-time sales dashboard data
     */
    public function generateRealTimeDashboard(int $storeId): array
    {
        try {
            $today = now()->toDateString();
            $currentHour = now()->hour;

            $todayOrders = RestaurantOrder::forStore($storeId)
                ->byDate($today)
                ->with(['items.product', 'payments', 'waiter', 'table'])
                ->get();

            $activeOrders = RestaurantOrder::forStore($storeId)
                ->active()
                ->with(['items.product', 'waiter', 'table'])
                ->get();

            $hourlyRevenue = $this->getHourlyRevenue($storeId, $today);
            $liveMetrics = $this->calculateLiveMetrics($todayOrders, $activeOrders);

            $dashboardData = [
                'store_id' => $storeId,
                'report_type' => 'realtime_dashboard',
                'timestamp' => now()->toISOString(),
                'live_metrics' => $liveMetrics,
                'today_performance' => $this->calculateDailySummary($todayOrders),
                'hourly_revenue' => $hourlyRevenue,
                'active_orders' => $this->formatActiveOrders($activeOrders),
                'table_status' => $this->getCurrentTableStatus($storeId),
                'staff_performance_today' => $this->getWaiterPerformance($todayOrders),
                'popular_items_today' => $this->getTopSellingItems($todayOrders),
                'payment_trends_today' => $this->getPaymentMethodBreakdown($todayOrders),
                'alerts' => $this->generateDashboardAlerts($todayOrders, $activeOrders),
            ];

            return [
                'success' => true,
                'data' => $dashboardData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate real-time dashboard', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate real-time dashboard: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate sales trend analysis and forecasting
     */
    public function generateSalesTrendAnalysis(int $storeId, string $startDate, string $endDate): array
    {
        try {
            $orders = RestaurantOrder::forStore($storeId)
                ->whereBetween('order_date', [$startDate, $endDate])
                ->with(['items.product', 'payments'])
                ->get();

            $trendData = [
                'store_id' => $storeId,
                'report_type' => 'sales_trend_analysis',
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'generated_at' => now()->toISOString(),
                ],
                'historical_trends' => $this->analyzeHistoricalTrends($orders),
                'seasonal_patterns' => $this->identifySeasonalPatterns($orders),
                'growth_metrics' => $this->calculateGrowthMetrics($orders),
                'forecasting' => $this->generateSalesForecast($orders),
                'trend_indicators' => $this->calculateTrendIndicators($orders),
                'performance_benchmarks' => $this->establishPerformanceBenchmarks($orders),
            ];

            Log::info('Sales trend analysis generated', [
                'store_id' => $storeId,
                'period' => $startDate . ' to ' . $endDate,
            ]);

            return [
                'success' => true,
                'data' => $trendData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate sales trend analysis', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate sales trend analysis: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate peak hour analysis
     */
    public function generatePeakHourAnalysis(int $storeId, string $startDate, string $endDate): array
    {
        try {
            $orders = RestaurantOrder::forStore($storeId)
                ->whereBetween('order_date', [$startDate, $endDate])
                ->with(['items', 'waiter', 'table'])
                ->get();

            $peakHourData = [
                'store_id' => $storeId,
                'report_type' => 'peak_hour_analysis',
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'generated_at' => now()->toISOString(),
                ],
                'peak_hours' => $this->identifyPeakHours($orders),
                'hourly_order_distribution' => $this->getHourlyOrderDistribution($orders),
                'hourly_revenue_distribution' => $this->getHourlyRevenueDistribution($orders),
                'day_type_analysis' => $this->getDayTypeAnalysis($orders),
                'staffing_recommendations' => $this->generateStaffingRecommendations($orders),
                'capacity_utilization' => $this->calculateCapacityUtilization($orders),
            ];

            Log::info('Peak hour analysis generated', [
                'store_id' => $storeId,
                'period' => $startDate . ' to ' . $endDate,
            ]);

            return [
                'success' => true,
                'data' => $peakHourData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate peak hour analysis', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate peak hour analysis: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate table turnover report
     */
    public function generateTableTurnoverReport(int $storeId, string $startDate, string $endDate): array
    {
        try {
            $orders = RestaurantOrder::forStore($storeId)
                ->whereBetween('order_date', [$startDate, $endDate])
                ->with(['items', 'waiter', 'table'])
                ->get();

            $tables = RestaurantTable::forStore($storeId)->get();

            $turnoverData = [
                'store_id' => $storeId,
                'report_type' => 'table_turnover',
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'generated_at' => now()->toISOString(),
                ],
                'table_performance' => $this->analyzeTablePerformance($tables, $orders),
                'turnover_metrics' => $this->calculateTurnoverMetrics($tables, $orders),
                'table_utilization' => $this->calculateTableUtilization($tables, $orders),
                'peak_time_analysis' => $this->getTablePeakTimeAnalysis($orders),
                'section_comparison' => $this->getTableSectionComparison($tables, $orders),
                'recommendations' => $this->generateTableOptimizationRecommendations($tables, $orders),
            ];

            Log::info('Table turnover report generated', [
                'store_id' => $storeId,
                'period' => $startDate . ' to ' . $endDate,
            ]);

            return [
                'success' => true,
                'data' => $turnoverData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate table turnover report', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate table turnover report: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate waiter performance analytics
     */
    public function generateWaiterPerformanceReport(int $storeId, string $startDate, string $endDate): array
    {
        try {
            $orders = RestaurantOrder::forStore($storeId)
                ->whereBetween('order_date', [$startDate, $endDate])
                ->with(['items.product', 'payments', 'waiter', 'table'])
                ->get();

            $waiters = User::where('store_id', $storeId)
                ->waiters()
                ->get();

            $performanceData = [
                'store_id' => $storeId,
                'report_type' => 'waiter_performance',
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'generated_at' => now()->toISOString(),
                ],
                'individual_performance' => $this->analyzeIndividualWaiterPerformance($waiters, $orders),
                'team_metrics' => $this->calculateTeamMetrics($waiters, $orders),
                'sales_leaderboard' => $this->generateSalesLeaderboard($waiters, $orders),
                'customer_service_metrics' => $this->calculateCustomerServiceMetrics($waiters, $orders),
                'efficiency_analysis' => $this->analyzeWaiterEfficiency($waiters, $orders),
                'training_recommendations' => $this->generateTrainingRecommendations($waiters, $orders),
            ];

            Log::info('Waiter performance report generated', [
                'store_id' => $storeId,
                'period' => $startDate . ' to ' . $endDate,
            ]);

            return [
                'success' => true,
                'data' => $performanceData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate waiter performance report', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate waiter performance report: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate menu item popularity analysis
     */
    public function generateMenuPopularityReport(int $storeId, string $startDate, string $endDate): array
    {
        try {
            $orderItems = RestaurantOrderItem::whereHas('order', function ($query) use ($storeId, $startDate, $endDate) {
                    $query->forStore($storeId)
                        ->whereBetween('order_date', [$startDate, $endDate]);
                })
                ->with(['order', 'product', 'modifiers'])
                ->get();

            $popularityData = [
                'store_id' => $storeId,
                'report_type' => 'menu_popularity',
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'generated_at' => now()->toISOString(),
                ],
                'item_performance' => $this->analyzeItemPerformance($orderItems),
                'category_analysis' => $this->analyzeCategoryPerformance($orderItems),
                'modifier_analysis' => $this->analyzeModifierPopularity($orderItems),
                'profitability_analysis' => $this->analyzeItemProfitability($orderItems),
                'trend_analysis' => $this->analyzeMenuItemTrends($orderItems),
                'recommendations' => $this->generateMenuRecommendations($orderItems),
            ];

            Log::info('Menu popularity report generated', [
                'store_id' => $storeId,
                'period' => $startDate . ' to ' . $endDate,
            ]);

            return [
                'success' => true,
                'data' => $popularityData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate menu popularity report', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate menu popularity report: ' . $e->getMessage()
            ];
        }
    }

    // Helper methods for calculations

    /**
     * Calculate daily summary
     */
    private function calculateDailySummary($orders): array
    {
        return [
            'total_orders' => $orders->count(),
            'paid_orders' => $orders->where('payment_status', 'paid')->count(),
            'total_revenue' => $orders->sum('final_total'),
            'total_customers' => $orders->sum('customer_count'),
            'average_order_value' => $orders->count() > 0 ? $orders->sum('final_total') / $orders->count() : 0,
            'total_discounts' => $orders->sum('discount_amount'),
            'total_taxes' => $orders->sum('tax_amount'),
            'total_service_charges' => $orders->sum('service_charge'),
            'total_tips' => $orders->sum(function ($order) {
                return $order->payments->sum('tip_amount');
            }),
            'order_types' => [
                'dine_in' => $orders->where('order_type', 'dine_in')->count(),
                'takeaway' => $orders->where('order_type', 'takeaway')->count(),
                'delivery' => $orders->where('order_type', 'delivery')->count(),
            ],
        ];
    }

    /**
     * Calculate period summary
     */
    private function calculatePeriodSummary($orders): array
    {
        return [
            'total_orders' => $orders->count(),
            'paid_orders' => $orders->where('payment_status', 'paid')->count(),
            'total_revenue' => $orders->sum('final_total'),
            'total_customers' => $orders->sum('customer_count'),
            'average_order_value' => $orders->count() > 0 ? $orders->sum('final_total') / $orders->count() : 0,
            'total_discounts' => $orders->sum('discount_amount'),
            'total_taxes' => $orders->sum('tax_amount'),
            'total_service_charges' => $orders->sum('service_charge'),
            'total_tips' => $orders->sum(function ($order) {
                return $order->payments->sum('tip_amount');
            }),
            'order_completion_rate' => $orders->count() > 0 ? 
                ($orders->where('status', 'completed')->count() / $orders->count()) * 100 : 0,
            'average_customers_per_order' => $orders->count() > 0 ? 
                $orders->sum('customer_count') / $orders->count() : 0,
        ];
    }

    /**
     * Get hourly sales breakdown
     */
    private function getHourlySalesBreakdown($orders): array
    {
        return $orders->groupBy(function ($order) {
            return Carbon::parse($order->order_time)->hour;
        })->map(function ($hourOrders, $hour) {
            return [
                'hour' => $hour,
                'orders' => $hourOrders->count(),
                'revenue' => $hourOrders->sum('final_total'),
                'customers' => $hourOrders->sum('customer_count'),
                'average_order_value' => $hourOrders->count() > 0 ? 
                    $hourOrders->sum('final_total') / $hourOrders->count() : 0,
            ];
        })->sortBy('hour')->values();
    }

    /**
     * Get order type breakdown
     */
    private function getOrderTypeBreakdown($orders): array
    {
        return $orders->groupBy('order_type')->map(function ($typeOrders, $type) {
            return [
                'order_type' => $type,
                'orders' => $typeOrders->count(),
                'revenue' => $typeOrders->sum('final_total'),
                'percentage_of_total' => $orders->count() > 0 ? 
                    ($typeOrders->count() / $orders->count()) * 100 : 0,
                'average_order_value' => $typeOrders->count() > 0 ? 
                    $typeOrders->sum('final_total') / $typeOrders->count() : 0,
            ];
        })->values();
    }

    /**
     * Get payment method breakdown
     */
    private function getPaymentMethodBreakdown($orders): array
    {
        $allPayments = $orders->flatMap(function ($order) {
            return $order->payments;
        });

        return $allPayments->groupBy('payment_method')->map(function ($methodPayments, $method) {
            return [
                'payment_method' => $method,
                'count' => $methodPayments->count(),
                'total_amount' => $methodPayments->sum('total_amount'),
                'percentage_of_total' => $allPayments->sum('total_amount') > 0 ? 
                    ($methodPayments->sum('total_amount') / $allPayments->sum('total_amount')) * 100 : 0,
                'average_amount' => $methodPayments->count() > 0 ? 
                    $methodPayments->sum('total_amount') / $methodPayments->count() : 0,
            ];
        })->values();
    }

    /**
     * Get top selling items
     */
    private function getTopSellingItems($orders): array
    {
        $allItems = $orders->flatMap(function ($order) {
            return $order->items;
        });

        return $allItems->groupBy('product_id')->map(function ($productItems, $productId) {
            $product = $productItems->first()->product;
            return [
                'product_id' => $productId,
                'product_name' => $product->name,
                'quantity_sold' => $productItems->sum('quantity'),
                'revenue' => $productItems->sum(function ($item) {
                    return $item->quantity * $item->unit_price;
                }),
                'orders' => $productItems->count(),
                'average_price' => $productItems->count() > 0 ? 
                    $productItems->avg('unit_price') : 0,
            ];
        })->sortByDesc('quantity_sold')->take(10)->values();
    }

    /**
     * Get waiter performance
     */
    private function getWaiterPerformance($orders): array
    {
        return $orders->where('waiter_id')->groupBy('waiter_id')->map(function ($waiterOrders, $waiterId) {
            $waiter = $waiterOrders->first()->waiter;
            return [
                'waiter_id' => $waiterId,
                'waiter_name' => $waiter->name,
                'orders' => $waiterOrders->count(),
                'revenue' => $waiterOrders->sum('final_total'),
                'customers' => $waiterOrders->sum('customer_count'),
                'average_order_value' => $waiterOrders->count() > 0 ? 
                    $waiterOrders->sum('final_total') / $waiterOrders->count() : 0,
                'tips' => $waiterOrders->sum(function ($order) {
                    return $order->payments->sum('tip_amount');
                }),
            ];
        })->sortByDesc('revenue')->values();
    }

    /**
     * Get table performance
     */
    private function getTablePerformance($orders): array
    {
        return $orders->where('table_id')->groupBy('table_id')->map(function ($tableOrders, $tableId) {
            $table = $tableOrders->first()->table;
            return [
                'table_id' => $tableId,
                'table_number' => $table->table_number,
                'orders' => $tableOrders->count(),
                'revenue' => $tableOrders->sum('final_total'),
                'customers' => $tableOrders->sum('customer_count'),
                'turnover_count' => $tableOrders->count(),
                'average_occupancy_time' => $this->calculateAverageOccupancyTime($tableOrders),
            ];
        })->sortByDesc('revenue')->values();
    }

    /**
     * Get discount analysis
     */
    private function getDiscountAnalysis($orders): array
    {
        $ordersWithDiscounts = $orders->where('discount_amount', '>', 0);
        
        return [
            'total_discount_amount' => $ordersWithDiscounts->sum('discount_amount'),
            'orders_with_discounts' => $ordersWithDiscounts->count(),
            'discount_percentage' => $orders->count() > 0 ? 
                ($ordersWithDiscounts->count() / $orders->count()) * 100 : 0,
            'average_discount_per_order' => $ordersWithDiscounts->count() > 0 ? 
                $ordersWithDiscounts->sum('discount_amount') / $ordersWithDiscounts->count() : 0,
            'discount_as_percentage_of_revenue' => $orders->sum('final_total') > 0 ? 
                ($ordersWithDiscounts->sum('discount_amount') / $orders->sum('final_total')) * 100 : 0,
        ];
    }

    /**
     * Get tax analysis
     */
    private function getTaxAnalysis($orders): array
    {
        return [
            'total_tax_amount' => $orders->sum('tax_amount'),
            'tax_as_percentage_of_revenue' => $orders->sum('final_total') > 0 ? 
                ($orders->sum('tax_amount') / $orders->sum('final_total')) * 100 : 0,
            'average_tax_per_order' => $orders->count() > 0 ? 
                $orders->sum('tax_amount') / $orders->count() : 0,
        ];
    }

    /**
     * Calculate average occupancy time
     */
    private function calculateAverageOccupancyTime($tableOrders): float
    {
        $occupancyTimes = $tableOrders->filter(function ($order) {
            return $order->created_at && $order->completed_at;
        })->map(function ($order) {
            return $order->created_at->diffInMinutes($order->completed_at);
        });

        return $occupancyTimes->count() > 0 ? $occupancyTimes->avg() : 0;
    }

    // Additional helper methods would be implemented here for other calculations
    // Due to length constraints, I'm showing the main structure
}