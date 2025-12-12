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

        $orderData = [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'table' => $order->table ? [
                'id' => $order->table->id,
                'table_number' => $order->table->table_number,
                'name' => $order->table->name,
                'section' => $order->table->section ? [
                    'id' => $order->table->section->id,
                    'name' => $order->table->section->name,
                ] : null,
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
            'estimated_time' => $order->estimated_time,
            'actual_time' => $order->actual_time,
            'completed_at' => $order->completed_at,
            'created_at' => $order->created_at,
            'updated_at' => $order->updated_at,
            'items' => $order->items->map(function($item) {
                return [
                    'id' => $item->id,
                    'product' => [
                        'id' => $item->product->id,
                        'name' => $item->product->name,
                        'description' => $item->product->description,
                    ],
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'unit_cost' => $item->unit_cost,
                    'discount' => $item->discount,
                    'status' => $item->status,
                    'special_instructions' => $item->special_instructions,
                    'preparation_notes' => $item->preparation_notes,
                    'course_number' => $item->course_number,
                    'is_complimentary' => $item->is_complimentary,
                    'void_reason' => $item->void_reason,
                    'kitchen_printed' => $item->kitchen_printed,
                    'kitchen_printed_at' => $item->kitchen_printed_at,
                    'served_by' => $item->served_by,
                    'served_at' => $item->served_at,
                    'subtotal' => $item->calculateSubtotal(),
                    'modifiers' => $item->modifiers->map(function($modifier) {
                        return [
                            'id' => $modifier->id,
                            'modifier' => [
                                'id' => $modifier->modifier->id,
                                'name' => $modifier->modifier->name,
                                'description' => $modifier->modifier->description,
                            ],
                            'quantity' => $modifier->quantity,
                            'price_adjustment' => $modifier->price_adjustment,
                        ];
                    }),
                ];
            }),
            'splits' => $order->splits->map(function($split) {
                return [
                    'id' => $split->id,
                    'split_type' => $split->split_type,
                    'split_count' => $split->split_count,
                    'split_number' => $split->split_number,
                    'contact' => $split->contact ? [
                        'id' => $split->contact->id,
                        'name' => $split->contact->name,
                    ] : null,
                    'subtotal' => $split->subtotal,
                    'tax_amount' => $split->tax_amount,
                    'service_charge' => $split->service_charge,
                    'discount_amount' => $split->discount_amount,
                    'total_amount' => $split->total_amount,
                    'paid_amount' => $split->paid_amount,
                    'status' => $split->status,
                    'items' => $split->items->map(function($item) {
                        return [
                            'id' => $item->id,
                            'order_item' => [
                                'id' => $item->orderItem->id,
                                'product_name' => $item->orderItem->product->name,
                            ],
                            'quantity' => $item->quantity,
                        ];
                    }),
                ];
            }),
        ];

        return response()->json($orderData);
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

            DB::commit();

            return response()->json([
                'message' => 'Order created successfully',
                'order' => $order->load(['table', 'waiter', 'items.product']),
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
            // Delete modifiers first
            $orderItem->modifiers()->delete();
            
            // Delete order item
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
     * Get store ID from request or authenticated user
     */
    private function getStoreId()
    {
        return request('store_id') 
            ?? session('store_id') 
            ?? (Auth::user() ? Auth::user()->store_id : 1);
    }
}