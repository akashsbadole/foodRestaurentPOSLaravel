<?php

namespace App\Services\Restaurant;

use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantOrderItem;
use App\Models\Restaurant\RestaurantPayment;
use App\Models\Restaurant\RestaurantTable;
use App\Models\User;
use App\Models\Store;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;
use Carbon\Carbon;

class RestaurantRealTimeReportingService
{
    protected $storeId;
    protected $activeConnections = [];
    protected $reportSubscribers = [];

    public function __construct(int $storeId = null)
    {
        $this->storeId = $storeId;
    }

    /**
     * Initialize real-time reporting for a store
     */
    public function initializeRealTimeReporting(int $storeId): array
    {
        try {
            $this->storeId = $storeId;
            
            // Clear previous connections for this store
            $this->clearStoreConnections($storeId);
            
            // Initialize metrics cache
            $this->initializeMetricsCache($storeId);
            
            // Start real-time monitoring
            $this->startRealTimeMonitoring($storeId);
            
            return [
                'success' => true,
                'message' => 'Real-time reporting initialized',
                'store_id' => $storeId,
                'websocket_channel' => "restaurant_store_{$storeId}",
                'initial_metrics' => $this->getCurrentMetrics($storeId),
            ];
        } catch (\Exception $e) {
            Log::error('Failed to initialize real-time reporting', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to initialize real-time reporting: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get live sales updates
     */
    public function getLiveSalesUpdates(int $storeId): array
    {
        try {
            $today = now()->toDateString();
            $currentHour = now()->format('H:i');
            
            // Get today's orders with real-time data
            $todayOrders = RestaurantOrder::forStore($storeId)
                ->byDate($today)
                ->with(['items.product', 'payments', 'waiter', 'table'])
                ->get();

            $activeOrders = RestaurantOrder::forStore($storeId)
                ->active()
                ->with(['items.product', 'waiter', 'table'])
                ->get();

            $liveData = [
                'timestamp' => now()->toISOString(),
                'store_id' => $storeId,
                'current_metrics' => [
                    'today_orders' => $todayOrders->count(),
                    'active_orders' => $activeOrders->count(),
                    'today_revenue' => $todayOrders->sum('final_total'),
                    'current_hour_orders' => $todayOrders->filter(function ($order) {
                        return $order->order_time && Carbon::parse($order->order_time)->format('H') === now()->format('H');
                    })->count(),
                    'current_hour_revenue' => $todayOrders->filter(function ($order) {
                        return $order->order_time && Carbon::parse($order->order_time)->format('H') === now()->format('H');
                    })->sum('final_total'),
                    'average_order_value_today' => $todayOrders->count() > 0 ? 
                        $todayOrders->sum('final_total') / $todayOrders->count() : 0,
                    'payment_completion_rate' => $this->calculatePaymentCompletionRate($todayOrders),
                ],
                'hourly_breakdown' => $this->getLiveHourlyBreakdown($todayOrders),
                'active_orders_details' => $this->formatActiveOrders($activeOrders),
                'recent_orders' => $this->getRecentOrders($todayOrders, 5),
                'table_status' => $this->getCurrentTableStatus($storeId),
                'staff_performance_today' => $this->getLiveStaffPerformance($todayOrders),
                'alerts' => $this->generateRealTimeAlerts($todayOrders, $activeOrders),
            ];

            // Update cache
            Cache::put("live_metrics_{$storeId}", $liveData, 30); // 30 seconds cache

            // Broadcast to WebSocket subscribers
            $this->broadcastToSubscribers($storeId, 'sales_update', $liveData);

            return [
                'success' => true,
                'data' => $liveData,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get live sales updates', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to get live sales updates: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get real-time performance metrics
     */
    public function getRealTimePerformanceMetrics(int $storeId): array
    {
        try {
            $cacheKey = "performance_metrics_{$storeId}";
            $metrics = Cache::remember($cacheKey, 60, function () use ($storeId) {
                $today = now()->toDateString();
                
                $orders = RestaurantOrder::forStore($storeId)
                    ->whereBetween('order_date', [
                        now()->subDays(7)->toDateString(),
                        $today
                    ])
                    ->with(['items', 'payments', 'waiter', 'table'])
                    ->get();

                return [
                    'store_id' => $storeId,
                    'period' => 'last_7_days',
                    'generated_at' => now()->toISOString(),
                    'operational_metrics' => [
                        'average_order_fulfillment_time' => $this->calculateAverageFulfillmentTime($orders),
                        'table_turnover_rate' => $this->calculateTableTurnoverRate($storeId, $orders),
                        'staff_productivity' => $this->calculateStaffProductivity($orders),
                        'order_completion_rate' => $this->calculateOrderCompletionRate($orders),
                    ],
                    'financial_metrics' => [
                        'daily_average_revenue' => $this->calculateDailyAverageRevenue($orders),
                        'revenue_growth_rate' => $this->calculateRevenueGrowthRate($orders),
                        'average_order_value' => $orders->count() > 0 ? 
                            $orders->sum('final_total') / $orders->count() : 0,
                        'profit_margin_trend' => $this->calculateProfitMarginTrend($orders),
                    ],
                    'customer_metrics' => [
                        'customer_satisfaction_score' => $this->calculateCustomerSatisfactionScore($orders),
                        'repeat_customer_rate' => $this->calculateRepeatCustomerRate($orders),
                        'average_customers_per_hour' => $this->calculateAverageCustomersPerHour($orders),
                    ],
                    'inventory_metrics' => [
                        'popular_items_real_time' => $this->getRealTimePopularItems($orders),
                        'inventory_turnover_alerts' => $this->getInventoryTurnoverAlerts($storeId),
                    ],
                ];
            });

            return [
                'success' => true,
                'data' => $metrics,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get real-time performance metrics', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to get performance metrics: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Subscribe to real-time updates
     */
    public function subscribeToRealTimeUpdates(int $storeId, string $updateType, callable $callback): string
    {
        try {
            $subscriptionId = uniqid('sub_', true);
            
            $this->reportSubscribers[$subscriptionId] = [
                'store_id' => $storeId,
                'update_type' => $updateType,
                'callback' => $callback,
                'subscribed_at' => now(),
                'last_update' => null,
            ];

            Log::info('New real-time subscription', [
                'subscription_id' => $subscriptionId,
                'store_id' => $storeId,
                'update_type' => $updateType,
            ]);

            return $subscriptionId;
        } catch (\Exception $e) {
            Log::error('Failed to subscribe to real-time updates', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Unsubscribe from real-time updates
     */
    public function unsubscribeFromRealTimeUpdates(string $subscriptionId): bool
    {
        try {
            if (isset($this->reportSubscribers[$subscriptionId])) {
                unset($this->reportSubscribers[$subscriptionId]);
                
                Log::info('Real-time subscription removed', [
                    'subscription_id' => $subscriptionId,
                ]);
                
                return true;
            }
            
            return false;
        } catch (\Exception $e) {
            Log::error('Failed to unsubscribe from real-time updates', [
                'subscription_id' => $subscriptionId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Generate instant alerts for anomalies
     */
    public function generateInstantAlerts(int $storeId): array
    {
        try {
            $alerts = [];
            $today = now()->toDateString();
            
            // Check for various anomalies
            $orderAnomalies = $this->detectOrderAnomalies($storeId);
            $paymentAnomalies = $this->detectPaymentAnomalies($storeId);
            $performanceAnomalies = $this->detectPerformanceAnomalies($storeId);
            $inventoryAnomalies = $this->detectInventoryAnomalies($storeId);
            
            if (!empty($orderAnomalies)) {
                $alerts[] = [
                    'type' => 'order_anomaly',
                    'severity' => 'high',
                    'message' => 'Unusual order patterns detected',
                    'data' => $orderAnomalies,
                    'timestamp' => now()->toISOString(),
                ];
            }
            
            if (!empty($paymentAnomalies)) {
                $alerts[] = [
                    'type' => 'payment_anomaly',
                    'severity' => 'critical',
                    'message' => 'Payment processing issues detected',
                    'data' => $paymentAnomalies,
                    'timestamp' => now()->toISOString(),
                ];
            }
            
            if (!empty($performanceAnomalies)) {
                $alerts[] = [
                    'type' => 'performance_anomaly',
                    'severity' => 'medium',
                    'message' => 'Performance metrics below threshold',
                    'data' => $performanceAnomalies,
                    'timestamp' => now()->toISOString(),
                ];
            }
            
            if (!empty($inventoryAnomalies)) {
                $alerts[] = [
                    'type' => 'inventory_anomaly',
                    'severity' => 'medium',
                    'message' => 'Inventory level alerts',
                    'data' => $inventoryAnomalies,
                    'timestamp' => now()->toISOString(),
                ];
            }

            // Broadcast alerts to subscribers
            if (!empty($alerts)) {
                $this->broadcastToSubscribers($storeId, 'alert', [
                    'alerts' => $alerts,
                    'timestamp' => now()->toISOString(),
                ]);
            }

            return [
                'success' => true,
                'data' => $alerts,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate instant alerts', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate alerts: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Track table status in real-time
     */
    public function trackTableStatus(int $storeId): array
    {
        try {
            $tables = RestaurantTable::forStore($storeId)
                ->with(['currentOrder', 'reservations'])
                ->get();

            $tableStatus = $tables->map(function ($table) {
                $currentOrder = $table->currentOrder;
                $isReserved = $table->reservations()
                    ->where('reserved_until', '>', now())
                    ->exists();

                return [
                    'table_id' => $table->id,
                    'table_number' => $table->table_number,
                    'status' => $this->getRealTimeTableStatus($table),
                    'current_order_id' => $currentOrder ? $currentOrder->id : null,
                    'current_order_time' => $currentOrder ? $currentOrder->created_at : null,
                    'customers_seated' => $currentOrder ? $currentOrder->customer_count : 0,
                    'is_reserved' => $isReserved,
                    'reserved_until' => $isReserved ? $table->reservations()->where('reserved_until', '>', now())->min('reserved_until') : null,
                    'occupancy_duration' => $currentOrder ? $this->calculateOccupancyDuration($currentOrder) : 0,
                ];
            })->values();

            // Update cache
            Cache::put("table_status_{$storeId}", $tableStatus, 10); // 10 seconds cache

            // Broadcast to subscribers
            $this->broadcastToSubscribers($storeId, 'table_status_update', [
                'table_status' => $tableStatus,
                'timestamp' => now()->toISOString(),
            ]);

            return [
                'success' => true,
                'data' => $tableStatus,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to track table status', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to track table status: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Monitor staff performance in real-time
     */
    public function monitorStaffPerformance(int $storeId): array
    {
        try {
            $today = now()->toDateString();
            $currentHour = now()->format('H');
            
            $activeStaff = User::where('store_id', $storeId)
                ->waiters()
                ->with(['waiterOrders' => function ($query) use ($today) {
                    return $query->whereDate('order_date', $today);
                }])
                ->get();

            $staffMetrics = $activeStaff->map(function ($staff) {
                $todayOrders = $staff->waiterOrders;
                
                return [
                    'staff_id' => $staff->id,
                    'staff_name' => $staff->name,
                    'current_orders' => $todayOrders->count(),
                    'current_revenue' => $todayOrders->sum('final_total'),
                    'current_customers' => $todayOrders->sum('customer_count'),
                    'average_order_value' => $todayOrders->count() > 0 ? 
                        $todayOrders->sum('final_total') / $todayOrders->count() : 0,
                    'orders_per_hour' => $this->calculateOrdersPerHour($todayOrders),
                    'tips_earned' => $todayOrders->sum(function ($order) {
                        return $order->payments->sum('tip_amount');
                    }),
                    'efficiency_score' => $this->calculateStaffEfficiencyScore($todayOrders),
                    'performance_rating' => $this->getPerformanceRating($todayOrders),
                ];
            })->sortByDesc('current_revenue')->values();

            // Update cache
            Cache::put("staff_performance_{$storeId}", $staffMetrics, 30); // 30 seconds cache

            // Broadcast to subscribers
            $this->broadcastToSubscribers($storeId, 'staff_performance_update', [
                'staff_metrics' => $staffMetrics,
                'timestamp' => now()->toISOString(),
            ]);

            return [
                'success' => true,
                'data' => $staffMetrics,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to monitor staff performance', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to monitor staff performance: ' . $e->getMessage()
            ];
        }
    }

    // Helper methods

    /**
     * Clear store connections
     */
    private function clearStoreConnections(int $storeId): void
    {
        // Remove existing connections for this store
        $this->activeConnections = array_filter($this->activeConnections, function ($connection) use ($storeId) {
            return $connection['store_id'] !== $storeId;
        });
    }

    /**
     * Initialize metrics cache
     */
    private function initializeMetricsCache(int $storeId): void
    {
        Cache::put("metrics_initialized_{$storeId}", true, 3600); // 1 hour
    }

    /**
     * Start real-time monitoring
     */
    private function startRealTimeMonitoring(int $storeId): void
    {
        // This would start background processes for monitoring
        Log::info('Real-time monitoring started', ['store_id' => $storeId]);
    }

    /**
     * Get current metrics
     */
    private function getCurrentMetrics(int $storeId): array
    {
        return Cache::get("live_metrics_{$storeId}", []);
    }

    /**
     * Broadcast to subscribers
     */
    private function broadcastToSubscribers(int $storeId, string $eventType, array $data): void
    {
        foreach ($this->reportSubscribers as $subscriptionId => $subscription) {
            if ($subscription['store_id'] === $storeId && 
                in_array($subscription['update_type'], ['all', $eventType])) {
                
                try {
                    call_user_func($subscription['callback'], [
                        'event_type' => $eventType,
                        'data' => $data,
                        'timestamp' => now()->toISOString(),
                    ]);
                } catch (\Exception $e) {
                    Log::error('Error broadcasting to subscriber', [
                        'subscription_id' => $subscriptionId,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }
    }

    /**
     * Get live hourly breakdown
     */
    private function getLiveHourlyBreakdown($orders): array
    {
        return $orders->groupBy(function ($order) {
            return $order->order_time ? Carbon::parse($order->order_time)->format('H') : 'unknown';
        })->map(function ($hourOrders, $hour) {
            return [
                'hour' => $hour,
                'orders' => $hourOrders->count(),
                'revenue' => $hourOrders->sum('final_total'),
                'customers' => $hourOrders->sum('customer_count'),
            ];
        })->sortBy('hour')->values();
    }

    /**
     * Format active orders
     */
    private function formatActiveOrders($activeOrders): array
    {
        return $activeOrders->map(function ($order) {
            return [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'table_number' => $order->table ? $order->table->table_number : null,
                'customer_count' => $order->customer_count,
                'order_value' => $order->final_total,
                'order_time' => $order->order_time,
                'waiter' => $order->waiter ? $order->waiter->name : null,
                'status' => $order->status,
                'duration' => $order->created_at ? $order->created_at->diffInMinutes(now()) : 0,
            ];
        })->values();
    }

    /**
     * Get recent orders
     */
    private function getRecentOrders($orders, int $limit): array
    {
        return $orders->sortByDesc('created_at')
            ->take($limit)
            ->map(function ($order) {
                return [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'table_number' => $order->table ? $order->table->table_number : null,
                    'customer_count' => $order->customer_count,
                    'order_value' => $order->final_total,
                    'status' => $order->status,
                    'created_at' => $order->created_at,
                ];
            })
            ->values();
    }

    /**
     * Get current table status
     */
    private function getCurrentTableStatus(int $storeId): array
    {
        return Cache::get("table_status_{$storeId}", []);
    }

    /**
     * Get live staff performance
     */
    private function getLiveStaffPerformance($orders): array
    {
        return $orders->where('waiter_id')
            ->groupBy('waiter_id')
            ->map(function ($waiterOrders, $waiterId) {
                $waiter = $waiterOrders->first()->waiter;
                return [
                    'waiter_id' => $waiterId,
                    'waiter_name' => $waiter ? $waiter->name : 'Unknown',
                    'orders' => $waiterOrders->count(),
                    'revenue' => $waiterOrders->sum('final_total'),
                    'customers' => $waiterOrders->sum('customer_count'),
                    'average_order_value' => $waiterOrders->count() > 0 ? 
                        $waiterOrders->sum('final_total') / $waiterOrders->count() : 0,
                ];
            })
            ->sortByDesc('revenue')
            ->values();
    }

    /**
     * Generate real-time alerts
     */
    private function generateRealTimeAlerts($todayOrders, $activeOrders): array
    {
        $alerts = [];
        
        // Check for high order volume
        if ($todayOrders->count() > 100) {
            $alerts[] = [
                'type' => 'high_order_volume',
                'severity' => 'medium',
                'message' => 'High order volume detected',
                'value' => $todayOrders->count(),
            ];
        }
        
        // Check for long wait times
        $longWaitingOrders = $activeOrders->filter(function ($order) {
            return $order->created_at && $order->created_at->diffInMinutes(now()) > 30;
        });
        
        if ($longWaitingOrders->count() > 0) {
            $alerts[] = [
                'type' => 'long_wait_time',
                'severity' => 'high',
                'message' => 'Orders waiting longer than usual',
                'value' => $longWaitingOrders->count(),
            ];
        }
        
        return $alerts;
    }

    /**
     * Detect order anomalies
     */
    private function detectOrderAnomalies(int $storeId): array
    {
        // This would use statistical analysis to detect anomalies
        // For now, return empty array
        return [];
    }

    /**
     * Detect payment anomalies
     */
    private function detectPaymentAnomalies(int $storeId): array
    {
        // This would monitor payment patterns and detect anomalies
        return [];
    }

    /**
     * Detect performance anomalies
     */
    private function detectPerformanceAnomalies(int $storeId): array
    {
        // This would compare against benchmarks and detect anomalies
        return [];
    }

    /**
     * Detect inventory anomalies
     */
    private function detectInventoryAnomalies(int $storeId): array
    {
        // This would monitor inventory levels and detect anomalies
        return [];
    }

    // Additional helper methods for calculations would be implemented here
    private function calculatePaymentCompletionRate($orders): float
    {
        $paidOrders = $orders->where('payment_status', 'paid')->count();
        return $orders->count() > 0 ? ($paidOrders / $orders->count()) * 100 : 0;
    }

    private function calculateAverageFulfillmentTime($orders): float
    {
        $completedOrders = $orders->where('status', 'completed');
        if ($completedOrders->isEmpty()) {
            return 0;
        }

        $totalTime = $completedOrders->sum(function ($order) {
            return $order->created_at && $order->completed_at ? 
                $order->created_at->diffInMinutes($order->completed_at) : 0;
        });

        return $completedOrders->count() > 0 ? $totalTime / $completedOrders->count() : 0;
    }

    private function calculateTableTurnoverRate(int $storeId, $orders): float
    {
        $tableCount = RestaurantTable::forStore($storeId)->count();
        if ($tableCount === 0) {
            return 0;
        }

        $days = $orders->count() > 0 ? 
            $orders->max('created_at')->diffInDays($orders->min('created_at')) : 1;
        
        return ($orders->count() / $tableCount) / $days;
    }

    private function calculateStaffProductivity($orders): array
    {
        return $orders->where('waiter_id')
            ->groupBy('waiter_id')
            ->map(function ($waiterOrders, $waiterId) {
                $ordersPerHour = $waiterOrders->count() / 8; // Assuming 8-hour shift
                return [
                    'waiter_id' => $waiterId,
                    'orders_per_hour' => $ordersPerHour,
                    'revenue_per_hour' => $waiterOrders->sum('final_total') / 8,
                ];
            })
            ->values();
    }

    private function calculateOrderCompletionRate($orders): float
    {
        $completedOrders = $orders->where('status', 'completed')->count();
        return $orders->count() > 0 ? ($completedOrders / $orders->count()) * 100 : 0;
    }

    private function calculateDailyAverageRevenue($orders): float
    {
        $days = $orders->count() > 0 ? 
            $orders->max('created_at')->diffInDays($orders->min('created_at')) : 1;
        
        return $days > 0 ? $orders->sum('final_total') / $days : 0;
    }

    private function calculateRevenueGrowthRate($orders): float
    {
        // Simplified growth calculation
        return 0; // Would compare with previous period
    }

    private function calculateProfitMarginTrend($orders): array
    {
        // Would calculate profit margins over time
        return [];
    }

    private function calculateCustomerSatisfactionScore($orders): float
    {
        // Would calculate based on various factors
        return 85.5; // Placeholder score
    }

    private function calculateRepeatCustomerRate($orders): float
    {
        // Would calculate repeat customer percentage
        return 25.0; // Placeholder percentage
    }

    private function calculateAverageCustomersPerHour($orders): float
    {
        $totalCustomers = $orders->sum('customer_count');
        $hours = 8; // Assuming 8-hour operating day
        
        return $totalCustomers / $hours;
    }

    private function getRealTimePopularItems($orders): array
    {
        return $orders->flatMap(function ($order) {
                return $order->items;
            })->groupBy('product_id')
            ->map(function ($productItems, $productId) {
                return [
                    'product_id' => $productId,
                    'quantity_sold' => $productItems->sum('quantity'),
                    'revenue' => $productItems->sum(function ($item) {
                        return $item->quantity * $item->unit_price;
                    }),
                ];
            })
            ->sortByDesc('quantity_sold')
            ->take(10)
            ->values();
    }

    private function getInventoryTurnoverAlerts(int $storeId): array
    {
        // Would check inventory levels and generate alerts
        return [];
    }

    private function getRealTimeTableStatus($table): string
    {
        if ($table->currentOrder) {
            return 'occupied';
        } elseif ($table->reservations()->where('reserved_until', '>', now())->exists()) {
            return 'reserved';
        } else {
            return 'available';
        }
    }

    private function calculateOccupancyDuration($order): int
    {
        return $order->created_at ? $order->created_at->diffInMinutes(now()) : 0;
    }

    private function calculateOrdersPerHour($orders): float
    {
        $hours = 8; // Assuming 8-hour shift
        return $orders->count() / $hours;
    }

    private function calculateStaffEfficiencyScore($orders): float
    {
        // Would calculate based on multiple factors
        return 75.0; // Placeholder score
    }

    private function getPerformanceRating($orders): string
    {
        $revenue = $orders->sum('final_total');
        if ($revenue > 1000) {
            return 'excellent';
        } elseif ($revenue > 500) {
            return 'good';
        } elseif ($revenue > 250) {
            return 'average';
        } else {
            return 'needs_improvement';
        }
    }
}