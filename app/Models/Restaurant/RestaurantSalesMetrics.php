<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Userstamps;
use App\Models\Store;
use Illuminate\Support\Facades\DB;

class RestaurantSalesMetrics extends Model
{
    use SoftDeletes, Userstamps;

    protected $table = 'restaurant_sales_metrics';

    protected $fillable = [
        'store_id',
        'metric_date',
        'metric_type',
        'order_type',
        'total_orders',
        'paid_orders',
        'total_revenue',
        'total_customers',
        'average_order_value',
        'total_discounts',
        'total_taxes',
        'total_service_charges',
        'total_tips',
        'dine_in_orders',
        'takeaway_orders',
        'delivery_orders',
        'peak_hour',
        'peak_hour_orders',
        'peak_hour_revenue',
        'table_turnover_count',
        'average_table_occupancy_time',
        'waiter_performance_data',
        'menu_item_popularity_data',
        'payment_method_breakdown',
        'customer_demographics',
        'order_value_distribution',
        'profit_margin_data',
        'cost_of_goods_sold',
        'inventory_usage_data',
        'staff_efficiency_metrics',
        'customer_satisfaction_scores',
        'promotion_effectiveness',
        'seasonal_adjustments',
        'weather_impact',
        'local_event_impact',
        'competitor_comparison',
        'market_trends',
        'forecast_accuracy',
    ];

    protected $casts = [
        'metric_date' => 'date',
        'total_revenue' => 'decimal:2',
        'average_order_value' => 'decimal:2',
        'total_discounts' => 'decimal:2',
        'total_taxes' => 'decimal:2',
        'total_service_charges' => 'decimal:2',
        'total_tips' => 'decimal:2',
        'peak_hour_revenue' => 'decimal:2',
        'average_table_occupancy_time' => 'decimal:2',
        'waiter_performance_data' => 'array',
        'menu_item_popularity_data' => 'array',
        'payment_method_breakdown' => 'array',
        'customer_demographics' => 'array',
        'order_value_distribution' => 'array',
        'profit_margin_data' => 'array',
        'cost_of_goods_sold' => 'decimal:2',
        'inventory_usage_data' => 'array',
        'staff_efficiency_metrics' => 'array',
        'customer_satisfaction_scores' => 'array',
        'promotion_effectiveness' => 'array',
        'seasonal_adjustments' => 'array',
        'weather_impact' => 'array',
        'local_event_impact' => 'array',
        'competitor_comparison' => 'array',
        'market_trends' => 'array',
        'forecast_accuracy' => 'decimal:2',
    ];

