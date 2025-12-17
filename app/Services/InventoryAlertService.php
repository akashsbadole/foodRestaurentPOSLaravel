<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductStock;
use App\Models\ProductBatch;
use App\Models\Store;
use App\Models\User;
use App\Services\InventoryManagementService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Carbon\Carbon;

class InventoryAlertService
{
    protected InventoryManagementService $inventoryService;

    public function __construct(InventoryManagementService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Generate low stock alerts for all stores
     */
    public function generateLowStockAlerts(): array
    {
        try {
            $stores = Store::where('is_active', true)->get();
            $allAlerts = [];

            foreach ($stores as $store) {
                $storeAlerts = $this->getStoreLowStockAlerts($store->id);
                $allAlerts = array_merge($allAlerts, $storeAlerts);
            }

            // Group alerts by severity
            $criticalAlerts = array_filter($allAlerts, fn($alert) => $alert['severity'] === 'critical');
            $warningAlerts = array_filter($allAlerts, fn($alert) => $alert['severity'] === 'warning');

            // Send notifications
            if (!empty($criticalAlerts)) {
                $this->sendCriticalAlerts($criticalAlerts);
            }

            if (!empty($warningAlerts)) {
                $this->sendWarningAlerts($warningAlerts);
            }

            Log::info('Low stock alerts generated', [
                'total_alerts' => count($allAlerts),
                'critical_alerts' => count($criticalAlerts),
                'warning_alerts' => count($warningAlerts),
            ]);

            return [
                'success' => true,
                'data' => [
                    'total_alerts' => count($allAlerts),
                    'critical_alerts' => count($criticalAlerts),
                    'warning_alerts' => count($warningAlerts),
                    'alerts' => $allAlerts,
                    'generated_at' => now()->toISOString(),
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate low stock alerts', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate low stock alerts: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get low stock alerts for a specific store
     */
    public function getStoreLowStockAlerts(int $storeId): array
    {
        try {
            $lowStockItems = ProductStock::where('store_id', $storeId)
                ->with(['product', 'store'])
                ->get()
                ->filter(function ($stock) {
                    return $stock->available_quantity <= $stock->product->alert_quantity;
                })
                ->map(function ($stock) {
                    $severity = $stock->available_quantity <= 0 ? 'critical' : 'warning';
                    
                    return [
                        'type' => 'low_stock',
                        'store_id' => $stock->store_id,
                        'store_name' => $stock->store->name,
                        'product_id' => $stock->product_id,
                        'product_name' => $stock->product->name,
                        'sku' => $stock->product->sku,
                        'current_stock' => $stock->available_quantity,
                        'alert_threshold' => $stock->product->alert_quantity,
                        'severity' => $severity,
                        'shortfall' => max(0, $stock->product->alert_quantity - $stock->available_quantity),
                        'days_of_stock' => $this->calculateDaysOfStock($stock),
                        'suggested_reorder_quantity' => $this->calculateSuggestedReorder($stock),
                        'created_at' => now()->toISOString(),
                    ];
                })
                ->toArray();

            return $lowStockItems;
        } catch (\Exception $e) {
            Log::error('Failed to get store low stock alerts', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Generate expiration alerts for perishable items
     */
    public function generateExpirationAlerts(int $daysAhead = 7): array
    {
        try {
            $stores = Store::where('is_active', true)->get();
            $allAlerts = [];

            foreach ($stores as $store) {
                $storeAlerts = $this->getStoreExpirationAlerts($store->id, $daysAhead);
                $allAlerts = array_merge($allAlerts, $storeAlerts);
            }

            // Group alerts by severity
            $criticalAlerts = array_filter($allAlerts, fn($alert) => $alert['severity'] === 'critical');
            $warningAlerts = array_filter($allAlerts, fn($alert) => $alert['severity'] === 'warning');

            // Send notifications
            if (!empty($criticalAlerts)) {
                $this->sendCriticalExpirationAlerts($criticalAlerts);
            }

            if (!empty($warningAlerts)) {
                $this->sendWarningExpirationAlerts($warningAlerts);
            }

            Log::info('Expiration alerts generated', [
                'total_alerts' => count($allAlerts),
                'critical_alerts' => count($criticalAlerts),
                'warning_alerts' => count($warningAlerts),
                'days_ahead' => $daysAhead,
            ]);

            return [
                'success' => true,
                'data' => [
                    'total_alerts' => count($allAlerts),
                    'critical_alerts' => count($criticalAlerts),
                    'warning_alerts' => count($warningAlerts),
                    'alerts' => $allAlerts,
                    'days_ahead' => $daysAhead,
                    'generated_at' => now()->toISOString(),
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate expiration alerts', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate expiration alerts: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get expiration alerts for a specific store
     */
    public function getStoreExpirationAlerts(int $storeId, int $daysAhead = 7): array
    {
        try {
            $expiryDate = Carbon::now()->addDays($daysAhead);
            
            $expiringBatches = ProductBatch::whereHas('productStock', function($query) use ($storeId) {
                    $query->where('store_id', $storeId);
                })
                ->where('expiry_date', '<=', $expiryDate)
                ->where('expiry_date', '>', now())
                ->with(['product', 'productStock.store'])
                ->get()
                ->map(function ($batch) {
                    $daysUntilExpiry = Carbon::now()->diffInDays($batch->expiry_date);
                    $severity = $daysUntilExpiry <= 3 ? 'critical' : 'warning';
                    
                    return [
                        'type' => 'expiration',
                        'store_id' => $batch->productStock->store_id,
                        'store_name' => $batch->productStock->store->name,
                        'batch_id' => $batch->id,
                        'batch_number' => $batch->batch_number,
                        'product_id' => $batch->product_id,
                        'product_name' => $batch->product->name,
                        'sku' => $batch->product->sku,
                        'quantity' => $batch->quantity,
                        'expiry_date' => $batch->expiry_date,
                        'days_until_expiry' => $daysUntilExpiry,
                        'severity' => $severity,
                        'total_value' => $batch->quantity * ($batch->cost ?? 0),
                        'suggested_action' => $this->getExpirationSuggestedAction($daysUntilExpiry, $batch->quantity),
                        'created_at' => now()->toISOString(),
                    ];
                })
                ->toArray();

            return $expiringBatches;
        } catch (\Exception $e) {
            Log::error('Failed to get store expiration alerts', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Generate reorder suggestions based on stock levels and usage patterns
     */
    public function generateReorderSuggestions(): array
    {
        try {
            $stores = Store::where('is_active', true)->get();
            $allSuggestions = [];

            foreach ($stores as $store) {
                $storeSuggestions = $this->getStoreReorderSuggestions($store->id);
                $allSuggestions = array_merge($allSuggestions, $storeSuggestions);
            }

            // Prioritize suggestions
            $urgentSuggestions = array_filter($allSuggestions, fn($suggestion) => $suggestion['priority'] === 'urgent');
            $highSuggestions = array_filter($allSuggestions, fn($suggestion) => $suggestion['priority'] === 'high');
            $normalSuggestions = array_filter($allSuggestions, fn($suggestion) => $suggestion['priority'] === 'normal');

            // Send reorder notifications
            if (!empty($urgentSuggestions)) {
                $this->sendUrgentReorderSuggestions($urgentSuggestions);
            }

            Log::info('Reorder suggestions generated', [
                'total_suggestions' => count($allSuggestions),
                'urgent_suggestions' => count($urgentSuggestions),
                'high_suggestions' => count($highSuggestions),
                'normal_suggestions' => count($normalSuggestions),
            ]);

            return [
                'success' => true,
                'data' => [
                    'total_suggestions' => count($allSuggestions),
                    'urgent_suggestions' => count($urgentSuggestions),
                    'high_suggestions' => count($highSuggestions),
                    'normal_suggestions' => count($normalSuggestions),
                    'suggestions' => $allSuggestions,
                    'generated_at' => now()->toISOString(),
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate reorder suggestions', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate reorder suggestions: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get reorder suggestions for a specific store
     */
    public function getStoreReorderSuggestions(int $storeId): array
    {
        try {
            $stockLevels = ProductStock::where('store_id', $storeId)
                ->with(['product', 'store'])
                ->get()
                ->filter(function ($stock) {
                    return $stock->product->track_inventory && $stock->shouldReorder();
                })
                ->map(function ($stock) {
                    $suggestedQuantity = $stock->getSuggestedOrderQuantity();
                    $priority = $this->getReorderPriority($stock);
                    
                    return [
                        'type' => 'reorder_suggestion',
                        'store_id' => $stock->store_id,
                        'store_name' => $stock->store->name,
                        'product_id' => $stock->product_id,
                        'product_name' => $stock->product->name,
                        'sku' => $stock->product->sku,
                        'current_stock' => $stock->available_quantity,
                        'reorder_point' => $stock->reorder_point,
                        'suggested_quantity' => $suggestedQuantity,
                        'priority' => $priority,
                        'days_of_stock' => $stock->getDaysOfStock(),
                        'daily_usage' => $stock->getDailyUsage(),
                        'estimated_cost' => $suggestedQuantity * ($stock->product->cost_price ?? 0),
                        'supplier_info' => $this->getPreferredSupplier($stock->product_id),
                        'created_at' => now()->toISOString(),
                    ];
                })
                ->toArray();

            return $stockLevels;
        } catch (\Exception $e) {
            Log::error('Failed to get store reorder suggestions', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Generate waste and spoilage alerts
     */
    public function generateWasteAlerts(string $startDate, string $endDate): array
    {
        try {
            $stores = Store::where('is_active', true)->get();
            $allAlerts = [];

            foreach ($stores as $store) {
                $storeAlerts = $this->getStoreWasteAlerts($store->id, $startDate, $endDate);
                $allAlerts = array_merge($allAlerts, $storeAlerts);
            }

            // Analyze waste patterns
            $wasteAnalysis = $this->analyzeWastePatterns($allAlerts);

            Log::info('Waste alerts generated', [
                'total_alerts' => count($allAlerts),
                'period' => $startDate . ' to ' . $endDate,
                'waste_analysis' => $wasteAnalysis,
            ]);

            return [
                'success' => true,
                'data' => [
                    'total_alerts' => count($allAlerts),
                    'alerts' => $allAlerts,
                    'period' => [
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ],
                    'waste_analysis' => $wasteAnalysis,
                    'generated_at' => now()->toISOString(),
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate waste alerts', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate waste alerts: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get waste alerts for a specific store
     */
    public function getStoreWasteAlerts(int $storeId, string $startDate, string $endDate): array
    {
        try {
            // This would query waste records from a waste tracking table
            // For now, return empty array as placeholder
            $wasteRecords = [];

            return $wasteRecords;
        } catch (\Exception $e) {
            Log::error('Failed to get store waste alerts', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Generate daily inventory summary for management
     */
    public function generateDailyInventorySummary(): array
    {
        try {
            $stores = Store::where('is_active', true)->get();
            $summaries = [];

            foreach ($stores as $store) {
                $summary = $this->getStoreDailySummary($store->id);
                $summaries[] = $summary;
            }

            Log::info('Daily inventory summaries generated', [
                'total_stores' => count($summaries),
                'generated_at' => now()->toISOString(),
            ]);

            return [
                'success' => true,
                'data' => [
                    'summaries' => $summaries,
                    'generated_at' => now()->toISOString(),
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate daily inventory summary', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate daily inventory summary: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get daily inventory summary for a specific store
     */
    public function getStoreDailySummary(int $storeId): array
    {
        try {
            $stockData = ProductStock::where('store_id', $storeId)
                ->with(['product', 'store'])
                ->get();

            $totalProducts = $stockData->count();
            $lowStockItems = $stockData->filter(function ($stock) {
                return $stock->available_quantity <= $stock->product->alert_quantity;
            })->count();
            
            $outOfStockItems = $stockData->filter(function ($stock) {
                return $stock->available_quantity <= 0;
            })->count();

            $totalValue = $stockData->sum(function ($stock) {
                return $stock->available_quantity * ($stock->product->cost_price ?? 0);
            });

            $expiringItems = $this->getStoreExpirationAlerts($storeId, 7);
            $expiringValue = array_sum(array_column($expiringItems, 'total_value'));

            return [
                'store_id' => $storeId,
                'store_name' => $stockData->first()?->store->name,
                'date' => now()->format('Y-m-d'),
                'total_products' => $totalProducts,
                'low_stock_items' => $lowStockItems,
                'out_of_stock_items' => $outOfStockItems,
                'total_inventory_value' => $totalValue,
                'expiring_items_count' => count($expiringItems),
                'expiring_value' => $expiringValue,
                'stock_health_score' => $this->calculateStockHealthScore($totalProducts, $lowStockItems, $outOfStockItems),
                'alerts_requiring_attention' => $lowStockItems + $outOfStockItems + count($expiringItems),
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get store daily summary', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Send critical alerts to management
     */
    private function sendCriticalAlerts(array $alerts): void
    {
        $managers = User::where('role', 'manager')->orWhere('role', 'admin')->get();
        
        foreach ($managers as $manager) {
            // Send notification (email, SMS, push notification, etc.)
            // This would integrate with your notification system
            Log::info('Critical alert sent', [
                'manager_id' => $manager->id,
                'alert_count' => count($alerts),
            ]);
        }
    }

    /**
     * Send warning alerts to relevant staff
     */
    private function sendWarningAlerts(array $alerts): void
    {
        $staff = User::where('role', 'kitchen_staff')->orWhere('role', 'inventory_manager')->get();
        
        foreach ($staff as $user) {
            // Send notification
            Log::info('Warning alert sent', [
                'user_id' => $user->id,
                'alert_count' => count($alerts),
            ]);
        }
    }

    /**
     * Send critical expiration alerts
     */
    private function sendCriticalExpirationAlerts(array $alerts): void
    {
        $managers = User::where('role', 'manager')->orWhere('role', 'admin')->get();
        
        foreach ($managers as $manager) {
            // Send notification
            Log::info('Critical expiration alert sent', [
                'manager_id' => $manager->id,
                'alert_count' => count($alerts),
            ]);
        }
    }

    /**
     * Send warning expiration alerts
     */
    private function sendWarningExpirationAlerts(array $alerts): void
    {
        $kitchenStaff = User::where('role', 'kitchen_staff')->get();
        
        foreach ($kitchenStaff as $user) {
            // Send notification
            Log::info('Warning expiration alert sent', [
                'user_id' => $user->id,
                'alert_count' => count($alerts),
            ]);
        }
    }

    /**
     * Send urgent reorder suggestions
     */
    private function sendUrgentReorderSuggestions(array $suggestions): void
    {
        $managers = User::where('role', 'manager')->orWhere('role', 'admin')->get();
        
        foreach ($managers as $manager) {
            // Send notification
            Log::info('Urgent reorder suggestion sent', [
                'manager_id' => $manager->id,
                'suggestion_count' => count($suggestions),
            ]);
        }
    }

    /**
     * Calculate days of stock for an item
     */
    private function calculateDaysOfStock($stock): float
    {
        $dailyUsage = $stock->getDailyUsage();
        return $dailyUsage > 0 ? floor($stock->available_quantity / $dailyUsage) : 999;
    }

    /**
     * Calculate suggested reorder quantity
     */
    private function calculateSuggestedReorder($stock): float
    {
        return $stock->getSuggestedOrderQuantity();
    }

    /**
     * Get reorder priority based on stock status
     */
    private function getReorderPriority($stock): string
    {
        if ($stock->available_quantity <= 0) {
            return 'urgent';
        } elseif ($stock->available_quantity <= $stock->reorder_point) {
            return 'high';
        } else {
            return 'normal';
        }
    }

    /**
     * Get preferred supplier for a product
     */
    private function getPreferredSupplier(int $productId): array
    {
        // This would query supplier relationships
        // For now, return empty array as placeholder
        return [];
    }

    /**
     * Get suggested action for expiring items
     */
    private function getExpirationSuggestedAction(int $daysUntilExpiry, float $quantity): string
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
     * Analyze waste patterns
     */
    private function analyzeWastePatterns(array $wasteRecords): array
    {
        if (empty($wasteRecords)) {
            return [
                'total_waste_value' => 0,
                'most_wasted_products' => [],
                'waste_trends' => [],
            ];
        }

        $totalWasteValue = array_sum(array_column($wasteRecords, 'total_value'));
        
        return [
            'total_waste_value' => $totalWasteValue,
            'most_wasted_products' => [], // Would analyze and rank products
            'waste_trends' => [], // Would analyze time-based patterns
        ];
    }

    /**
     * Calculate stock health score
     */
    private function calculateStockHealthScore(int $totalProducts, int $lowStockItems, int $outOfStockItems): float
    {
        if ($totalProducts === 0) {
            return 100;
        }

        $stockIssues = $lowStockItems + $outOfStockItems;
        $healthScore = max(0, 100 - (($stockIssues / $totalProducts) * 100));
        
        return round($healthScore, 1);
    }

    /**
     * Get alert history for a store
     */
    public function getAlertHistory(int $storeId, string $startDate, string $endDate): array
    {
        try {
            // This would query an alerts history table
            // For now, return empty array as placeholder
            $alertHistory = [];

            return [
                'success' => true,
                'data' => [
                    'store_id' => $storeId,
                    'period' => [
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                    ],
                    'alerts' => $alertHistory,
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get alert history', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to get alert history: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Create custom alert
     */
    public function createCustomAlert(array $alertData): array
    {
        try {
            // This would save to an alerts table
            // For now, just log and return success
            Log::info('Custom alert created', $alertData);

            return [
                'success' => true,
                'message' => 'Custom alert created successfully',
                'data' => [
                    'alert_id' => 'custom_' . time(),
                    'created_at' => now()->toISOString(),
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Failed to create custom alert', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to create custom alert: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update alert preferences for a user
     */
    public function updateAlertPreferences(int $userId, array $preferences): array
    {
        try {
            // This would update user preferences in database
            // For now, just log and return success
            Log::info('Alert preferences updated', [
                'user_id' => $userId,
                'preferences' => $preferences,
            ]);

            return [
                'success' => true,
                'message' => 'Alert preferences updated successfully',
            ];
        } catch (\Exception $e) {
            Log::error('Failed to update alert preferences', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to update alert preferences: ' . $e->getMessage()
            ];
        }
    }
}