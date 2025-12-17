<?php

namespace App\Http\Controllers;

use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantOrderItem;
use App\Models\Restaurant\RestaurantOrderItemModifier;
use App\Models\Restaurant\OrderSplit;
use App\Models\Restaurant\OrderSplitItem;
use App\Models\Restaurant\MenuModifier;
use App\Models\Restaurant\RestaurantTable;
use App\Models\Sale;
use App\Models\Contact;
use App\Models\Store;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;

class OrderController extends Controller
{
    /**
     * Display orders page
     */
    public function index()
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $currentStore = Store::find($storeId);

        if (!$currentStore) {
            return redirect()->route('store');
        }

        $date = request('date', now()->toDateString());
        $status = request('status', 'all');
        
        $query = RestaurantOrder::with(['table', 'waiter', 'items.product'])
            ->forStore($storeId)
            ->whereDate('order_date', $date);

        if ($status !== 'all') {
            $query->byStatus($status);
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        return Inertia::render('Restaurant/Orders/Index', [
            'currentStore' => $currentStore,
            'orders' => $orders,
            'selectedDate' => $date,
            'selectedStatus' => $status,
        ]);
    }

    /**
     * Display order details
     */
    public function show($id)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $currentStore = Store::find($storeId);

        if (!$currentStore) {
            return redirect()->route('store');
        }

        $order = RestaurantOrder::with([
            'table.section',
            'waiter',
            'items' => function($query) {
                $query->with(['product', 'modifiers.modifier']);
            },
            'splits.items.orderItem',
            'sale'
        ])->forStore($storeId)->findOrFail($id);

