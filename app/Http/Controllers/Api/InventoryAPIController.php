<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\InventoryManagementService;
use App\Services\InventoryAlertService;
use App\Services\Restaurant\RestaurantInventoryIntegrationService;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\ProductBatch;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class InventoryAPIController extends Controller
{
    protected InventoryManagementService $inventoryService;
    protected InventoryAlertService $alertService;
    protected RestaurantInventoryIntegrationService $restaurantInventoryService;

    public function __construct(
        InventoryManagementService $inventoryService,
        InventoryAlertService $alertService,
        RestaurantInventoryIntegrationService $restaurantInventoryService
    ) {
        $this->inventoryService = $inventoryService;
        $this->alertService = $alertService;
        $this->restaurantInventoryService = $restaurantInventoryService;
    }

    /**
     * Check stock availability for products
     */
    public function checkStockAvailability(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'product_ids' => 'required|array',
                'product_ids.*' => 'exists:products,id',
                'store_id' => 'required|exists:stores,id',
                'quantities' => 'required|array',
                'quantities.*' => 'numeric|min:0.01',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $productIds = $request->product_ids;
            $storeId = $request->store_id;
            $quantities = $request->quantities ?? [];

            $availabilityResults = [];

            foreach ($productIds as $productId) {
                $requiredQuantity = $quantities[$productId] ?? 1;
                
                $stockAvailability = $this->inventoryService->getStockAvailability($productId);
                
                if ($stockAvailability['success']) {
                    $storeStock = collect($stockAvailability['data']['stores'])
                        ->firstWhere('store_id', $storeId);
                    
                    $availabilityResults[] = [
                        'product_id' => $productId,
                        'available' => $storeStock ? $storeStock['available_quantity'] >= $requiredQuantity : false,
                        'current_stock' => $storeStock ? $storeStock['available_quantity'] : 0,
                        'required_quantity' => $requiredQuantity,
                        'shortfall' => $storeStock ? max(0, $requiredQuantity - $storeStock['available_quantity']) : $requiredQuantity,
                        'status' => $storeStock ? $storeStock['status'] : 'not_available',
                    ];
                } else {
                    $availabilityResults[] = [
                        'product_id' => $productId,
                        'available' => false,
                        'error' => $stockAvailability['message'],
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'store_id' => $storeId,
                    'availability_check' => $availabilityResults,
                    'all_available' => collect($availabilityResults)->every('available'),
                    'checked_at' => now()->toISOString(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Stock availability check failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Stock availability check failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reserve stock for order items
     */
    public function reserveStock(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'order_items' => 'required|array',
                'order_items.*.product_id' => 'required|exists:products,id',
                'order_items.*.quantity' => 'required|numeric|min:0.01',
                'order_items.*.order_number' => 'required|string',
                'store_id' => 'required|exists:stores,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $storeId = $request->store_id;
            $orderItems = $request->order_items;
            $reservationResults = [];
            $failedItems = [];

            foreach ($orderItems as $item) {
                $result = $this->inventoryService->reserveStock(
                    $item['product_id'],
                    $storeId,
                    $item['quantity'],
                    $item['order_number']
                );

                if ($result['success']) {
                    $reservationResults[] = $result['data'];
                } else {
                    $failedItems[] = [
                        'product_id' => $item['product_id'],
                        'quantity' => $item['quantity'],
                        'error' => $result['message']
                    ];
                }
            }

            if (!empty($failedItems)) {
                // Rollback successful reservations
                foreach ($reservationResults as $reservation) {
                    $this->inventoryService->releaseReservedStock(
                        $reservation['product_id'],
                        $storeId,
                        $reservation['quantity_reserved'],
                        'Rollback - Partial reservation failure'
                    );
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Stock reservation failed for some items',
                    'failed_items' => $failedItems,
                    'data' => [
                        'items_processed' => count($reservationResults),
                        'failed_count' => count($failedItems),
                    ]
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'Stock reserved successfully for all items',
                'data' => [
                    'store_id' => $storeId,
                    'items_processed' => count($reservationResults),
                    'reservations' => $reservationResults,
                    'reserved_at' => now()->toISOString(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Stock reservation failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Stock reservation failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Release reserved stock
     */
    public function releaseReservedStock(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'reservations' => 'required|array',
                'reservations.*.product_id' => 'required|exists:products,id',
                'reservations.*.quantity' => 'required|numeric|min:0.01',
                'reservations.*.reason' => 'string',
                'store_id' => 'required|exists:stores,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $storeId = $request->store_id;
            $reservations = $request->reservations;
            $releaseResults = [];
            $failedItems = [];

            foreach ($reservations as $reservation) {
                $result = $this->inventoryService->releaseReservedStock(
                    $reservation['product_id'],
                    $storeId,
                    $reservation['quantity'],
                    $reservation['reason'] ?? 'Stock release'
                );

                if ($result['success']) {
                    $releaseResults[] = $result['data'];
                } else {
                    $failedItems[] = [
                        'product_id' => $reservation['product_id'],
                        'quantity' => $reservation['quantity'],
                        'error' => $result['message']
                    ];
                }
            }

            return response()->json([
                'success' => empty($failedItems),
                'message' => empty($failedItems) ? 'Stock released successfully' : 'Some stock releases failed',
                'data' => [
                    'store_id' => $storeId,
                    'items_processed' => count($releaseResults),
                    'failed_count' => count($failedItems),
                    'releases' => $releaseResults,
                    'failed_items' => $failedItems,
                    'released_at' => now()->toISOString(),
                ]
            ], empty($failedItems) ? 200 : 422);
        } catch (\Exception $e) {
            Log::error('Stock release failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Stock release failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Deduct stock on payment completion
     */
    public function deductStock(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'order_items' => 'required|array',
                'order_items.*.product_id' => 'required|exists:products,id',
                'order_items.*.quantity' => 'required|numeric|min:0.01',
                'order_items.*.reference_type' => 'string',
                'order_items.*.reference_id' => 'nullable|integer',
                'store_id' => 'required|exists:stores,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $storeId = $request->store_id;
            $orderItems = $request->order_items;
            $deductionResults = [];
            $failedItems = [];

            foreach ($orderItems as $item) {
                $result = $this->inventoryService->deductStock(
                    $item['product_id'],
                    $storeId,
                    $item['quantity'],
                    $item['reference_type'] ?? null,
                    $item['reference_id'] ?? null
                );

                if ($result['success']) {
                    $deductionResults[] = $result['data'];
                } else {
                    $failedItems[] = [
                        'product_id' => $item['product_id'],
                        'quantity' => $item['quantity'],
                        'error' => $result['message']
                    ];
                }
            }

            if (!empty($failedItems)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stock deduction failed for some items',
                    'failed_items' => $failedItems,
                    'data' => [
                        'items_processed' => count($deductionResults),
                        'failed_count' => count($failedItems),
                    ]
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'Stock deducted successfully for all items',
                'data' => [
                    'store_id' => $storeId,
                    'items_processed' => count($deductionResults),
                    'deductions' => $deductionResults,
                    'deducted_at' => now()->toISOString(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Stock deduction failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Stock deduction failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add stock to inventory
     */
    public function addStock(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'product_id' => 'required|exists:products,id',
                'quantity' => 'required|numeric|min:0.01',
                'store_id' => 'required|exists:stores,id',
                'batch_data' => 'nullable|array',
                'batch_data.batch_number' => 'required_with:batch_data|string',
                'batch_data.expiry_date' => 'nullable|date',
                'batch_data.cost' => 'nullable|numeric|min:0',
                'batch_data.supplier_id' => 'nullable|exists:contacts,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $result = $this->inventoryService->addStock(
                $request->product_id,
                $request->store_id,
                $request->quantity,
                $request->batch_data ?? null
            );

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'Stock added successfully',
                    'data' => $result['data']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 422);
            }
        } catch (\Exception $e) {
            Log::error('Stock addition failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Stock addition failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Transfer stock between stores
     */
    public function transferStock(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'product_id' => 'required|exists:products,id',
                'quantity' => 'required|numeric|min:0.01',
                'from_store_id' => 'required|exists:stores,id',
                'to_store_id' => 'required|exists:stores,id|different:from_store_id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $result = $this->inventoryService->transferStock(
                $request->product_id,
                $request->from_store_id,
                $request->to_store_id,
                $request->quantity
            );

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'Stock transferred successfully',
                    'data' => $result['data']
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 422);
            }
        } catch (\Exception $e) {
            Log::error('Stock transfer failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Stock transfer failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get low stock items for a store
     */
    public function getLowStockItems(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'store_id' => 'required|exists:stores,id',
                'threshold' => 'nullable|integer|min:1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $result = $this->inventoryService->getLowStockItems(
                $request->store_id,
                $request->threshold ?? null
            );

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Get low stock items failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get low stock items: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get expiring items for a store
     */
    public function getExpiringItems(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'store_id' => 'required|exists:stores,id',
                'days_ahead' => 'nullable|integer|min:1|max:365',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $result = $this->inventoryService->getExpiringItems(
                $request->store_id,
                $request->days_ahead ?? 7
            );

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Get expiring items failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get expiring items: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get inventory valuation for a store
     */
    public function getInventoryValuation(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'store_id' => 'required|exists:stores,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $result = $this->inventoryService->getInventoryValuation($request->store_id);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Get inventory valuation failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get inventory valuation: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get real-time inventory updates
     */
    public function getRealTimeUpdates(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'store_id' => 'required|exists:stores,id',
                'product_ids' => 'nullable|array',
                'product_ids.*' => 'exists:products,id',
                'last_update_id' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $storeId = $request->store_id;
            $productIds = $request->product_ids ?? null;
            $lastUpdateId = $request->last_update_id ?? 0;

            // Get recent inventory transactions
            $query = DB::table('inventory_transaction_items')
                ->join('inventory_transactions', 'inventory_transaction_items.inventory_transaction_id', '=', 'inventory_transactions.id')
                ->join('products', 'inventory_transaction_items.product_id', '=', 'products.id')
                ->where('inventory_transactions.store_id', $storeId)
                ->where('inventory_transactions.created_at', '>', now()->subMinutes(30)) // Last 30 minutes
                ->where('inventory_transactions.id', '>', $lastUpdateId)
                ->select([
                    'inventory_transactions.id as transaction_id',
                    'inventory_transactions.transaction_type',
                    'inventory_transactions.created_at',
                    'inventory_transactions.notes',
                    'products.id as product_id',
                    'products.name as product_name',
                    'inventory_transaction_items.quantity',
                    'inventory_transaction_items.unit_cost',
                    'inventory_transaction_items.total_cost',
                ])
                ->orderBy('inventory_transactions.created_at', 'desc')
                ->limit(100);

            $updates = $query->get();

            // Get current stock levels
            $stockQuery = ProductStock::where('store_id', $storeId)
                ->with(['product', 'batch']);

            if ($productIds) {
                $stockQuery->whereIn('product_id', $productIds);
            }

            $currentStock = $stockQuery->get()->map(function ($stock) {
                return [
                    'product_id' => $stock->product_id,
                    'product_name' => $stock->product->name,
                    'total_quantity' => $stock->quantity,
                    'reserved_quantity' => $stock->reserved_quantity,
                    'available_quantity' => $stock->available_quantity,
                    'batch_info' => $stock->batch ? [
                        'batch_number' => $stock->batch->batch_number,
                        'expiry_date' => $stock->batch->expiry_date,
                    ] : null,
                    'last_updated' => $stock->updated_at,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'store_id' => $storeId,
                    'last_update_id' => $updates->max('transaction_id') ?? 0,
                    'recent_transactions' => $updates,
                    'current_stock_levels' => $currentStock,
                    'generated_at' => now()->toISOString(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get real-time updates failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get real-time updates: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get inventory alerts
     */
    public function getInventoryAlerts(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'store_id' => 'nullable|exists:stores,id',
                'alert_type' => 'nullable|in:low_stock,expiration,reorder,waste',
                'severity' => 'nullable|in:critical,warning,normal',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $storeId = $request->store_id;
            $alertType = $request->alert_type;
            $severity = $request->severity;

            $alerts = [];

            if (!$alertType || $alertType === 'low_stock') {
                $lowStockAlerts = $storeId 
                    ? $this->alertService->getStoreLowStockAlerts($storeId)
                    : $this->alertService->generateLowStockAlerts();
                
                $alerts = array_merge($alerts, $lowStockAlerts['data']['alerts'] ?? []);
            }

            if (!$alertType || $alertType === 'expiration') {
                $daysAhead = $request->days_ahead ?? 7;
                $expirationAlerts = $storeId 
                    ? $this->alertService->getStoreExpirationAlerts($storeId, $daysAhead)
                    : $this->alertService->generateExpirationAlerts($daysAhead);
                
                $alerts = array_merge($alerts, $expirationAlerts['data']['alerts'] ?? []);
            }

            if (!$alertType || $alertType === 'reorder') {
                $reorderSuggestions = $storeId 
                    ? $this->alertService->getStoreReorderSuggestions($storeId)
                    : $this->alertService->generateReorderSuggestions();
                
                $alerts = array_merge($alerts, $reorderSuggestions['data']['suggestions'] ?? []);
            }

            // Filter by severity if specified
            if ($severity) {
                $alerts = array_filter($alerts, fn($alert) => $alert['severity'] === $severity);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'store_id' => $storeId,
                    'alert_type' => $alertType,
                    'severity' => $severity,
                    'alerts' => array_values($alerts),
                    'total_count' => count($alerts),
                    'generated_at' => now()->toISOString(),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get inventory alerts failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get inventory alerts: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get restaurant order stock integration
     */
    public function getRestaurantOrderStockIntegration(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'order_id' => 'required|exists:restaurant_orders,id',
                'action' => 'required|in:reserve,release,deduct',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $order = \App\Models\Restaurant\RestaurantOrder::with(['items.product', 'items.modifiers'])->find($request->order_id);
            
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }

            $action = $request->action;
            $result = [];

            switch ($action) {
                case 'reserve':
                    $result = $this->restaurantInventoryService->reserveOrderStock($order);
                    break;
                case 'release':
                    $result = $this->restaurantInventoryService->releaseOrderStock($order, $request->reason ?? 'Order cancelled');
                    break;
                case 'deduct':
                    $result = $this->restaurantInventoryService->deductOrderStock($order);
                    break;
            }

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Restaurant order stock integration failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Restaurant order stock integration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get stock forecasting
     */
    public function getStockForecasting(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'store_id' => 'required|exists:stores,id',
                'days_ahead' => 'nullable|integer|min:1|max:90',
                'product_ids' => 'nullable|array',
                'product_ids.*' => 'exists:products,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $storeId = $request->store_id;
            $daysAhead = $request->days_ahead ?? 7;
            $productIds = $request->product_ids ?? null;

            $result = $this->restaurantInventoryService->getStockForecasting($storeId, $daysAhead);

            if ($productIds && $result['success']) {
                // Filter forecast by specific products
                $filteredForecast = array_filter($result['data']['products'], 
                    fn($product) => in_array($product['product_id'], $productIds)
                );
                $result['data']['products'] = array_values($filteredForecast);
                $result['data']['summary']['total_products'] = count($filteredForecast);
                $result['data']['summary']['products_needing_reorder'] = 
                    count(array_filter($filteredForecast, fn($product) => $product['reorder_suggested']));
            }

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Get stock forecasting failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get stock forecasting: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get ingredient usage analytics
     */
    public function getIngredientUsageAnalytics(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'store_id' => 'required|exists:stores,id',
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'product_ids' => 'nullable|array',
                'product_ids.*' => 'exists:products,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $result = $this->restaurantInventoryService->getIngredientUsageAnalytics(
                $request->store_id,
                $request->start_date,
                $request->end_date
            );

            if ($request->product_ids && $result['success']) {
                // Filter analytics by specific products
                $filteredIngredients = array_filter($result['data']['ingredients'], 
                    fn($ingredient) => in_array($ingredient['product_id'], $request->product_ids)
                );
                $result['data']['ingredients'] = array_values($filteredIngredients);
                $result['data']['summary']['total_ingredients_used'] = count($filteredIngredients);
            }

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Get ingredient usage analytics failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get ingredient usage analytics: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create custom alert
     */
    public function createCustomAlert(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'alert_type' => 'required|string',
                'title' => 'required|string|max:255',
                'message' => 'required|string',
                'severity' => 'required|in:critical,warning,normal',
                'store_id' => 'nullable|exists:stores,id',
                'product_ids' => 'nullable|array',
                'product_ids.*' => 'exists:products,id',
                'user_ids' => 'nullable|array',
                'user_ids.*' => 'exists:users,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $alertData = $request->only([
                'alert_type', 'title', 'message', 'severity', 
                'store_id', 'product_ids', 'user_ids'
            ]);

            $result = $this->alertService->createCustomAlert($alertData);

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Create custom alert failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create custom alert: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update alert preferences
     */
    public function updateAlertPreferences(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id',
                'preferences' => 'required|array',
                'preferences.low_stock' => 'nullable|boolean',
                'preferences.expiration' => 'nullable|boolean',
                'preferences.reorder' => 'nullable|boolean',
                'preferences.waste' => 'nullable|boolean',
                'preferences.email_notifications' => 'nullable|boolean',
                'preferences.sms_notifications' => 'nullable|boolean',
                'preferences.push_notifications' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $result = $this->alertService->updateAlertPreferences(
                $request->user_id,
                $request->preferences
            );

            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Update alert preferences failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update alert preferences: ' . $e->getMessage()
            ], 500);
        }
    }
}