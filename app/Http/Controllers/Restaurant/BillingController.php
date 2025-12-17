<?php

namespace App\Http\Controllers\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\Restaurant\RestaurantInvoice;
use App\Models\Restaurant\RestaurantOrder;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class BillingController extends Controller
{
    public function __construct()
    {
        // Apply middleware for permissions
        $this->middleware('permission:restaurant.reports.view')->only(['dailyReport', 'periodReport', 'taxReport']);
        $this->middleware('permission:restaurant.analytics.view')->only(['discountAnalytics', 'serviceChargeAnalytics']);
        $this->middleware('permission:restaurant.settings.manage')->only(['getSettings', 'updateSettings', 'resetSettings']);
    }

    /**
     * Generate daily billing report.
     */
    public function dailyReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'store_id' => 'nullable|integer|exists:stores,id',
        ]);

        $storeId = $validated['store_id'] ?? $request->user()->store_id;
        $date = $validated['date'];

        try {
            $report = DB::transaction(function () use ($storeId, $date) {
                // Get orders for the day
                $orders = RestaurantOrder::where('store_id', $storeId)
                    ->whereDate('created_at', $date)
                    ->whereIn('status', ['completed', 'paid'])
                    ->get();

                // Get invoices for the day
                $invoices = RestaurantInvoice::where('store_id', $storeId)
                    ->whereDate('created_at', $date)
                    ->get();

                // Calculate metrics
                $totalOrders = $orders->count();
                $totalRevenue = $orders->sum('final_total');
                $totalTax = $invoices->sum('total_tax');
                $totalDiscounts = $invoices->sum('total_discounts');
                $totalServiceCharges = $invoices->sum('total_service_charges');

                // Order type breakdown
                $orderTypeBreakdown = $orders->groupBy('order_type')->map(function ($typeOrders) {
                    return [
                        'count' => $typeOrders->count(),
                        'revenue' => $typeOrders->sum('final_total'),
                    ];
                });

                // Payment method breakdown
                $paymentBreakdown = $invoices->whereNotNull('payment_method')
                    ->groupBy('payment_method')
                    ->map(function ($methodInvoices) {
                        return [
                            'count' => $methodInvoices->count(),
                            'amount' => $methodInvoices->sum('final_total'),
                        ];
                    });

                // Hourly breakdown
                $hourlyBreakdown = $orders->groupBy(function ($order) {
                    return $order->created_at->format('H:00');
                })->map(function ($hourOrders) {
                    return [
                        'orders' => $hourOrders->count(),
                        'revenue' => $hourOrders->sum('final_total'),
                    ];
                });

                return [
                    'date' => $date,
                    'store_id' => $storeId,
                    'summary' => [
                        'total_orders' => $totalOrders,
                        'total_revenue' => $totalRevenue,
                        'total_tax' => $totalTax,
                        'total_discounts' => $totalDiscounts,
                        'total_service_charges' => $totalServiceCharges,
                        'average_order_value' => $totalOrders > 0 ? $totalRevenue / $totalOrders : 0,
                    ],
                    'breakdowns' => [
                        'order_types' => $orderTypeBreakdown,
                        'payment_methods' => $paymentBreakdown,
                        'hourly' => $hourlyBreakdown,
                    ],
                ];
            });

            return response()->json($report);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to generate daily report: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Generate period billing report.
     */
    public function periodReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'store_id' => 'nullable|integer|exists:stores,id',
            'group_by' => 'nullable|in:day,week,month',
        ]);

        $storeId = $validated['store_id'] ?? $request->user()->store_id;
        $groupBy = $validated['group_by'] ?? 'day';

        try {
            $report = DB::transaction(function () use ($storeId, $validated, $groupBy) {
                $query = RestaurantOrder::where('store_id', $storeId)
                    ->whereBetween('created_at', [$validated['start_date'], $validated['end_date']])
                    ->whereIn('status', ['completed', 'paid']);

                // Group by specified period
                switch ($groupBy) {
                    case 'week':
                        $groupFormat = 'Y-W';
                        break;
                    case 'month':
                        $groupFormat = 'Y-m';
                        break;
                    default: // day
                        $groupFormat = 'Y-m-d';
                        break;
                }

                $groupedOrders = $query->get()->groupBy(function ($order) use ($groupFormat) {
                    return $order->created_at->format($groupFormat);
                });

                $periodData = $groupedOrders->map(function ($periodOrders) use ($groupBy) {
                    $periodInvoices = RestaurantInvoice::whereIn('order_id', $periodOrders->pluck('id'))->get();
                    
                    return [
                        'period' => $periodOrders->first()->created_at->format($groupBy === 'week' ? 'Y-W' : ($groupBy === 'month' ? 'Y-m' : 'Y-m-d')),
                        'orders' => $periodOrders->count(),
                        'revenue' => $periodOrders->sum('final_total'),
                        'tax' => $periodInvoices->sum('total_tax'),
                        'discounts' => $periodInvoices->sum('total_discounts'),
                        'service_charges' => $periodInvoices->sum('total_service_charges'),
                        'average_order_value' => $periodOrders->count() > 0 ? $periodOrders->sum('final_total') / $periodOrders->count() : 0,
                    ];
                });

                // Calculate totals for the entire period
                $totalOrders = $query->count();
                $totalRevenue = $query->sum('final_total');
                $allInvoices = RestaurantInvoice::whereIn('order_id', $query->pluck('id'))->get();
                $totalTax = $allInvoices->sum('total_tax');
                $totalDiscounts = $allInvoices->sum('total_discounts');
                $totalServiceCharges = $allInvoices->sum('total_service_charges');

                return [
                    'period' => [
                        'start_date' => $validated['start_date'],
                        'end_date' => $validated['end_date'],
                        'group_by' => $groupBy,
                    ],
                    'store_id' => $storeId,
                    'summary' => [
                        'total_orders' => $totalOrders,
                        'total_revenue' => $totalRevenue,
                        'total_tax' => $totalTax,
                        'total_discounts' => $totalDiscounts,
                        'total_service_charges' => $totalServiceCharges,
                        'average_order_value' => $totalOrders > 0 ? $totalRevenue / $totalOrders : 0,
                    ],
                    'period_breakdown' => $periodData->values(),
                ];
            });

            return response()->json($report);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to generate period report: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Generate tax report.
     */
    public function taxReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'store_id' => 'nullable|integer|exists:stores,id',
            'tax_type' => 'nullable|string',
        ]);

        $storeId = $validated['store_id'] ?? $request->user()->store_id;

        try {
            $report = DB::transaction(function () use ($storeId, $validated) {
                $invoices = RestaurantInvoice::where('store_id', $storeId)
                    ->whereBetween('created_at', [$validated['start_date'], $validated['end_date']])
                    ->whereNotNull('tax_breakdown')
                    ->get();

                // Aggregate tax data
                $taxBreakdown = [];
                $totalTaxableAmount = 0;
                $totalTaxAmount = 0;

                foreach ($invoices as $invoice) {
                    $taxes = $invoice->tax_breakdown ?? [];
                    
                    foreach ($taxes as $tax) {
                        $taxCode = $tax['code'];
                        $taxType = $tax['type'] ?? 'unknown';
                        
                        if (isset($validated['tax_type']) && $taxType !== $validated['tax_type']) {
                            continue;
                        }

                        if (!isset($taxBreakdown[$taxCode])) {
                            $taxBreakdown[$taxCode] = [
                                'code' => $taxCode,
                                'type' => $taxType,
                                'name' => $tax['name'] ?? $taxCode,
                                'total_amount' => 0,
                                'taxable_amount' => 0,
                                'rate' => $tax['rate'] ?? 0,
                                'invoice_count' => 0,
                            ];
                        }

                        $taxBreakdown[$taxCode]['total_amount'] += $tax['amount'];
                        $taxBreakdown[$taxCode]['taxable_amount'] += $tax['taxable_amount'] ?? 0;
                        $taxBreakdown[$taxCode]['invoice_count']++;
                    }

                    $totalTaxableAmount += $invoice->subtotal;
                    $totalTaxAmount += $invoice->total_tax;
                }

                return [
                    'period' => [
                        'start_date' => $validated['start_date'],
                        'end_date' => $validated['end_date'],
                    ],
                    'store_id' => $storeId,
                    'summary' => [
                        'total_taxable_amount' => $totalTaxableAmount,
                        'total_tax_amount' => $totalTaxAmount,
                        'effective_tax_rate' => $totalTaxableAmount > 0 ? $totalTaxAmount / $totalTaxableAmount : 0,
                    ],
                    'tax_breakdown' => array_values($taxBreakdown),
                ];
            });

            return response()->json($report);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to generate tax report: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Generate discount analytics.
     */
    public function discountAnalytics(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'store_id' => 'nullable|integer|exists:stores,id',
        ]);

        $storeId = $validated['store_id'] ?? $request->user()->store_id;

        try {
            $analytics = DB::transaction(function () use ($storeId, $validated) {
                $invoices = RestaurantInvoice::where('store_id', $storeId)
                    ->whereBetween('created_at', [$validated['start_date'], $validated['end_date']])
                    ->whereNotNull('discounts')
                    ->get();

                // Discount type breakdown
                $discountTypes = [];
                $totalDiscountAmount = 0;
                $discountedOrdersCount = 0;

                foreach ($invoices as $invoice) {
                    $discounts = $invoice->discounts ?? [];
                    
                    foreach ($discounts as $discount) {
                        $type = $discount['type'] ?? 'unknown';
                        
                        if (!isset($discountTypes[$type])) {
                            $discountTypes[$type] = [
                                'type' => $type,
                                'total_amount' => 0,
                                'count' => 0,
                                'average_amount' => 0,
                            ];
                        }

                        $discountTypes[$type]['total_amount'] += $discount['amount'];
                        $discountTypes[$type]['count']++;
                    }

                    $totalDiscountAmount += $invoice->total_discounts;
                    $discountedOrdersCount++;
                }

                // Calculate averages
                foreach ($discountTypes as &$type) {
                    $type['average_amount'] = $type['count'] > 0 ? $type['total_amount'] / $type['count'] : 0;
                }

                // Get total orders for the period
                $totalOrders = RestaurantOrder::where('store_id', $storeId)
                    ->whereBetween('created_at', [$validated['start_date'], $validated['end_date']])
                    ->whereIn('status', ['completed', 'paid'])
                    ->count();

                return [
                    'period' => [
                        'start_date' => $validated['start_date'],
                        'end_date' => $validated['end_date'],
                    ],
                    'store_id' => $storeId,
                    'summary' => [
                        'total_discount_amount' => $totalDiscountAmount,
                        'discounted_orders' => $discountedOrdersCount,
                        'total_orders' => $totalOrders,
                        'discount_penetration_rate' => $totalOrders > 0 ? $discountedOrdersCount / $totalOrders : 0,
                        'average_discount_per_order' => $discountedOrdersCount > 0 ? $totalDiscountAmount / $discountedOrdersCount : 0,
                    ],
                    'discount_types' => array_values($discountTypes),
                ];
            });

            return response()->json($analytics);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to generate discount analytics: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Generate service charge analytics.
     */
    public function serviceChargeAnalytics(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'store_id' => 'nullable|integer|exists:stores,id',
        ]);

        $storeId = $validated['store_id'] ?? $request->user()->store_id;

        try {
            $analytics = DB::transaction(function () use ($storeId, $validated) {
                $invoices = RestaurantInvoice::where('store_id', $storeId)
                    ->whereBetween('created_at', [$validated['start_date'], $validated['end_date']])
                    ->whereNotNull('service_charges')
                    ->get();

                // Service charge breakdown
                $serviceCharges = [];
                $totalServiceChargeAmount = 0;
                $ordersWithServiceCharges = 0;

                foreach ($invoices as $invoice) {
                    $charges = $invoice->service_charges ?? [];
                    
                    foreach ($charges as $charge) {
                        $name = $charge['name'] ?? 'unknown';
                        
                        if (!isset($serviceCharges[$name])) {
                            $serviceCharges[$name] = [
                                'name' => $name,
                                'type' => $charge['type'] ?? 'unknown',
                                'total_amount' => 0,
                                'count' => 0,
                                'average_amount' => 0,
                            ];
                        }

                        $serviceCharges[$name]['total_amount'] += $charge['amount'];
                        $serviceCharges[$name]['count']++;
                    }

                    $totalServiceChargeAmount += $invoice->total_service_charges;
                    $ordersWithServiceCharges++;
                }

                // Calculate averages
                foreach ($serviceCharges as &$charge) {
                    $charge['average_amount'] = $charge['count'] > 0 ? $charge['total_amount'] / $charge['count'] : 0;
                }

                // Get total orders for the period
                $totalOrders = RestaurantOrder::where('store_id', $storeId)
                    ->whereBetween('created_at', [$validated['start_date'], $validated['end_date']])
                    ->whereIn('status', ['completed', 'paid'])
                    ->count();

                return [
                    'period' => [
                        'start_date' => $validated['start_date'],
                        'end_date' => $validated['end_date'],
                    ],
                    'store_id' => $storeId,
                    'summary' => [
                        'total_service_charge_amount' => $totalServiceChargeAmount,
                        'orders_with_service_charges' => $ordersWithServiceCharges,
                        'total_orders' => $totalOrders,
                        'service_charge_penetration_rate' => $totalOrders > 0 ? $ordersWithServiceCharges / $totalOrders : 0,
                        'average_service_charge_per_order' => $ordersWithServiceCharges > 0 ? $totalServiceChargeAmount / $ordersWithServiceCharges : 0,
                    ],
                    'service_charges' => array_values($serviceCharges),
                ];
            });

            return response()->json($analytics);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to generate service charge analytics: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get billing settings.
     */
    public function getSettings(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        try {
            $settings = [
                'tax_inclusive_pricing' => setting('restaurant.tax_inclusive_pricing', false, $storeId),
                'default_tax_code' => setting('restaurant.default_tax_code', null, $storeId),
                'default_service_charge' => setting('restaurant.default_service_charge', 0, $storeId),
                'service_charge_type' => setting('restaurant.service_charge_type', 'percentage', $storeId),
                'rounding_rule' => setting('restaurant.rounding_rule', 'standard', $storeId),
                'enable_split_billing' => setting('restaurant.enable_split_billing', true, $storeId),
                'require_manager_for_discount' => setting('restaurant.require_manager_for_discount', false, $storeId),
                'max_discount_percentage' => setting('restaurant.max_discount_percentage', 100, $storeId),
                'auto_apply_service_charge' => setting('restaurant.auto_apply_service_charge', false, $storeId),
                'service_charge_order_types' => setting('restaurant.service_charge_order_types', ['dine_in'], $storeId),
            ];

            return response()->json($settings);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to get billing settings: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update billing settings.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tax_inclusive_pricing' => 'boolean',
            'default_tax_code' => 'nullable|string',
            'default_service_charge' => 'numeric|min:0|max:100',
            'service_charge_type' => 'in:percentage,fixed',
            'rounding_rule' => 'in:nearest_0.05,nearest_0.10,nearest_1.00,always_up,always_down,standard',
            'enable_split_billing' => 'boolean',
            'require_manager_for_discount' => 'boolean',
            'max_discount_percentage' => 'numeric|min:0|max:100',
            'auto_apply_service_charge' => 'boolean',
            'service_charge_order_types' => 'array',
            'service_charge_order_types.*' => 'in:dine_in,takeaway,delivery',
        ]);

        $storeId = $request->user()->store_id;

        try {
            foreach ($validated as $key => $value) {
                setting(["restaurant.{$key}" => $value], $storeId);
            }

            return response()->json(['message' => 'Billing settings updated successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update billing settings: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Reset billing settings to defaults.
     */
    public function resetSettings(Request $request): JsonResponse
    {
        $storeId = $request->user()->store_id;

        try {
            $defaultSettings = [
                'tax_inclusive_pricing' => false,
                'default_tax_code' => null,
                'default_service_charge' => 0,
                'service_charge_type' => 'percentage',
                'rounding_rule' => 'standard',
                'enable_split_billing' => true,
                'require_manager_for_discount' => false,
                'max_discount_percentage' => 100,
                'auto_apply_service_charge' => false,
                'service_charge_order_types' => ['dine_in'],
            ];

            foreach ($defaultSettings as $key => $value) {
                setting(["restaurant.{$key}" => $value], $storeId);
            }

            return response()->json(['message' => 'Billing settings reset to defaults successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to reset billing settings: ' . $e->getMessage()], 500);
        }
    }
}