        return Inertia::render('Restaurant/Orders/Show', [
            'currentStore' => $currentStore,
            'order' => $order,
        ]);
    }

    /**
     * Create a new order
     */
    public function create()
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $currentStore = Store::find($storeId);

        if (!$currentStore) {
            return redirect()->route('store');
        }

        $tables = RestaurantTable::forStore($storeId)
            ->available()
            ->with(['section'])
            ->orderBy('table_number')
            ->get();

        $customers = Contact::customers()
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'email']);

        return Inertia::render('Restaurant/Orders/Create', [
            'currentStore' => $currentStore,
            'tables' => $tables,
            'customers' => $customers,
        ]);
    }

    /**
     * Store a new order
     */
    public function store(Request $request)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

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

        DB::beginTransaction();
        try {
            // Generate order number
            $orderNumber = $this->generateOrderNumber();

            // Create restaurant order
            $order = RestaurantOrder::create([
                'order_number' => $orderNumber,
                'table_id' => $request->input('table_id'),
                'order_type' => $request->input('order_type'),
                'customer_count' => $request->input('customer_count'),
                'waiter_id' => $request->input('waiter_id', Auth::id()),
                'status' => 'pending',
                'priority' => $request->input('priority', 'normal'),
                'special_instructions' => $request->input('special_instructions'),
                'estimated_time' => $request->input('estimated_time'),
                'order_date' => now()->toDateString(),
                'order_time' => now(),
                'store_id' => $storeId,
                'created_by' => Auth::id(),
            ]);

            // Update table status if dine-in
            if ($request->input('order_type') === 'dine_in' && $request->input('table_id')) {
                $table = RestaurantTable::find($request->input('table_id'));
                if ($table) {
                    $table->markAsOccupied($order->id);
                }
            }

            // Create order items
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

                // Add modifiers if any
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

            // Calculate totals
            $order->subtotal = $subtotal;
            $order->tax_amount = $order->calculateTax();
            $order->service_charge = $order->calculateServiceCharge();
            $order->total_amount = $order->subtotal + 
                               $order->tax_amount + 
                               $order->service_charge;
            $order->save();

            // Create sale record
            $sale = Sale::create([
                'store_id' => $storeId,
                'contact_id' => $request->input('contact_id'),
                'sale_date' => now()->toDateString(),
                'sale_time' => now()->format('H:i:s'),
                'total_amount' => $order->total_amount,
                'discount' => 0,
                'amount_received' => 0,
                'profit_amount' => 0,
                'status' => 'pending',
                'payment_status' => 'pending',
                'note' => "Restaurant Order #{$order->order_number}",
                'created_by' => Auth::id(),
                'cart_snapshot' => json_encode($request->input('items')),
            ]);

            // Link restaurant order to sale
            $order->sale_id = $sale->id;
            $order->save();

            DB::commit();

            return response()->json([
                'message' => 'Order created successfully',
                'order' => $order->load(['table', 'waiter', 'items.product']),
                'sale_id' => $sale->id,
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
     * Update order
     */
    public function update(Request $request, $id)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $order = RestaurantOrder::forStore($storeId)->findOrFail($id);

        // Check if order can be modified
        if (!$order->canBeModified()) {
            return response()->json([
                'message' => 'Order cannot be modified',
                'error' => 'Order is in ' . $order->status . ' status'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'customer_count' => 'nullable|integer|min:1|max:50',
            'waiter_id' => 'nullable|exists:users,id',
            'priority' => 'nullable|in:low,normal,high,urgent',
            'special_instructions' => 'nullable|string|max:1000',
            'estimated_time' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }

        try {
            $order->update([
                'customer_count' => $request->input('customer_count', $order->customer_count),
                'waiter_id' => $request->input('waiter_id', $order->waiter_id),
                'priority' => $request->input('priority', $order->priority),
                'special_instructions' => $request->input('special_instructions', $order->special_instructions),
                'estimated_time' => $request->input('estimated_time', $order->estimated_time),
            ]);

            return response()->json([
                'message' => 'Order updated successfully',
                'order' => $order->load(['table', 'waiter'])
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update order', [
                'error' => $e->getMessage(),
                'order_id' => $id,
                'request' => $request->all()
            ]);

            return response()->json([
                'message' => 'Failed to update order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update order status
     */
    public function updateStatus(Request $request, $id)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

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
                'order' => $order->load(['table', 'waiter'])
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
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

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
                'order_item' => $orderItem->load(['product', 'modifiers.modifier']),
                'order' => $order->load(['items.product'])
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
     * Update order item
     */
    public function updateItem(Request $request, $orderId, $itemId)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $order = RestaurantOrder::forStore($storeId)->findOrFail($orderId);
        $orderItem = RestaurantOrderItem::where('order_id', $orderId)->findOrFail($itemId);

        // Check if order can be modified
        if (!$order->canBeModified()) {
            return response()->json([
                'message' => 'Order cannot be modified',
                'error' => 'Order is in ' . $order->status . ' status'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'quantity' => 'required|numeric|min:0.01',
            'unit_price' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'special_instructions' => 'nullable|string|max:500',
            'status' => 'nullable|in:pending,confirmed,preparing,ready,served,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }

        try {
            $orderItem->update([
                'quantity' => $request->input('quantity'),
                'unit_price' => $request->input('unit_price'),
                'discount' => $request->input('discount') ?? 0,
                'special_instructions' => $request->input('special_instructions') ?? $orderItem->special_instructions,
                'status' => $request->input('status', $orderItem->status),
            ]);

            // Recalculate order totals
            $order->calculateTotals();

            return response()->json([
                'message' => 'Order item updated',
                'order_item' => $orderItem->load(['product', 'modifiers.modifier']),
                'order' => $order->load(['items.product'])
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update order item', [
                'error' => $e->getMessage(),
                'order_id' => $orderId,
                'item_id' => $itemId,
                'request' => $request->all()
            ]);

            return response()->json([
                'message' => 'Failed to update order item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove item from order
     */
    public function removeItem($orderId, $itemId)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

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
            // Delete modifiers first
            $orderItem->modifiers()->delete();
            
            // Delete the order item
            $orderItem->delete();

            // Recalculate order totals
            $order->calculateTotals();

            return response()->json([
                'message' => 'Item removed from order',
                'order' => $order->load(['items.product'])
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
     * Split order
     */
    public function splitOrder(Request $request, $id)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $order = RestaurantOrder::forStore($storeId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'split_type' => 'required|in:equal,custom,item,percentage',
            'split_count' => 'required|integer|min:2|max:20',
            'splits' => 'required|array|min:2',
            'splits.*.split_number' => 'required|integer|min:1',
            'splits.*.contact_id' => 'nullable|exists:contacts,id',
            'splits.*.items' => 'required_if:split_type,item|array',
            'splits.*.items.*.order_item_id' => 'required|exists:restaurant_order_items,id',
            'splits.*.items.*.quantity' => 'required|numeric|min:0.01',
            'splits.*.percentage' => 'required_if:split_type,percentage|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }

        DB::beginTransaction();
        try {
            $splits = $request->input('splits');
            $splitType = $request->input('split_type');
            $splitCount = $request->input('split_count');

            // Create order splits
            foreach ($splits as $splitData) {
                $orderSplit = OrderSplit::create([
                    'order_id' => $order->id,
                    'split_type' => $splitType,
                    'split_count' => $splitCount,
                    'split_number' => $splitData['split_number'],
                    'contact_id' => $splitData['contact_id'] ?? null,
                    'status' => 'pending',
                ]);

                // Add items to split based on split type
                if ($splitType === 'item') {
                    foreach ($splitData['items'] as $itemData) {
                        OrderSplitItem::create([
                            'split_id' => $orderSplit->id,
                            'order_item_id' => $itemData['order_item_id'],
                            'quantity' => $itemData['quantity'],
                        ]);
                    }
                }

                $orderSplit->calculateTotals();
            }

            DB::commit();

            return response()->json([
                'message' => 'Order split successfully',
                'order' => $order->load(['splits.items.orderItem'])
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Failed to split order', [
                'error' => $e->getMessage(),
                'order_id' => $id,
                'request' => $request->all()
            ]);

            return response()->json([
                'message' => 'Failed to split order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel order
     */
    public function cancel(Request $request, $id)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $order = RestaurantOrder::forStore($storeId)->findOrFail($id);

        // Check if order can be cancelled
        if (!in_array($order->status, ['pending', 'confirmed'])) {
            return response()->json([
                'message' => 'Order cannot be cancelled',
                'error' => 'Order is in ' . $order->status . ' status'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'cancellation_reason' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }

        try {
            $order->status = 'cancelled';
            $order->special_instructions = ($order->special_instructions ?? '') . 
                                       "\n\nCancelled: " . $request->input('cancellation_reason');
            $order->save();

            // Update table status if dine-in
            if ($order->table) {
                $order->table->markAsAvailable();
            }

            // Update sale status
            if ($order->sale) {
                $order->sale->status = 'cancelled';
                $order->sale->save();
            }

            return response()->json([
                'message' => 'Order cancelled successfully',
                'order' => $order->load(['table', 'waiter'])
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to cancel order', [
                'error' => $e->getMessage(),
                'order_id' => $id,
                'request' => $request->all()
            ]);

            return response()->json([
                'message' => 'Failed to cancel order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get order statistics
     */
    public function getStatistics(Request $request)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $period = $request->input('period', 'month');
        
        // Calculate date range
        $startDate = $this->getStartDate($period);
        $endDate = now();

        $orders = RestaurantOrder::forStore($storeId)
            ->whereBetween('order_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->get();

        // Calculate statistics
        $totalOrders = $orders->count();
        $totalRevenue = $orders->where('status', 'paid')->sum('total_amount');
        $averageOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;
        
        // Orders by type
        $ordersByType = $orders->groupBy('order_type')->map(function($group) {
            return [
                'count' => $group->count(),
                'revenue' => $group->where('status', 'paid')->sum('total_amount'),
            ];
        });

        // Orders by status
        $ordersByStatus = $orders->groupBy('status')->map(function($group) {
            return $group->count();
        });

        // Average preparation time
        $avgPreparationTime = $orders
            ->whereNotNull('completed_at')
            ->map(function($order) {
                return $order->created_at->diffInMinutes($order->completed_at);
            })
            ->avg();

        return response()->json([
            'period' => $period,
            'startDate' => $startDate->toDateString(),
            'endDate' => $endDate->toDateString(),
            'summary' => [
                'totalOrders' => $totalOrders,
                'totalRevenue' => $totalRevenue,
                'averageOrderValue' => $averageOrderValue,
                'averagePreparationTime' => round($avgPreparationTime ?? 0, 1),
            ],
            'ordersByType' => $ordersByType,
            'ordersByStatus' => $ordersByStatus,
        ]);
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
     * Get start date based on period
     */
    private function getStartDate($period)
    {
        switch ($period) {
            case 'today':
                return now()->startOfDay();
            case 'week':
                return now()->startOfWeek();
            case 'month':
                return now()->startOfMonth();
            case 'year':
                return now()->startOfYear();
            default:
                return now()->startOfMonth();
        }
    }
}