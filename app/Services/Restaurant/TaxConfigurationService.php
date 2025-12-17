<?php

namespace App\Services\Restaurant;

use App\Models\Store;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;

class TaxConfigurationService
{
    /**
     * Get tax configuration for a store
     */
    public function getTaxConfiguration(int $storeId): array
    {
        try {
            $store = Store::find($storeId);
            
            return [
                'store_id' => $storeId,
                'tax_regime' => $store->tax_regime ?? 'standard',
                'currency' => $store->currency ?? 'USD',
                'tax_inclusive_pricing' => $store->tax_inclusive_pricing ?? false,
                'rounding_rule' => $store->rounding_rule ?? 'standard',
                'tax_rules' => $this->getActiveTaxRules($storeId),
                'tax_exemptions' => $this->getTaxExemptions($storeId),
                'location_based_rules' => $this->getLocationBasedTaxRules($storeId),
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get tax configuration', [
                'store_id' => $storeId,
                'error' => $e->getMessage()
            ]);
            
            return [];
        }
    }

    /**
     * Get active tax rules for a store
     */
    public function getActiveTaxRules(int $storeId): Collection
    {
        // For now, return default tax rules
        // In a real implementation, this would query a tax_rules table
        return collect([
            [
                'id' => 1,
                'name' => 'Value Added Tax (VAT)',
                'code' => 'VAT',
                'rate' => 10.0,
                'rate_type' => 'percentage',
                'is_compound' => false,
                'is_active' => true,
                'applicable_order_types' => ['dine_in', 'takeaway', 'delivery'],
                'applicable_product_categories' => null, // null means all categories
                'reporting_category' => 'sales_tax',
                'effective_from' => '2023-01-01',
                'effective_to' => null,
                'priority' => 1,
            ],
            [
                'id' => 2,
                'name' => 'Service Tax',
                'code' => 'ST',
                'rate' => 5.0,
                'rate_type' => 'percentage',
                'is_compound' => false,
                'is_active' => true,
                'applicable_order_types' => ['dine_in'],
                'applicable_product_categories' => null,
                'reporting_category' => 'service_tax',
                'effective_from' => '2023-01-01',
                'effective_to' => null,
                'priority' => 2,
            ],
            [
                'id' => 3,
                'name' => 'Hospitality Tax',
                'code' => 'HT',
                'rate' => 2.0,
                'rate_type' => 'percentage',
                'is_compound' => true, // Applied on top of other taxes
                'is_active' => true,
                'applicable_order_types' => ['dine_in'],
                'applicable_product_categories' => ['beverages', 'alcohol'],
                'reporting_category' => 'hospitality_tax',
                'effective_from' => '2023-01-01',
                'effective_to' => null,
                'priority' => 3,
            ],
        ])->filter(function ($rule) {
            return $rule['is_active'];
        });
    }

    /**
     * Get tax exemptions for a store
     */
    public function getTaxExemptions(int $storeId): Collection
    {
        return collect([
            [
                'id' => 1,
                'name' => 'Food Items Exemption',
                'description' => 'Basic food items are exempt from service tax',
                'exempt_tax_codes' => ['ST'],
                'applicable_categories' => ['food', 'beverages'],
                'condition_type' => 'category_based',
                'is_active' => true,
            ],
            [
                'id' => 2,
                'name' => 'Takeaway Exemption',
                'description' => 'Service tax not applicable for takeaway orders',
                'exempt_tax_codes' => ['ST'],
                'condition_type' => 'order_type_based',
                'condition_values' => ['takeaway'],
                'is_active' => true,
            ],
        ])->filter(function ($exemption) {
            return $exemption['is_active'];
        });
    }

    /**
     * Get location-based tax rules
     */
    public function getLocationBasedTaxRules(int $storeId): Collection
    {
        $store = Store::find($storeId);
        
        // In a real implementation, this would check store location
        // and apply location-specific tax rules
        $locationRules = collect();
        
        // Example: Additional tax for specific regions
        if ($store && $store->city === 'New York') {
            $locationRules->push([
                'id' => 100,
                'name' => 'NYC Hospitality Tax',
                'code' => 'NYC_HT',
                'rate' => 1.5,
                'rate_type' => 'percentage',
                'is_compound' => false,
                'condition_type' => 'location_based',
                'condition_values' => ['New York'],
                'is_active' => true,
            ]);
        }
        
        return $locationRules;
    }

    /**
     * Calculate taxes for a specific amount and context
     */
    public function calculateTaxes(float $amount, array $context): array
    {
        $storeId = $context['store_id'];
        $orderType = $context['order_type'] ?? 'dine_in';
        $productCategories = $context['product_categories'] ?? [];
        
        $taxRules = $this->getApplicableTaxRules($storeId, $orderType, $productCategories);
        $taxes = [];
        $compoundBase = $amount;
        
        // Sort by priority to ensure correct calculation order
        $taxRules = $taxRules->sortBy('priority');
        
        foreach ($taxRules as $rule) {
            $taxableAmount = $rule['is_compound'] ? $compoundBase : $amount;
            $taxAmount = $this->calculateTaxAmount($taxableAmount, $rule);
            
            $taxes[] = [
                'tax_code' => $rule['code'],
                'tax_name' => $rule['name'],
                'rate' => $rule['rate'],
                'rate_type' => $rule['rate_type'],
                'taxable_amount' => round($taxableAmount, 2),
                'amount' => round($taxAmount, 2),
                'is_compound' => $rule['is_compound'],
                'reporting_category' => $rule['reporting_category'],
            ];
            
            // Add compound taxes to base for subsequent calculations
            if ($rule['is_compound']) {
                $compoundBase += $taxAmount;
            }
        }
        
        return [
            'taxes' => $taxes,
            'total_tax' => round(array_sum(array_column($taxes, 'amount')), 2),
            'effective_tax_rate' => $amount > 0 ? round((array_sum(array_column($taxes, 'amount')) / $amount) * 100, 2) : 0,
        ];
    }

    /**
     * Get applicable tax rules based on context
     */
    public function getApplicableTaxRules(int $storeId, string $orderType, array $productCategories = []): Collection
    {
        $allRules = $this->getActiveTaxRules($storeId);
        $locationRules = $this->getLocationBasedTaxRules($storeId);
        
        $applicableRules = $allRules->merge($locationRules);
        
        return $applicableRules->filter(function ($rule) use ($orderType, $productCategories) {
            // Check order type applicability
            if ($rule['applicable_order_types'] && !in_array($orderType, $rule['applicable_order_types'])) {
                return false;
            }
            
            // Check product category applicability
            if ($rule['applicable_product_categories'] && !empty($productCategories)) {
                $hasMatchingCategory = false;
                foreach ($productCategories as $category) {
                    if (in_array($category, $rule['applicable_product_categories'])) {
                        $hasMatchingCategory = true;
                        break;
                    }
                }
                if (!$hasMatchingCategory) {
                    return false;
                }
            }
            
            return true;
        });
    }

    /**
     * Calculate tax amount for a rule
     */
    private function calculateTaxAmount(float $amount, array $rule): float
    {
        if ($rule['rate_type'] === 'fixed') {
            return $rule['rate'];
        }
        
        return $amount * ($rule['rate'] / 100);
    }

    /**
     * Check if a product is exempt from specific tax
     */
    public function isTaxExempt(int $productId, string $taxCode, int $storeId): bool
    {
        $product = Product::find($productId);
        if (!$product) {
            return false;
        }
        
        $exemptions = $this->getTaxExemptions($storeId);
        
        foreach ($exemptions as $exemption) {
            if (!in_array($taxCode, $exemption['exempt_tax_codes'])) {
                continue;
            }
            
            switch ($exemption['condition_type']) {
                case 'category_based':
                    if (in_array($product->category, $exemption['applicable_categories'])) {
                        return true;
                    }
                    break;
                
                case 'product_based':
                    if (in_array($productId, $exemption['applicable_products'] ?? [])) {
                        return true;
                    }
                    break;
            }
        }
        
        return false;
    }

    /**
     * Update tax configuration
     */
    public function updateTaxConfiguration(int $storeId, array $configuration): array
    {
        try {
            DB::beginTransaction();
            
            // Update store tax settings
            $store = Store::find($storeId);
            if ($store) {
                $store->tax_regime = $configuration['tax_regime'] ?? $store->tax_regime;
                $store->tax_inclusive_pricing = $configuration['tax_inclusive_pricing'] ?? $store->tax_inclusive_pricing;
                $store->rounding_rule = $configuration['rounding_rule'] ?? $store->rounding_rule;
                $store->save();
            }
            
            // Update tax rules
            if (isset($configuration['tax_rules'])) {
                $this->updateTaxRules($storeId, $configuration['tax_rules']);
            }
            
            // Update tax exemptions
            if (isset($configuration['tax_exemptions'])) {
                $this->updateTaxExemptions($storeId, $configuration['tax_exemptions']);
            }
            
            DB::commit();
            
            return [
                'success' => true,
                'message' => 'Tax configuration updated successfully',
                'configuration' => $this->getTaxConfiguration($storeId),
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to update tax configuration', [
                'store_id' => $storeId,
                'error' => $e->getMessage(),
                'configuration' => $configuration
            ]);
            
            return [
                'success' => false,
                'message' => 'Failed to update tax configuration: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Update tax rules
     */
    private function updateTaxRules(int $storeId, array $taxRules): void
    {
        // In a real implementation, this would update a tax_rules table
        // For now, we'll just log the update
        Log::info('Tax rules updated', [
            'store_id' => $storeId,
            'tax_rules' => $taxRules
        ]);
    }

    /**
     * Update tax exemptions
     */
    private function updateTaxExemptions(int $storeId, array $exemptions): void
    {
        // In a real implementation, this would update a tax_exemptions table
        // For now, we'll just log the update
        Log::info('Tax exemptions updated', [
            'store_id' => $storeId,
            'exemptions' => $exemptions
        ]);
    }

    /**
     * Get tax reporting data
     */
    public function getTaxReportingData(int $storeId, string $startDate, string $endDate): array
    {
        try {
            // In a real implementation, this would query sales data
            // and generate tax reports
            
            return [
                'store_id' => $storeId,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'tax_summary' => [
                    'total_sales' => 0,
                    'total_tax_collected' => 0,
                    'tax_breakdown' => [
                        'VAT' => 0,
                        'Service Tax' => 0,
                        'Hospitality Tax' => 0,
                    ],
                ],
                'exemptions' => [
                    'total_exempt_sales' => 0,
                    'exemption_breakdown' => [],
                ],
                'generated_at' => now()->toISOString(),
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate tax reporting data', [
                'store_id' => $storeId,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'error' => $e->getMessage()
            ]);
            
            return [];
        }
    }

    /**
     * Validate tax configuration
     */
    public function validateTaxConfiguration(array $configuration): array
    {
        $errors = [];
        
        // Validate tax regime
        if (isset($configuration['tax_regime'])) {
            $validRegimes = ['standard', 'simplified', 'exempt'];
            if (!in_array($configuration['tax_regime'], $validRegimes)) {
                $errors['tax_regime'] = 'Invalid tax regime';
            }
        }
        
        // Validate tax rules
        if (isset($configuration['tax_rules'])) {
            foreach ($configuration['tax_rules'] as $index => $rule) {
                $ruleErrors = $this->validateTaxRule($rule);
                if (!empty($ruleErrors)) {
                    $errors['tax_rules'][$index] = $ruleErrors;
                }
            }
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Validate individual tax rule
     */
    private function validateTaxRule(array $rule): array
    {
        $errors = [];
        
        if (empty($rule['name'])) {
            $errors['name'] = 'Tax rule name is required';
        }
        
        if (empty($rule['code'])) {
            $errors['code'] = 'Tax code is required';
        }
        
        if (!isset($rule['rate']) || $rule['rate'] < 0) {
            $errors['rate'] = 'Tax rate must be a non-negative number';
        }
        
        if (empty($rule['rate_type']) || !in_array($rule['rate_type'], ['percentage', 'fixed'])) {
            $errors['rate_type'] = 'Rate type must be percentage or fixed';
        }
        
        if (isset($rule['applicable_order_types']) && !is_array($rule['applicable_order_types'])) {
            $errors['applicable_order_types'] = 'Applicable order types must be an array';
        }
        
        return $errors;
    }

    /**
     * Get tax rate history
     */
    public function getTaxRateHistory(int $storeId, ?string $taxCode = null): array
    {
        // In a real implementation, this would query tax rate history
        return [
            'store_id' => $storeId,
            'tax_code' => $taxCode,
            'history' => [
                [
                    'effective_from' => '2023-01-01',
                    'effective_to' => '2023-06-30',
                    'rate' => 8.0,
                    'changed_by' => 'admin',
                    'change_reason' => 'Tax rate adjustment',
                ],
                [
                    'effective_from' => '2023-07-01',
                    'effective_to' => null,
                    'rate' => 10.0,
                    'changed_by' => 'admin',
                    'change_reason' => 'Tax rate increase',
                ],
            ],
        ];
    }
}