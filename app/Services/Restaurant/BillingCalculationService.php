<?php

namespace App\Services\Restaurant;

use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantOrderItem;
use App\Models\Restaurant\OrderSplit;
use App\Models\Charge;
use App\Models\Sale;
use App\Models\Store;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;

class BillingCalculationService
{
    /**
     * Calculate comprehensive billing for an order
     */
    public function calculateOrderBilling(RestaurantOrder $order, array $options = []): array
    {
        try {
            $storeId = $order->store_id;
            $orderType = $order->order_type;
            
            // Get base calculations
            $subtotal = $this->calculateSubtotal($order);
            $taxBreakdown = $this->calculateTaxes($order, $subtotal);
            $serviceCharges = $this->calculateServiceCharges($order, $subtotal);
            $discounts = $this->calculateDiscounts($order, $subtotal, $options['discounts'] ?? []);
            
            // Calculate totals
            $totalTax = $taxBreakdown->sum('amount');
            $totalServiceCharges = $serviceCharges->sum('amount');
            $totalDiscounts = $discounts->sum('amount');
            
            $beforeRounding = $subtotal + $totalTax + $totalServiceCharges - $totalDiscounts;
            $finalTotal = $this->applyRoundingRules($beforeRounding, $storeId);
            $roundingAdjustment = $finalTotal - $beforeRounding;
            
            return [
                'success' => true,
                'billing' => [
                    'subtotal' => round($subtotal, 2),
                    'tax_breakdown' => $taxBreakdown->toArray(),
                    'total_tax' => round($totalTax, 2),
                    'service_charges' => $serviceCharges->toArray(),
                    'total_service_charges' => round($totalServiceCharges, 2),
                    'discounts' => $discounts->toArray(),
                    'total_discounts' => round($totalDiscounts, 2),
                    'rounding_adjustment' => round($roundingAdjustment, 2),
                    'final_total' => round($finalTotal, 2),
                    'currency' => $this->getCurrency($storeId),
                ],
                'breakdown' => [
                    'items' => $this->getItemBreakdown($order),
                    'modifiers' => $this->getModifierBreakdown($order),
                    'taxable_amount' => $this->getTaxableAmount($order),
                    'non_taxable_amount' => $this->getNonTaxableAmount($order),
                ],
                'metadata' => [
                    'order_type' => $orderType,
                    'customer_count' => $order->customer_count,
                    'table_number' => $order->table?->table_number,
                    'calculation_time' => now()->toISOString(),
                    'tax_rules_applied' => $this->getAppliedTaxRules($storeId),
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Billing calculation failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'message' => 'Billing calculation failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Calculate subtotal for order
     */
    private function calculateSubtotal(RestaurantOrder $order): float
    {
        return $order->items()->sum(function ($item) {
            return $item->calculateSubtotal();
        });
    }

    /**
     * Calculate taxes with comprehensive breakdown
     */
    private function calculateTaxes(RestaurantOrder $order, float $subtotal): Collection
    {
        $storeId = $order->store_id;
        $taxes = collect();
        
        // Get applicable tax rules
        $taxRules = $this->getApplicableTaxRules($storeId, $order->order_type);
        
        foreach ($taxRules as $taxRule) {
            $taxableAmount = $this->getTaxableAmountForRule($order, $taxRule);
            
            if ($taxableAmount > 0) {
                $taxAmount = $this->calculateTaxAmount($taxableAmount, $taxRule);
                
                $taxes->push([
                    'tax_type' => $taxRule->name,
                    'tax_code' => $taxRule->code,
                    'rate' => $taxRule->rate,
                    'rate_type' => $taxRule->rate_type, // percentage or fixed
                    'taxable_amount' => round($taxableAmount, 2),
                    'amount' => round($taxAmount, 2),
                    'is_compound' => $taxRule->is_compound ?? false,
                    'reporting_category' => $taxRule->reporting_category ?? 'standard',
                ]);
            }
        }
        
        return $taxes;
    }

    /**
     * Calculate service charges based on order type
     */
    private function calculateServiceCharges(RestaurantOrder $order, float $subtotal): Collection
    {
        $charges = collect();
        $storeId = $order->store_id;
        
        // Get applicable service charges
        $serviceCharges = Charge::active()
            ->byType('service')
            ->where(function ($query) use ($order) {
                $query->whereNull('applicable_order_types')
                      ->orWhereJsonContains('applicable_order_types', $order->order_type);
            })
            ->get();
        
        foreach ($serviceCharges as $charge) {
            $chargeAmount = $this->calculateChargeAmount($subtotal, $charge);
            
            if ($chargeAmount > 0) {
                $charges->push([
                    'charge_name' => $charge->name,
                    'charge_type' => $charge->charge_type,
                    'rate' => $charge->rate_value,
                    'rate_type' => $charge->rate_type, // percentage or fixed
                    'base_amount' => round($subtotal, 2),
                    'amount' => round($chargeAmount, 2),
                    'is_taxable' => $charge->is_taxable ?? false,
                    'description' => $charge->description,
                ]);
            }
        }
        
        return $charges;
    }

    /**
     * Calculate discounts with validation
     */
    private function calculateDiscounts(RestaurantOrder $order, float $subtotal, array $appliedDiscounts = []): Collection
    {
        $discounts = collect();
        
        // Process applied discounts
        foreach ($appliedDiscounts as $discount) {
            $this->validateDiscount($discount, $order, $subtotal);
            
            $discountAmount = $this->calculateDiscountAmount($subtotal, $discount);
            
            if ($discountAmount > 0) {
                $discounts->push([
                    'discount_type' => $discount['type'],
                    'discount_code' => $discount['code'] ?? null,
                    'description' => $discount['description'],
                    'rate' => $discount['rate'] ?? 0,
                    'rate_type' => $discount['rate_type'] ?? 'percentage',
                    'base_amount' => round($subtotal, 2),
                    'amount' => round($discountAmount, 2),
                    'applied_by' => $discount['applied_by'] ?? 'system',
                    'applied_at' => $discount['applied_at'] ?? now()->toISOString(),
                ]);
            }
        }
        
        // Apply automatic discounts (happy hour, etc.)
        $autoDiscounts = $this->getAutomaticDiscounts($order, $subtotal);
        $discounts = $discounts->merge($autoDiscounts);
        
        return $discounts;
    }

    /**
     * Calculate split billing
     */
    public function calculateSplitBilling(RestaurantOrder $order, array $splitConfig): array
    {
        try {
            $billing = $this->calculateOrderBilling($order);
            
            if (!$billing['success']) {
                return $billing;
            }
            
            $totalAmount = $billing['billing']['final_total'];
            $splitType = $splitConfig['type']; // equal, percentage, custom, item
            
            switch ($splitType) {
                case 'equal':
                    return $this->calculateEqualSplit($totalAmount, $splitConfig);
                
                case 'percentage':
                    return $this->calculatePercentageSplit($totalAmount, $splitConfig);
                
                case 'custom':
                    return $this->calculateCustomSplit($totalAmount, $splitConfig);
                
                case 'item':
                    return $this->calculateItemBasedSplit($order, $splitConfig);
                
                default:
                    throw new \InvalidArgumentException("Invalid split type: {$splitType}");
            }
        } catch (\Exception $e) {
            Log::error('Split billing calculation failed', [
                'order_id' => $order->id,
                'split_config' => $splitConfig,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => 'Split billing calculation failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Calculate equal split
     */
    private function calculateEqualSplit(float $totalAmount, array $config): array
    {
        $splitCount = $config['split_count'];
        $equalAmount = $totalAmount / $splitCount;
        
        $splits = [];
        $remainingAmount = $totalAmount;
        
        for ($i = 1; $i <= $splitCount; $i++) {
            $amount = $i === $splitCount ? $remainingAmount : $equalAmount;
            $remainingAmount -= $amount;
            
            $splits[] = [
                'split_number' => $i,
                'amount' => round($amount, 2),
                'percentage' => round(($amount / $totalAmount) * 100, 2),
            ];
        }
        
        return [
            'success' => true,
            'split_type' => 'equal',
            'total_amount' => round($totalAmount, 2),
            'split_count' => $splitCount,
            'splits' => $splits,
        ];
    }

    /**
     * Calculate percentage-based split
     */
    private function calculatePercentageSplit(float $totalAmount, array $config): array
    {
        $percentages = $config['percentages'];
        $totalPercentage = array_sum($percentages);
        
        // Validate percentages sum to 100
        if (abs($totalPercentage - 100) > 0.01) {
            throw new \InvalidArgumentException('Percentages must sum to 100%');
        }
        
        $splits = [];
        $remainingAmount = $totalAmount;
        
        foreach ($percentages as $index => $percentage) {
            $isLastSplit = $index === (count($percentages) - 1);
            $amount = $isLastSplit ? $remainingAmount : ($totalAmount * $percentage / 100);
            $remainingAmount -= $amount;
            
            $splits[] = [
                'split_number' => $index + 1,
                'percentage' => $percentage,
                'amount' => round($amount, 2),
            ];
        }
        
        return [
            'success' => true,
            'split_type' => 'percentage',
            'total_amount' => round($totalAmount, 2),
            'splits' => $splits,
        ];
    }

    /**
     * Calculate custom amount split
     */
    private function calculateCustomSplit(float $totalAmount, array $config): array
    {
        $amounts = $config['amounts'];
        $totalSplitAmount = array_sum($amounts);
        
        // Validate split amounts match total
        if (abs($totalSplitAmount - $totalAmount) > 0.01) {
            throw new \InvalidArgumentException('Split amounts must equal total amount');
        }
        
        $splits = [];
        foreach ($amounts as $index => $amount) {
            $splits[] = [
                'split_number' => $index + 1,
                'amount' => round($amount, 2),
                'percentage' => round(($amount / $totalAmount) * 100, 2),
            ];
        }
        
        return [
            'success' => true,
            'split_type' => 'custom',
            'total_amount' => round($totalAmount, 2),
            'splits' => $splits,
        ];
    }

    /**
     * Calculate item-based split
     */
    private function calculateItemBasedSplit(RestaurantOrder $order, array $config): array
    {
        $itemAssignments = $config['item_assignments']; // [split_number => [item_ids]]
        $splits = [];
        $totalAmount = 0;
        
        // Calculate subtotal for each split
        foreach ($itemAssignments as $splitNumber => $itemIds) {
            $splitSubtotal = 0;
            
            foreach ($itemIds as $itemId) {
                $item = $order->items()->find($itemId);
                if ($item) {
                    $splitSubtotal += $item->calculateSubtotal();
                }
            }
            
            // Apply proportional taxes and charges
            $orderSubtotal = $this->calculateSubtotal($order);
            $proportion = $orderSubtotal > 0 ? $splitSubtotal / $orderSubtotal : 0;
            
            $billing = $this->calculateOrderBilling($order);
            $totalTaxes = $billing['billing']['total_tax'];
            $totalCharges = $billing['billing']['total_service_charges'];
            $totalDiscounts = $billing['billing']['total_discounts'];
            
            $splitTaxes = $totalTaxes * $proportion;
            $splitCharges = $totalCharges * $proportion;
            $splitDiscounts = $totalDiscounts * $proportion;
            
            $splitTotal = $splitSubtotal + $splitTaxes + $splitCharges - $splitDiscounts;
            $totalAmount += $splitTotal;
            
            $splits[] = [
                'split_number' => $splitNumber,
                'items' => $itemIds,
                'subtotal' => round($splitSubtotal, 2),
                'taxes' => round($splitTaxes, 2),
                'charges' => round($splitCharges, 2),
                'discounts' => round($splitDiscounts, 2),
                'amount' => round($splitTotal, 2),
                'percentage' => 0, // Will be calculated after total is known
            ];
        }
        
        // Calculate percentages
        foreach ($splits as &$split) {
            $split['percentage'] = $totalAmount > 0 ? round(($split['amount'] / $totalAmount) * 100, 2) : 0;
        }
        
        return [
            'success' => true,
            'split_type' => 'item',
            'total_amount' => round($totalAmount, 2),
            'splits' => $splits,
        ];
    }

    /**
     * Apply rounding rules
     */
    private function applyRoundingRules(float $amount, int $storeId): float
    {
        $store = Store::find($storeId);
        $roundingRule = $store->rounding_rule ?? 'standard';
        
        switch ($roundingRule) {
            case 'nearest_0_05':
                return round($amount * 20) / 20;
            
            case 'nearest_0_10':
                return round($amount * 10) / 10;
            
            case 'always_up_0_10':
                return ceil($amount * 10) / 10;
            
            case 'always_down_0_10':
                return floor($amount * 10) / 10;
            
            case 'no_rounding':
            default:
                return round($amount, 2);
        }
    }

    /**
     * Get applicable tax rules
     */
    private function getApplicableTaxRules(int $storeId, string $orderType): Collection
    {
        // This would typically come from TaxConfigurationService
        // For now, return basic tax rules
        return collect([
            (object) [
                'id' => 1,
                'name' => 'VAT',
                'code' => 'VAT',
                'rate' => 10.0,
                'rate_type' => 'percentage',
                'is_compound' => false,
                'reporting_category' => 'sales_tax',
                'applicable_order_types' => ['dine_in', 'takeaway', 'delivery'],
            ],
            (object) [
                'id' => 2,
                'name' => 'Service Tax',
                'code' => 'ST',
                'rate' => 5.0,
                'rate_type' => 'percentage',
                'is_compound' => false,
                'reporting_category' => 'service_tax',
                'applicable_order_types' => ['dine_in'],
            ],
        ])->filter(function ($tax) use ($orderType) {
            return in_array($orderType, $tax->applicable_order_types);
        });
    }

    /**
     * Get taxable amount for a specific tax rule
     */
    private function getTaxableAmountForRule(RestaurantOrder $order, $taxRule): float
    {
        $taxableAmount = 0;
        
        foreach ($order->items as $item) {
            if ($this->isItemTaxableForRule($item, $taxRule)) {
                $taxableAmount += $item->calculateSubtotal();
            }
        }
        
        return $taxableAmount;
    }

    /**
     * Check if item is taxable for a specific rule
     */
    private function isItemTaxableForRule(RestaurantOrderItem $item, $taxRule): bool
    {
        // Check if product is taxable
        if (!$item->product->is_taxable ?? true) {
            return false;
        }
        
        // Check for tax exemptions
        if ($item->product->tax_exemptions) {
            $exemptions = json_decode($item->product->tax_exemptions, true);
            if (in_array($taxRule->code, $exemptions)) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Calculate tax amount
     */
    private function calculateTaxAmount(float $taxableAmount, $taxRule): float
    {
        if ($taxRule->rate_type === 'fixed') {
            return $taxRule->rate;
        }
        
        return $taxableAmount * ($taxRule->rate / 100);
    }

    /**
     * Calculate charge amount
     */
    private function calculateChargeAmount(float $baseAmount, Charge $charge): float
    {
        if ($charge->rate_type === 'fixed') {
            return $charge->rate_value;
        }
        
        return $baseAmount * ($charge->rate_value / 100);
    }

    /**
     * Validate discount
     */
    private function validateDiscount(array $discount, RestaurantOrder $order, float $subtotal): void
    {
        $discountType = $discount['type'];
        $rate = $discount['rate'] ?? 0;
        
        switch ($discountType) {
            case 'percentage':
                if ($rate < 0 || $rate > 100) {
                    throw new \InvalidArgumentException('Percentage discount must be between 0 and 100');
                }
                break;
            
            case 'fixed':
                if ($rate < 0 || $rate > $subtotal) {
                    throw new \InvalidArgumentException('Fixed discount cannot exceed subtotal');
                }
                break;
            
            case 'promotional':
                // Validate promotional code
                $this->validatePromotionalCode($discount['code'], $order);
                break;
        }
    }

    /**
     * Calculate discount amount
     */
    private function calculateDiscountAmount(float $subtotal, array $discount): float
    {
        $discountType = $discount['type'];
        $rate = $discount['rate'] ?? 0;
        
        switch ($discountType) {
            case 'percentage':
                return $subtotal * ($rate / 100);
            
            case 'fixed':
                return min($rate, $subtotal);
            
            case 'promotional':
                return $this->calculatePromotionalDiscount($subtotal, $discount);
            
            default:
                return 0;
        }
    }

    /**
     * Get automatic discounts
     */
    private function getAutomaticDiscounts(RestaurantOrder $order, float $subtotal): Collection
    {
        $discounts = collect();
        
        // Check for happy hour discounts
        if ($this->isHappyHour($order->store_id)) {
            $happyHourDiscount = [
                'discount_type' => 'promotional',
                'discount_code' => 'HAPPY_HOUR',
                'description' => 'Happy Hour Discount',
                'rate' => 10.0,
                'rate_type' => 'percentage',
                'base_amount' => round($subtotal, 2),
                'amount' => round($subtotal * 0.10, 2),
                'applied_by' => 'system',
                'applied_at' => now()->toISOString(),
            ];
            $discounts->push($happyHourDiscount);
        }
        
        return $discounts;
    }

    /**
     * Check if it's happy hour
     */
    private function isHappyHour(int $storeId): bool
    {
        $now = now();
        $hour = $now->hour;
        
        // Simple happy hour logic: 3 PM to 6 PM
        return $hour >= 15 && $hour < 18;
    }

    /**
     * Validate promotional code
     */
    private function validatePromotionalCode(string $code, RestaurantOrder $order): void
    {
        // Implement promotional code validation logic
        // Check if code exists, is active, applicable to order type, etc.
    }

    /**
     * Calculate promotional discount
     */
    private function calculatePromotionalDiscount(float $subtotal, array $discount): float
    {
        // Implement promotional discount calculation logic
        return $subtotal * 0.10; // Example: 10% off
    }

    /**
     * Get item breakdown
     */
    private function getItemBreakdown(RestaurantOrder $order): array
    {
        return $order->items->map(function ($item) {
            return [
                'item_id' => $item->id,
                'product_name' => $item->product->name,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'subtotal' => $item->calculateSubtotal(),
                'is_taxable' => $item->product->is_taxable ?? true,
                'discount' => $item->discount,
            ];
        })->toArray();
    }

    /**
     * Get modifier breakdown
     */
    private function getModifierBreakdown(RestaurantOrder $order): array
    {
        $modifiers = [];
        
        foreach ($order->items as $item) {
            foreach ($item->modifiers as $modifier) {
                $modifiers[] = [
                    'modifier_id' => $modifier->id,
                    'modifier_name' => $modifier->modifier->name,
                    'quantity' => $modifier->quantity,
                    'price_adjustment' => $modifier->price_adjustment,
                    'total_adjustment' => $modifier->price_adjustment * $modifier->quantity,
                ];
            }
        }
        
        return $modifiers;
    }

    /**
     * Get taxable amount
     */
    private function getTaxableAmount(RestaurantOrder $order): float
    {
        return $order->items->sum(function ($item) {
            if (!$item->product->is_taxable ?? true) {
                return 0;
            }
            return $item->calculateSubtotal();
        });
    }

    /**
     * Get non-taxable amount
     */
    private function getNonTaxableAmount(RestaurantOrder $order): float
    {
        return $order->items->sum(function ($item) {
            if ($item->product->is_taxable ?? true) {
                return 0;
            }
            return $item->calculateSubtotal();
        });
    }

    /**
     * Get currency
     */
    private function getCurrency(int $storeId): string
    {
        $store = Store::find($storeId);
        return $store->currency ?? 'USD';
    }

    /**
     * Get applied tax rules
     */
    private function getAppliedTaxRules(int $storeId): array
    {
        // Return metadata about applied tax rules
        return [
            'vat_applied' => true,
            'service_tax_applied' => true,
            'tax_calculation_method' => 'inclusive',
        ];
    }

    /**
     * Preview billing calculation
     */
    public function previewBilling(RestaurantOrder $order, array $options = []): array
    {
        $billing = $this->calculateOrderBilling($order, $options);
        
        if (!$billing['success']) {
            return $billing;
        }
        
        // Add preview-specific information
        $billing['is_preview'] = true;
        $billing['preview_timestamp'] = now()->toISOString();
        
        return $billing;
    }
}