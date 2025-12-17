<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantOrderItem;
use App\Models\Restaurant\RestaurantOrderItemModifier;
use App\Models\Restaurant\OrderSplit;
use App\Models\Restaurant\OrderSplitItem;
use App\Models\Product;
use App\Models\Contact;
use App\Models\ProductStock;
use App\Models\Restaurant\MenuModifier;
use App\Models\Restaurant\RestaurantTable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;

class OrderController extends Controller
{
    /**
     * Get orders with filtering
     */
    public function index(Request $request)
    {
        $storeId = $this->getStoreId();
        
        $validator = Validator::make($request->all(), [
            'date' => 'nullable|date',
            'status' => 'nullable|in:pending,confirmed,preparing,ready,served,completed,cancelled',
            'table_id' => 'nullable|exists:restaurant_tables,id',
            'waiter_id' => 'nullable|exists:users,id',
            'limit' => 'nullable|integer|min:1|max:100',
            'offset' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }

        $query = RestaurantOrder::with(['table', 'waiter', 'items.product'])
            ->forStore($storeId);

        // Apply filters
        if ($request->has('date')) {
            $query->whereDate('order_date', $request->input('date'));
        }

        if ($request->has('status')) {
            $query->byStatus($request->input('status'));
        }

        if ($request->has('table_id')) {
            $query->where('table_id', $request->input('table_id'));
        }

        if ($request->has('waiter_id')) {
            $query->where('waiter_id', $request->input('waiter_id'));
        }

        // Apply pagination
        $limit = $request->input('limit', 50);
        $offset = $request->input('offset', 0);
        
        $orders = $query->orderBy('created_at', 'desc')
            ->offset($offset)
            ->limit($limit)
            ->get()
            ->map(function($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'table' => $order->table ? [
                        'id' => $order->table->id,
                        'table_number' => $order->table->table_number,
                        'name' => $order->table->name,
                        'status' => $order->table->status,
                    ] : null,
                    'order_type' => $order->order_type,
                    'status' => $order->status,
                    'priority' => $order->priority,
                    'customer_count' => $order->customer_count,
                    'waiter' => $order->waiter ? [
                        'id' => $order->waiter->id,
                        'name' => $order->waiter->name,
                    ] : null,
                    'subtotal' => $order->subtotal,
                    'tax_amount' => $order->tax_amount,
                    'service_charge' => $order->service_charge,
                    'discount_amount' => $order->discount_amount,
                    'total_amount' => $order->total_amount,
                    'order_date' => $order->order_date,
                    'order_time' => $order->order_time,
                    'special_instructions' => $order->special_instructions,
                    'items_count' => $order->items->count(),
                    'created_at' => $order->created_at,
                    'completed_at' => $order->completed_at,
                ];
            });

        // Get total count for pagination
        $total = $query->count();

        return response()->json([
            'orders' => $orders,
            'pagination' => [
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset,
                'has_more' => ($offset + $limit) < $total,
            ],
        ]);
    }

    /**
     * Get order details
     */
    public function show($id)
    {
        $storeId = $this->getStoreId();
        
        $order = RestaurantOrder::with([
            'table.section',
            'waiter',
            'items' => function($query) {
                $query->with(['product', 'modifiers.modifier']);
            },
            'splits.items.orderItem',
            'sale'
        ])->forStore($storeId)->findOrFail($id);

        return response()->json($order->toDetailedArray());
    }