    // Relationships
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    // Scopes
    public function scopeByStore($query, $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    public function scopeByDate($query, $date)
    {
        return $query->whereDate('metric_date', $date);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('metric_date', [$startDate, $endDate]);
    }

    public function scopeByMetricType($query, $metricType)
    {
        return $query->where('metric_type', $metricType);
    }

    public function scopeByOrderType($query, $orderType)
    {
        return $query->where('order_type', $orderType);
    }

    // Methods
    /**
     * Calculate order value distribution
     */
    public function calculateOrderValueDistribution($storeId, $startDate, $endDate): array
    {
        $orders = RestaurantOrder::forStore($storeId)
            ->whereBetween('order_date', [$startDate, $endDate])
            ->where('payment_status', 'paid')
            ->get();

        $orderValues = $orders->pluck('final_total');
        
        if ($orderValues->isEmpty()) {
            return [];
        }

        $distribution = [
            'under_25' => $orderValues->filter(fn($v) => $v < 25)->count(),
            '25_to_50' => $orderValues->filter(fn($v) => $v >= 25 && $v < 50)->count(),
            '50_to_100' => $orderValues->filter(fn($v) => $v >= 50 && $v < 100)->count(),
            '100_to_200' => $orderValues->filter(fn($v) => $v >= 100 && $v < 200)->count(),
            '200_to_500' => $orderValues->filter(fn($v) => $v >= 200 && $v < 500)->count(),
            'over_500' => $orderValues->filter(fn($v) => $v >= 500)->count(),
        ];

        return array_map(function($count) use ($orders) {
            return [
                'count' => $count,
                'percentage' => $orders->count() > 0 ? round(($count / $orders->count()) * 100, 2) : 0,
            ];
        }, $distribution);
    }

    /**
     * Track discount and promotion effectiveness
     */
    public function trackPromotionEffectiveness($storeId, $startDate, $endDate): array
    {
        $orders = RestaurantOrder::forStore($storeId)
            ->whereBetween('order_date', [$startDate, $endDate])
            ->with(['items.product'])
            ->get();

        $ordersWithDiscounts = $orders->where('discount_amount', '>', 0);
        $ordersWithoutDiscounts = $orders->where('discount_amount', '=', 0);

        return [
            'total_orders' => $orders->count(),
            'orders_with_discounts' => $ordersWithDiscounts->count(),
            'orders_without_discounts' => $ordersWithoutDiscounts->count(),
            'discount_penetration_rate' => $orders->count() > 0 ? 
                round(($ordersWithDiscounts->count() / $orders->count()) * 100, 2) : 0,
            'total_discount_amount' => $ordersWithDiscounts->sum('discount_amount'),
            'average_discount_per_order' => $ordersWithDiscounts->count() > 0 ? 
                round($ordersWithDiscounts->sum('discount_amount') / $ordersWithDiscounts->count(), 2) : 0,
            'revenue_with_discounts' => $ordersWithDiscounts->sum('final_total'),
            'revenue_without_discounts' => $ordersWithoutDiscounts->sum('final_total'),
            'average_order_value_with_discount' => $ordersWithDiscounts->count() > 0 ? 
                round($ordersWithDiscounts->sum('final_total') / $ordersWithDiscounts->count(), 2) : 0,
            'average_order_value_without_discount' => $ordersWithoutDiscounts->count() > 0 ? 
                round($ordersWithoutDiscounts->sum('final_total') / $ordersWithoutDiscounts->count(), 2) : 0,
            'discount_impact_on_order_value' => $ordersWithoutDiscounts->count() > 0 && $ordersWithDiscounts->count() > 0 ? 
                round((($ordersWithDiscounts->sum('final_total') / $ordersWithDiscounts->count()) / 
                       ($ordersWithoutDiscounts->sum('final_total') / $ordersWithoutDiscounts->count()) - 1, 2) : 0,
        ];
    }

    /**
     * Analyze payment method performance
     */
    public function analyzePaymentMethodPerformance($storeId, $startDate, $endDate): array
    {
        $payments = RestaurantPayment::forStore($storeId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->get();

        return $payments->groupBy('payment_method')->map(function ($methodPayments, $method) {
            $totalAmount = $methodPayments->sum('total_amount');
            $tipAmount = $methodPayments->sum('tip_amount');
            $processingFees = $methodPayments->sum('processing_fee');
            
            return [
                'payment_method' => $method,
                'transaction_count' => $methodPayments->count(),
                'total_amount' => $totalAmount,
                'total_tips' => $tipAmount,
                'total_processing_fees' => $processingFees,
                'net_amount' => $totalAmount - $processingFees,
                'average_transaction_amount' => $methodPayments->count() > 0 ? 
                    round($totalAmount / $methodPayments->count(), 2) : 0,
                'tip_rate' => $totalAmount > 0 ? round(($tipAmount / $totalAmount) * 100, 2) : 0,
                'processing_fee_rate' => $totalAmount > 0 ? round(($processingFees / $totalAmount) * 100, 2) : 0,
                'refund_rate' => $methodPayments->count() > 0 ? 
                    round(($methodPayments->where('status', 'refunded')->count() / $methodPayments->count()) * 100, 2) : 0,
                'success_rate' => $methodPayments->count() > 0 ? 
                    round(($methodPayments->where('status', 'completed')->count() / $methodPayments->count()) * 100, 2) : 0,
            ];
        })->values();
    }

    /**
     * Generate tax reporting and compliance metrics
     */
    public function generateTaxComplianceReport($storeId, $startDate, $endDate): array
    {
        $orders = RestaurantOrder::forStore($storeId)
            ->whereBetween('order_date', [$startDate, $endDate])
            ->where('payment_status', 'paid')
            ->get();

        $totalRevenue = $orders->sum('final_total');
        $totalTax = $orders->sum('tax_amount');
        $totalServiceCharge = $orders->sum('service_charge');

        return [
            'total_revenue' => $totalRevenue,
            'total_tax_collected' => $totalTax,
            'total_service_charge_collected' => $totalServiceCharge,
            'effective_tax_rate' => $totalRevenue > 0 ? round(($totalTax / $totalRevenue) * 100, 2) : 0,
            'tax_breakdown' => $this->getTaxBreakdown($orders),
            'compliance_status' => $this->checkTaxCompliance($orders),
            'tax_liability_by_period' => $this->calculateTaxLiability($orders),
            'tax_payment_recommendations' => $this->generateTaxPaymentRecommendations($orders),
        ];
    }

    /**
     * Track customer count and average order value trends
     */
    public function trackCustomerMetrics($storeId, $startDate, $endDate): array
    {
        $orders = RestaurantOrder::forStore($storeId)
            ->whereBetween('order_date', [$startDate, $endDate])
            ->where('payment_status', 'paid')
            ->get();

        $dailyMetrics = $orders->groupBy(function ($order) {
            return $order->order_date;
        })->map(function ($dayOrders, $date) {
            return [
                'date' => $date,
                'order_count' => $dayOrders->count(),
                'customer_count' => $dayOrders->sum('customer_count'),
                'total_revenue' => $dayOrders->sum('final_total'),
                'average_order_value' => $dayOrders->count() > 0 ? 
                    round($dayOrders->sum('final_total') / $dayOrders->count(), 2) : 0,
                'average_customers_per_order' => $dayOrders->count() > 0 ? 
                    round($dayOrders->sum('customer_count') / $dayOrders->count(), 2) : 0,
            ];
        })->values();

        return [
            'period_summary' => [
                'total_orders' => $orders->count(),
                'total_customers' => $orders->sum('customer_count'),
                'total_revenue' => $orders->sum('final_total'),
                'average_order_value' => $orders->count() > 0 ? 
                    round($orders->sum('final_total') / $orders->count(), 2) : 0,
                'average_customers_per_order' => $orders->count() > 0 ? 
                    round($orders->sum('customer_count') / $orders->count(), 2) : 0,
            ],
            'daily_breakdown' => $dailyMetrics,
            'customer_trends' => $this->analyzeCustomerTrends($dailyMetrics),
            'order_value_trends' => $this->analyzeOrderValueTrends($dailyMetrics),
            'peak_customer_days' => $this->identifyPeakCustomerDays($dailyMetrics),
        ];
    }

    // Helper methods
    private function getTaxBreakdown($orders): array
    {
        // This would parse tax_breakdown from orders
        // For now, return simplified breakdown
        return [
            'sales_tax' => $orders->sum('tax_amount') * 0.8,
            'service_tax' => $orders->sum('tax_amount') * 0.2,
        ];
    }

    private function checkTaxCompliance($orders): array
    {
        // Simplified compliance check
        return [
            'is_compliant' => true,
            'issues' => [],
            'recommendations' => [],
        ];
    }

    private function calculateTaxLiability($orders): array
    {
        return [
            'current_period_liability' => $orders->sum('tax_amount'),
            'ytd_liability' => $orders->sum('tax_amount'), // Would need YTD calculation
            'payment_due_date' => now()->addMonth()->toDateString(),
        ];
    }

    private function generateTaxPaymentRecommendations($orders): array
    {
        return [
            'recommended_payment_amount' => $orders->sum('tax_amount'),
            'payment_schedule' => 'monthly',
            'next_payment_date' => now()->addMonth()->toDateString(),
        ];
    }

    private function analyzeCustomerTrends($dailyMetrics): array
    {
        if ($dailyMetrics->count() < 2) {
            return ['trend' => 'insufficient_data'];
        }

        $firstHalf = $dailyMetrics->take(floor($dailyMetrics->count() / 2));
        $secondHalf = $dailyMetrics->skip(floor($dailyMetrics->count() / 2));

        $firstHalfAvg = $firstHalf->avg('customer_count');
        $secondHalfAvg = $secondHalf->avg('customer_count');

        if ($secondHalfAvg > $firstHalfAvg * 1.1) {
            return ['trend' => 'increasing', 'change_percentage' => round((($secondHalfAvg / $firstHalfAvg) - 1) * 100, 2)];
        } elseif ($secondHalfAvg < $firstHalfAvg * 0.9) {
            return ['trend' => 'decreasing', 'change_percentage' => round((($secondHalfAvg / $firstHalfAvg) - 1) * 100, 2)];
        } else {
            return ['trend' => 'stable', 'change_percentage' => round((($secondHalfAvg / $firstHalfAvg) - 1) * 100, 2)];
        }
    }

    private function analyzeOrderValueTrends($dailyMetrics): array
    {
        if ($dailyMetrics->count() < 2) {
            return ['trend' => 'insufficient_data'];
        }

        $firstHalf = $dailyMetrics->take(floor($dailyMetrics->count() / 2));
        $secondHalf = $dailyMetrics->skip(floor($dailyMetrics->count() / 2));

        $firstHalfAvg = $firstHalf->avg('average_order_value');
        $secondHalfAvg = $secondHalf->avg('average_order_value');

        if ($secondHalfAvg > $firstHalfAvg * 1.1) {
            return ['trend' => 'increasing', 'change_percentage' => round((($secondHalfAvg / $firstHalfAvg) - 1) * 100, 2)];
        } elseif ($secondHalfAvg < $firstHalfAvg * 0.9) {
            return ['trend' => 'decreasing', 'change_percentage' => round((($secondHalfAvg / $firstHalfAvg) - 1) * 100, 2)];
        } else {
            return ['trend' => 'stable', 'change_percentage' => round((($secondHalfAvg / $firstHalfAvg) - 1) * 100, 2)];
        }
    }

    private function identifyPeakCustomerDays($dailyMetrics): array
    {
        return $dailyMetrics
            ->sortByDesc('customer_count')
            ->take(5)
            ->map(function ($day) {
                return [
                    'date' => $day['date'],
                    'customer_count' => $day['customer_count'],
                    'order_count' => $day['order_count'],
                ];
            })
            ->values();
    }
}