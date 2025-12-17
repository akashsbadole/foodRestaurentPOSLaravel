<?php

namespace App\Http\Controllers\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantInvoice;
use App\Services\Restaurant\BillingCalculationService;
use App\Services\Restaurant\TaxConfigurationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    protected BillingCalculationService $billingService;
    protected TaxConfigurationService $taxService;

    public function __construct(
        BillingCalculationService $billingService,
        TaxConfigurationService $taxService
    ) {
        $this->billingService = $billingService;
        $this->taxService = $taxService;
        
        // Apply middleware for permissions
        $this->middleware('permission:restaurant.orders.view')->only(['index', 'show', 'billingPreview', 'billingHistory']);
        $this->middleware('permission:restaurant.orders.create')->only(['create', 'store']);
        $this->middleware('permission:restaurant.orders.update')->only(['update', 'applyDiscount', 'calculateSplitBilling']);
        $this->middleware('permission:restaurant.orders.delete')->only(['destroy']);
        $this->middleware('permission:restaurant.billing.calculate')->only(['calculateBilling', 'calculateTaxes']);
        $this->middleware('permission:restaurant.billing.invoice')->only(['generateInvoice', 'issueInvoice']);
        $this->middleware('permission:restaurant.billing.manage')->only(['voidInvoice', 'refundInvoice']);
    }

    /**
     * Show form for creating a new order.
     */
    public function create()
    {
        return inertia('Restaurant/Orders/Create', [
            'currentStore' => request()->user()?->store,
        ]);
    }

    /**
     * Display a listing of the orders.
     */
    public function index(Request $request): JsonResponse
    {
        $query = RestaurantOrder::with(['table', 'items.product', 'customer'])
            ->byStore($request->user()->store_id);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by table
        if ($request->has('table_id')) {
            $query->where('table_id', $request->table_id);
        }

        // Filter by date range
        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $orders = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($orders);
    }

    /**
     * Store a newly created order.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'table_id' => 'required|exists:restaurant_tables,id',
            'customer_id' => 'nullable|exists:contacts,id',
            'order_type' => 'required|in:dine_in,takeaway,delivery',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.modifiers' => 'nullable|array',
            'items.*.modifiers.*.modifier_id' => 'required|exists:menu_modifiers,id',
            'items.*.modifiers.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            $order = DB::transaction(function () use ($validated, $request) {
                $order = RestaurantOrder::create([
                    'store_id' => $request->user()->store_id,
                    'table_id' => $validated['table_id'],
                    'customer_id' => $validated['customer_id'] ?? null,
                    'order_type' => $validated['order_type'],
                    'status' => 'pending',
                    'notes' => $validated['notes'] ?? null,
                    'created_by' => Auth::id(),
                ]);

                foreach ($validated['items'] as $item) {
                    $orderItem = $order->items()->create([
                        'product_id' => $item['product_id'],
                        'quantity' => $item['quantity'],
                        'price' => $item['price'],
                        'total' => $item['quantity'] * $item['price'],
                        'status' => 'pending',
                    ]);

                    // Add modifiers if any
                    if (isset($item['modifiers'])) {
                        foreach ($item['modifiers'] as $modifier) {
                            $orderItem->modifiers()->create([
                                'modifier_id' => $modifier['modifier_id'],
                                'quantity' => $modifier['quantity'],
                            ]);
                        }
                    }
                }

                // Update table status
                if ($order->table) {
                    $order->table->update(['status' => 'occupied']);
                }

                return $order;
            });

            return response()->json($order->load(['items.product', 'items.modifiers.modifier', 'table', 'customer']), 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create order: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified order.
     */
    public function show(RestaurantOrder $order): JsonResponse
    {
        $order->load([
            'items.product',
            'items.modifiers.modifier',
            'table',
            'customer',
            'splits',
            'modifications',
            'invoices'
        ]);

        return response()->json($order);
    }

    /**
     * Update the specified order.
     */
    public function update(Request $request, RestaurantOrder $order): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:contacts,id',
            'notes' => 'nullable|string',
        ]);

        $order->update($validated);

        return response()->json($order->fresh(['customer']));
    }

    /**
     * Remove the specified order.
     */
    public function destroy(RestaurantOrder $order): JsonResponse
    {
        try {
            DB::transaction(function () use ($order) {
                // Update table status if order has a table
                if ($order->table) {
                    $order->table->update(['status' => 'available']);
                }

                $order->delete();
            });

            return response()->json(['message' => 'Order deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete order: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Calculate billing for an order.
     */
    public function calculateBilling(Request $request, RestaurantOrder $order): JsonResponse
    {
        $validated = $request->validate([
            'discounts' => 'nullable|array',
            'discounts.*.type' => 'required|in:percentage,fixed,promotional',
            'discounts.*.value' => 'required|numeric|min:0',
            'discounts.*.reason' => 'nullable|string',
            'service_charges' => 'nullable|array',
            'service_charges.*.type' => 'required|in:percentage,fixed',
            'service_charges.*.value' => 'required|numeric|min:0',
            'service_charges.*.name' => 'required|string',
            'tax_inclusive' => 'boolean',
            'rounding_rule' => 'nullable|in:nearest_0.05,nearest_0.10,nearest_1.00,always_up,always_down,standard',
        ]);

        try {
            $billingData = $this->billingService->calculateOrderBilling($order, $validated);

            return response()->json($billingData);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to calculate billing: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Preview billing for an order without saving.
     */
    public function billingPreview(Request $request, RestaurantOrder $order): JsonResponse
    {
        $validated = $request->validate([
            'discounts' => 'nullable|array',
            'discounts.*.type' => 'required|in:percentage,fixed,promotional',
            'discounts.*.value' => 'required|numeric|min:0',
            'discounts.*.reason' => 'nullable|string',
            'service_charges' => 'nullable|array',
            'service_charges.*.type' => 'required|in:percentage,fixed',
            'service_charges.*.value' => 'required|numeric|min:0',
            'service_charges.*.name' => 'required|string',
            'tax_inclusive' => 'boolean',
            'rounding_rule' => 'nullable|in:nearest_0.05,nearest_0.10,nearest_1.00,always_up,always_down,standard',
        ]);

        try {
            $previewData = $this->billingService->previewBilling($order, $validated);

            return response()->json($previewData);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to preview billing: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Apply discount to an order.
     */
    public function applyDiscount(Request $request, RestaurantOrder $order): JsonResponse
    {
        $validated = $request->validate([
            'discount_type' => 'required|in:percentage,fixed,promotional',
            'discount_value' => 'required|numeric|min:0',
            'discount_reason' => 'nullable|string',
            'auto_apply' => 'boolean',
        ]);

        try {
            $discountData = [
                'type' => $validated['discount_type'],
                'value' => $validated['discount_value'],
                'reason' => $validated['discount_reason'] ?? null,
                'applied_by' => Auth::id(),
            ];

            $result = $order->applyDiscount($discountData);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to apply discount: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Calculate taxes for an order.
     */
    public function calculateTaxes(Request $request, RestaurantOrder $order): JsonResponse
    {
        $validated = $request->validate([
            'tax_codes' => 'nullable|array',
            'tax_codes.*' => 'string',
            'location_code' => 'nullable|string',
            'customer_type' => 'nullable|in:individual,business,tax_exempt',
        ]);

        try {
            $context = [
                'store_id' => $order->store_id,
                'order_type' => $order->order_type,
                'location_code' => $validated['location_code'] ?? null,
                'customer_type' => $validated['customer_type'] ?? 'individual',
            ];

            $taxes = $this->taxService->calculateTaxes($order->subtotal, $context);

            return response()->json([
                'taxes' => $taxes,
                'total_tax' => array_sum(array_column($taxes, 'amount')),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to calculate taxes: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Generate invoice for an order.
     */
    public function generateInvoice(Request $request, RestaurantOrder $order): JsonResponse
    {
        $validated = $request->validate([
            'invoice_type' => 'nullable|in:standard,split,modified',
            'billing_data' => 'nullable|array',
            'customer_details' => 'nullable|array',
            'notes' => 'nullable|string',
        ]);

        try {
            $invoice = $order->generateInvoice($validated);

            return response()->json($invoice->load(['order', 'sale']));
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to generate invoice: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Issue an invoice.
     */
    public function issueInvoice(Request $request, RestaurantInvoice $invoice): JsonResponse
    {
        $validated = $request->validate([
            'due_date' => 'nullable|date',
            'payment_method' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        try {
            $result = $invoice->issue($validated);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to issue invoice: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Calculate split billing for an order.
     */
    public function calculateSplitBilling(Request $request, RestaurantOrder $order): JsonResponse
    {
        $validated = $request->validate([
            'split_type' => 'required|in:equal,percentage,custom,item_based',
            'splits' => 'required|array|min:2',
            'splits.*.name' => 'required|string',
            'splits.*.percentage' => 'required_if:split_type,percentage|numeric|min:0|max:100',
            'splits.*.amount' => 'required_if:split_type,custom|numeric|min:0',
            'splits.*.items' => 'required_if:split_type,item_based|array',
            'splits.*.items.*' => 'exists:restaurant_order_items,id',
        ]);

        try {
            $splitData = $this->billingService->calculateSplitBilling($order, $validated);

            return response()->json($splitData);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to calculate split billing: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get billing history for an order.
     */
    public function billingHistory(RestaurantOrder $order): JsonResponse
    {
        $invoices = $order->invoices()
            ->with(['order', 'sale'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'invoices' => $invoices,
            'total_invoices' => $invoices->count(),
            'total_amount' => $invoices->sum('final_total'),
        ]);
    }

    /**
     * Void an invoice.
     */
    public function voidInvoice(Request $request, RestaurantInvoice $invoice): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string',
        ]);

        try {
            $result = $invoice->void($validated['reason'], Auth::id());

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to void invoice: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Refund an invoice.
     */
    public function refundInvoice(Request $request, RestaurantInvoice $invoice): JsonResponse
    {
        $validated = $request->validate([
            'refund_amount' => 'required|numeric|min:0|max:' . $invoice->amount_paid,
            'reason' => 'required|string',
            'refund_method' => 'nullable|string',
        ]);

        try {
            $result = $invoice->refund(
                $validated['refund_amount'],
                $validated['reason'],
                Auth::id(),
                $validated['refund_method'] ?? null
            );

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to refund invoice: ' . $e->getMessage()], 500);
        }
    }
}