    /**
     * Create a new order
     */
    public function store(Request $request)
    {
        $storeId = $this->getStoreId();

        $validator = Validator::make($request->all(), [
            'table_id' => 'nullable|exists:restaurant_tables,id',
            'order_type' => 'required|in:dine_in,takeaway,delivery',
            'customer_count' => 'required|integer|min:1|max:50',
            'waiter_id' => 'nullable|exists:users,id',
            'contact_id' => 'nullable|exists:contacts,id',
            'priority' => 'nullable|in:low,normal,high,urgent',
            'special_instructions' => 'nullable|string|max:1000',
            'estimated_time' => 'nullable|integer|min:1',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'items.*.special_instructions' => 'nullable|string|max:500',
            'items.*.modifiers' => 'nullable|array',
            'items.*.modifiers.*.modifier_id' => 'required|exists:menu_modifiers,id',
            'items.*.modifiers.*.quantity' => 'required|numeric|min:0.01',
            'items.*.modifiers.*.price_adjustment' => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }

        // Additional validation for table availability
        $tableValidation = $this->validateTableAvailability(
            $request->input('table_id'), 
            $request->input('customer_count'), 
            $request->input('order_type')
        );
        
        if (!$tableValidation['valid']) {
            return response()->json([
                'message' => 'Table not available',
                'error' => $tableValidation['message']
            ], 422);
        }

        // Validate product availability and stock
        $productValidation = $this->validateProductAvailability(
            $request->input('items'), 
            $storeId
        );
        
        if (!$productValidation['valid']) {
            return response()->json([
                'message' => 'Product not available',
                'error' => $productValidation['message']
            ], 422);
        }

        // Validate modifier combinations
        $modifierValidation = $this->validateModifiers($request->input('items'));
        
        if (!$modifierValidation['valid']) {
            return response()->json([
                'message' => 'Invalid modifiers',
                'error' => $modifierValidation['message']
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Use lockForUpdate to prevent concurrent order creation conflicts
            $orderNumber = $this->generateOrderNumberWithLock();

            // Create restaurant order with enhanced validation
            $order = RestaurantOrder::create([
                'order_number' => $orderNumber,
                'table_id' => $request->input('table_id'),
                'order_type' => $request->input('order_type'),
                'customer_count' => $request->input('customer_count'),
                'waiter_id' => $request->input('waiter_id', Auth::id()),
                'status' => 'pending', // Proper order status initialization
                'priority' => $request->input('priority', 'normal'),
                'special_instructions' => $request->input('special_instructions'),
                'estimated_time' => $request->input('estimated_time'),
                'order_date' => now()->toDateString(),
                'order_time' => now(),
                'store_id' => $storeId,
                'created_by' => Auth::id(),
            ]);

            // Update table status if dine-in with proper error handling
            if ($request->input('order_type') === 'dine_in' && $request->input('table_id')) {
                $table = RestaurantTable::find($request->input('table_id'));
                if ($table && $table->isAvailable()) {
                    $table->markAsOccupied($order->id);
                } else {
                    throw new \Exception('Table became unavailable during order creation');
                }
            }

            // Create order items with stock reservation
            $subtotal = 0;
            foreach ($request->input('items') as $itemData) {
                $orderItem = RestaurantOrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $itemData['product_id'],
                    'batch_id' => $itemData['batch_id'] ?? null,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'unit_cost' => $itemData['unit_cost'],
                    'discount' => $itemData['discount'] ?? 0,
                    'status' => 'pending',
                    'special_instructions' => $itemData['special_instructions'] ?? null,
                    'preparation_notes' => $itemData['preparation_notes'] ?? null,
                    'course_number' => $itemData['course_number'] ?? 1,
                    'is_complimentary' => $itemData['is_complimentary'] ?? false,
                ]);

                // Reserve stock for products with stock management
                $product = Product::find($itemData['product_id']);
                if ($product && $product->is_stock_managed) {
                    $orderItem->reserveStock($storeId, $itemData['quantity']);
                }

                // Add modifiers with validation
                if (isset($itemData['modifiers']) && !empty($itemData['modifiers'])) {
                    foreach ($itemData['modifiers'] as $modifierData) {
                        RestaurantOrderItemModifier::create([
                            'order_item_id' => $orderItem->id,
                            'modifier_id' => $modifierData['modifier_id'],
                            'quantity' => $modifierData['quantity'],
                            'price_adjustment' => $modifierData['price_adjustment'],
                        ]);
                    }
                }

                $subtotal += $orderItem->calculateSubtotal();
            }

            // Calculate initial order totals
            $order->calculateInitialTotals($subtotal);

            DB::commit();

            return response()->json([
                'message' => 'Order created successfully',
                'order' => $order->toDetailedArray(),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to create order', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'message' => 'Failed to create order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update order status
     */
    public function updateStatus(Request $request, $id)
    {
        $storeId = $this->getStoreId();

        $order = RestaurantOrder::forStore($storeId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,confirmed,preparing,ready,served,completed,cancelled',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }

        try {
            $newStatus = $request->input('status');

            // Validate status transitions
            if (!$this->isValidStatusTransition($order->status, $newStatus)) {
                return response()->json([
                    'message' => 'Invalid status transition',
                    'error' => "Cannot change status from {$order->status} to {$newStatus}"
                ], 422);
            }

            // Handle specific status changes
            switch ($newStatus) {
                case 'confirmed':
                    $order->markAsConfirmed();
                    break;
                case 'completed':
                    $order->markAsCompleted();
                    break;
                default:
                    $order->status = $newStatus;
                    $order->save();
            }

            if ($request->has('notes')) {
                $order->special_instructions = $request->input('notes');
                $order->save();
            }

            return response()->json([
                'message' => 'Order status updated successfully',
                'order' => $order->toDetailedArray()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update order status', [
                'error' => $e->getMessage(),
                'order_id' => $id,
                'request' => $request->all()
            ]);

            return response()->json([
                'message' => 'Failed to update order status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add item to order
     */
    public function addItem(Request $request, $id)
    {
        $storeId = $this->getStoreId();

        $order = RestaurantOrder::forStore($storeId)->findOrFail($id);

        // Check if order can be modified
        if (!$order->canBeModified()) {
            return response()->json([
                'message' => 'Order cannot be modified',
                'error' => 'Order is in ' . $order->status . ' status'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:0.01',
            'unit_price' => 'required|numeric|min:0',
            'unit_cost' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'special_instructions' => 'nullable|string|max:500',
            'modifiers' => 'nullable|array',
            'modifiers.*.modifier_id' => 'required|exists:menu_modifiers,id',
            'modifiers.*.quantity' => 'required|numeric|min:0.01',
            'modifiers.*.price_adjustment' => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }

        try {
            $orderItem = RestaurantOrderItem::create([
                'order_id' => $order->id,
                'product_id' => $request->input('product_id'),
                'batch_id' => $request->input('batch_id') ?? null,
                'quantity' => $request->input('quantity'),
                'unit_price' => $request->input('unit_price'),
                'unit_cost' => $request->input('unit_cost'),
                'discount' => $request->input('discount') ?? 0,
                'status' => 'pending',
                'special_instructions' => $request->input('special_instructions') ?? null,
                'preparation_notes' => $request->input('preparation_notes') ?? null,
                'course_number' => $request->input('course_number', 1),
                'is_complimentary' => $request->input('is_complimentary', false),
            ]);

            // Reserve stock for products with stock management
            $product = Product::find($request->input('product_id'));
            if ($product && $product->is_stock_managed) {
                $orderItem->reserveStock($storeId, $request->input('quantity'));
            }

            // Add modifiers if any
            if ($request->has('modifiers') && !empty($request->input('modifiers'))) {
                foreach ($request->input('modifiers') as $modifierData) {
                    RestaurantOrderItemModifier::create([
                        'order_item_id' => $orderItem->id,
                        'modifier_id' => $modifierData['modifier_id'],
                        'quantity' => $modifierData['quantity'],
                        'price_adjustment' => $modifierData['price_adjustment'],
                    ]);
                }
            }

            // Recalculate order totals
            $order->calculateTotals();

            return response()->json([
                'message' => 'Item added to order',
                'order_item' => $orderItem->toDetailedArray(),
                'order' => $order->toDetailedArray()
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to add item to order', [
                'error' => $e->getMessage(),
                'order_id' => $id,
                'request' => $request->all()
            ]);

            return response()->json([
                'message' => 'Failed to add item to order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove item from order
     */
    public function removeItem($orderId, $itemId)
    {
        $storeId = $this->getStoreId();

        $order = RestaurantOrder::forStore($storeId)->findOrFail($orderId);
        $orderItem = RestaurantOrderItem::where('order_id', $orderId)->findOrFail($itemId);

        // Check if order can be modified
        if (!$order->canBeModified()) {
            return response()->json([
                'message' => 'Order cannot be modified',
                'error' => 'Order is in ' . $order->status . ' status'
            ], 422);
        }

        try {
            // Release reserved stock
            $product = Product::find($orderItem->product_id);
            if ($product && $product->is_stock_managed) {
                $orderItem->releaseStock($storeId, $orderItem->quantity);
            }

            // Delete modifiers first
            $orderItem->modifiers()->delete();
            
            // Delete order item
            $orderItem->delete();

            // Recalculate order totals
            $order->calculateTotals();

            return response()->json([
                'message' => 'Item removed from order',
                'order' => $order->toDetailedArray()
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to remove order item', [
                'error' => $e->getMessage(),
                'order_id' => $orderId,
                'item_id' => $itemId
            ]);

            return response()->json([
                'message' => 'Failed to remove item from order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate unique order number
     */
    private function generateOrderNumber()
    {
        $prefix = 'ORD';
        $date = now()->format('Ymd');
        $lastOrder = RestaurantOrder::whereDate('created_at', today())
            ->orderBy('created_at', 'desc')
            ->first();

        $sequence = $lastOrder ? intval(substr($lastOrder->order_number, -4)) + 1 : 1;
        
        return $prefix . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Generate unique order number with locking for concurrent order creation
     */
    private function generateOrderNumberWithLock()
    {
        $prefix = 'ORD';
        $date = now()->format('Ymd');
        
        return DB::transaction(function() use ($prefix, $date) {
            $lastOrder = RestaurantOrder::whereDate('created_at', today())
                ->lockForUpdate()
                ->orderBy('created_at', 'desc')
                ->first();

            $sequence = $lastOrder ? intval(substr($lastOrder->order_number, -4)) + 1 : 1;
            
            return $prefix . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
        });
    }

    /**
     * Validate table availability for order
     */
    private function validateTableAvailability($tableId, $customerCount, $orderType)
    {
        if ($orderType !== 'dine_in' || !$tableId) {
            return ['valid' => true];
        }

        $table = RestaurantTable::find($tableId);
        if (!$table) {
            return ['valid' => false, 'message' => 'Table not found'];
        }
        
        if (!$table->isAvailable()) {
            return ['valid' => false, 'message' => 'Table is currently occupied or reserved'];
        }
        
        if (!$table->canSeat($customerCount)) {
            return ['valid' => false, 'message' => "Table cannot accommodate {$customerCount} customers"];
        }
        
        return ['valid' => true];
    }

    /**
     * Validate product availability and stock
     */
    private function validateProductAvailability($items, $storeId)
    {
        $productIds = collect($items)->pluck('product_id');
        $products = Product::whereIn('id', $productIds)->get()->keyBy('id');
        
        foreach ($items as $itemData) {
            $product = $products->get($itemData['product_id']);
            if (!$product || !$product->is_active) {
                return ['valid' => false, 'message' => 'One or more products are not available or inactive'];
            }
            
            // Check stock for products with stock management
            if ($product->is_stock_managed) {
                $stock = ProductStock::where('product_id', $itemData['product_id'])
                    ->where('store_id', $storeId)
                    ->sum('quantity');
                
                if ($stock < $itemData['quantity']) {
                    return [
                        'valid' => false, 
                        'message' => "Product '{$product->name}' has insufficient stock. Available: {$stock}, Requested: {$itemData['quantity']}"
                    ];
                }
            }
        }
        
        return ['valid' => true];
    }

    /**
     * Validate modifier combinations
     */
    private function validateModifiers($items)
    {
        foreach ($items as $itemData) {
            if (isset($itemData['modifiers']) && !empty($itemData['modifiers'])) {
                $modifierIds = collect($itemData['modifiers'])->pluck('modifier_id');
                $modifiers = MenuModifier::whereIn('id', $modifierIds)->active()->get();
                
                if ($modifiers->count() !== $modifierIds->count()) {
                    return ['valid' => false, 'message' => 'One or more selected modifiers are not available'];
                }
            }
        }
        
        return ['valid' => true];
    }

    /**
     * Validate status transitions
     */
    private function isValidStatusTransition($currentStatus, $newStatus)
    {
        $validTransitions = [
            'pending' => ['confirmed', 'cancelled'],
            'confirmed' => ['preparing', 'cancelled'],
            'preparing' => ['ready', 'cancelled'],
            'ready' => ['served', 'cancelled'],
            'served' => ['completed'],
            'completed' => [],
            'cancelled' => [],
        ];

        return in_array($newStatus, $validTransitions[$currentStatus] ?? []);
    }

    /**
     * Get store ID from request or authenticated user
     */
    private function getStoreId()
    {
        return request('store_id') 
            ?? session('store_id') 
            ?? (Auth::user() ? Auth::user()->store_id : 1);
    }
}