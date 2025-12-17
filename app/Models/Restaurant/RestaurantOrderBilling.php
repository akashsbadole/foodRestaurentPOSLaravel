<?php

namespace App\Models\Restaurant;

use App\Services\Restaurant\BillingCalculationService;
use Illuminate\Support\Facades\Log;

trait RestaurantOrderBilling
{
    /**
     * Calculate comprehensive billing using BillingCalculationService
     */
    public function calculateBilling(array $options = []): array
    {
        $billingService = new BillingCalculationService();
        return $billingService->calculateOrderBilling($this, $options);
    }

    /**
     * Preview billing calculation without saving
     */
    public function previewBilling(array $options = []): array
    {
        $billingService = new BillingCalculationService();
        return $billingService->previewBilling($this, $options);
    }

    /**
     * Calculate split billing
     */
    public function calculateSplitBilling(array $splitConfig): array
    {
        $billingService = new BillingCalculationService();
        return $billingService->calculateSplitBilling($this, $splitConfig);
    }

    /**
     * Apply discount to order
     */
    public function applyDiscount(array $discountData): array
    {
        try {
            // Validate discount
            $validation = $this->validateDiscount($discountData);
            if (!$validation['valid']) {
                return [
                    'success' => false,
                    'message' => 'Invalid discount: ' . implode(', ', $validation['errors'])
                ];
            }

            // Store current discount info
            $currentDiscounts = $this->getDiscountData();
            $currentDiscounts[] = $discountData;

            // Recalculate billing with new discount
            $billing = $this->calculateBilling(['discounts' => $currentDiscounts]);
            
            if ($billing['success']) {
                // Update order with new totals
                $billingData = $billing['billing'];
                $this->discount_amount = $billingData['total_discounts'];
                $this->total_amount = $billingData['final_total'];
                $this->save();

                return [
                    'success' => true,
                    'message' => 'Discount applied successfully',
                    'billing' => $billingData,
                ];
            }

            return $billing;
        } catch (\Exception $e) {
            Log::error('Failed to apply discount', [
                'order_id' => $this->id,
                'discount_data' => $discountData,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to apply discount: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Remove discount from order
     */
    public function removeDiscount(string $discountCode = null): array
    {
        try {
            $currentDiscounts = $this->getDiscountData();
            
            if ($discountCode) {
                // Remove specific discount
                $currentDiscounts = array_filter($currentDiscounts, function ($discount) use ($discountCode) {
                    return ($discount['code'] ?? '') !== $discountCode;
                });
            } else {
                // Remove all discounts
                $currentDiscounts = [];
            }

            // Recalculate billing without discounts
            $billing = $this->calculateBilling(['discounts' => $currentDiscounts]);
            
            if ($billing['success']) {
                // Update order with new totals
                $billingData = $billing['billing'];
                $this->discount_amount = $billingData['total_discounts'];
                $this->total_amount = $billingData['final_total'];
                $this->save();

                return [
                    'success' => true,
                    'message' => 'Discount removed successfully',
                    'billing' => $billingData,
                ];
            }

            return $billing;
        } catch (\Exception $e) {
            Log::error('Failed to remove discount', [
                'order_id' => $this->id,
                'discount_code' => $discountCode,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to remove discount: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get discount data from order metadata or special_instructions
     */
    private function getDiscountData(): array
    {
        // In a real implementation, this might be stored in a separate discounts table
        // For now, parse from special_instructions or metadata
        $discounts = [];
        
        if ($this->special_instructions && str_contains($this->special_instructions, 'DISCOUNT:')) {
            // Parse discount from special instructions
            preg_match('/DISCOUNT:([^;]+)/', $this->special_instructions, $matches);
            if (isset($matches[1])) {
                $discounts[] = [
                    'type' => 'promotional',
                    'code' => trim($matches[1]),
                    'description' => 'Applied discount',
                ];
            }
        }
        
        return $discounts;
    }

    /**
     * Validate discount data
     */
    private function validateDiscount(array $discount): array
    {
        $errors = [];
        
        if (empty($discount['type'])) {
            $errors[] = 'Discount type is required';
        }
        
        if (!in_array($discount['type'], ['percentage', 'fixed', 'promotional'])) {
            $errors[] = 'Invalid discount type';
        }
        
        if ($discount['type'] === 'percentage') {
            if (!isset($discount['rate']) || $discount['rate'] < 0 || $discount['rate'] > 100) {
                $errors[] = 'Percentage discount must be between 0 and 100';
            }
        }
        
        if ($discount['type'] === 'fixed') {
            if (!isset($discount['rate']) || $discount['rate'] < 0) {
                $errors[] = 'Fixed discount must be non-negative';
            }
            
            if (isset($discount['rate']) && $discount['rate'] > $this->subtotal) {
                $errors[] = 'Fixed discount cannot exceed subtotal';
            }
        }
        
        if ($discount['type'] === 'promotional' && empty($discount['code'])) {
            $errors[] = 'Promotional code is required';
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Generate invoice for this order
     */
    public function generateInvoice(array $options = []): array
    {
        try {
            // Check if order can be billed
            if (!$this->canBeBilled()) {
                return [
                    'success' => false,
                    'message' => 'Order cannot be billed in current status: ' . $this->status
                ];
            }

            // Calculate billing
            $billing = $this->calculateBilling($options);
            if (!$billing['success']) {
                return $billing;
            }

            // Create invoice
            $invoice = RestaurantInvoice::createFromOrder(
                $this,
                $billing['billing'],
                $options
            );

            return [
                'success' => true,
                'message' => 'Invoice generated successfully',
                'invoice' => $invoice,
                'billing' => $billing['billing'],
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate invoice', [
                'order_id' => $this->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate invoice: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate split invoices
     */
    public function generateSplitInvoices(array $splitConfig): array
    {
        try {
            // Check if order can be billed
            if (!$this->canBeBilled()) {
                return [
                    'success' => false,
                    'message' => 'Order cannot be billed in current status: ' . $this->status
                ];
            }

            // Calculate split billing
            $splitBilling = $this->calculateSplitBilling($splitConfig);
            if (!$splitBilling['success']) {
                return $splitBilling;
            }

            $invoices = [];
            foreach ($splitBilling['splits'] as $splitData) {
                // Create billing data for this split
                $splitBillingData = [
                    'subtotal' => $splitData['subtotal'] ?? 0,
                    'tax_breakdown' => $this->proportionTaxBreakdown($splitData['percentage']),
                    'total_tax' => $splitData['taxes'] ?? 0,
                    'service_charges' => $this->proportionServiceCharges($splitData['percentage']),
                    'total_service_charges' => $splitData['charges'] ?? 0,
                    'discounts' => $this->proportionDiscounts($splitData['percentage']),
                    'total_discounts' => $splitData['discounts'] ?? 0,
                    'rounding_adjustment' => $splitData['rounding_adjustment'] ?? 0,
                    'final_total' => $splitData['amount'],
                    'currency' => $splitBilling['currency'] ?? 'USD',
                    'tax_inclusive' => false,
                    'metadata' => [
                        'split_number' => $splitData['split_number'],
                        'split_percentage' => $splitData['percentage'],
                    ],
                ];

                // Create split invoice
                $invoice = RestaurantInvoice::createSplitInvoice(
                    $this,
                    $splitData,
                    $splitBillingData
                );

                $invoices[] = $invoice;
            }

            return [
                'success' => true,
                'message' => 'Split invoices generated successfully',
                'invoices' => $invoices,
                'split_billing' => $splitBilling,
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate split invoices', [
                'order_id' => $this->id,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Failed to generate split invoices: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Proportion tax breakdown for split
     */
    private function proportionTaxBreakdown(float $percentage): array
    {
        $billing = $this->calculateBilling();
        if (!$billing['success']) {
            return [];
        }

        $taxBreakdown = $billing['billing']['tax_breakdown'];
        $proportioned = [];

        foreach ($taxBreakdown as $tax) {
            $proportioned[] = [
                'tax_type' => $tax['tax_type'],
                'tax_code' => $tax['tax_code'],
                'rate' => $tax['rate'],
                'rate_type' => $tax['rate_type'],
                'taxable_amount' => round($tax['taxable_amount'] * ($percentage / 100), 2),
                'amount' => round($tax['amount'] * ($percentage / 100), 2),
                'is_compound' => $tax['is_compound'],
                'reporting_category' => $tax['reporting_category'],
            ];
        }

        return $proportioned;
    }

    /**
     * Proportion service charges for split
     */
    private function proportionServiceCharges(float $percentage): array
    {
        $billing = $this->calculateBilling();
        if (!$billing['success']) {
            return [];
        }

        $serviceCharges = $billing['billing']['service_charges'];
        $proportioned = [];

        foreach ($serviceCharges as $charge) {
            $proportioned[] = [
                'charge_name' => $charge['charge_name'],
                'charge_type' => $charge['charge_type'],
                'rate' => $charge['rate'],
                'rate_type' => $charge['rate_type'],
                'base_amount' => round($charge['base_amount'] * ($percentage / 100), 2),
                'amount' => round($charge['amount'] * ($percentage / 100), 2),
                'is_taxable' => $charge['is_taxable'],
                'description' => $charge['description'],
            ];
        }

        return $proportioned;
    }

    /**
     * Proportion discounts for split
     */
    private function proportionDiscounts(float $percentage): array
    {
        $billing = $this->calculateBilling();
        if (!$billing['success']) {
            return [];
        }

        $discounts = $billing['billing']['discounts'];
        $proportioned = [];

        foreach ($discounts as $discount) {
            $proportioned[] = [
                'discount_type' => $discount['discount_type'],
                'discount_code' => $discount['discount_code'],
                'description' => $discount['description'],
                'rate' => $discount['rate'],
                'rate_type' => $discount['rate_type'],
                'base_amount' => round($discount['base_amount'] * ($percentage / 100), 2),
                'amount' => round($discount['amount'] * ($percentage / 100), 2),
                'applied_by' => $discount['applied_by'],
                'applied_at' => $discount['applied_at'],
            ];
        }

        return $proportioned;
    }

    /**
     * Check if order can be billed
     */
    public function canBeBilled(): bool
    {
        return in_array($this->status, ['served', 'completed']);
    }

    /**
     * Get billing status
     */
    public function getBillingStatus(): array
    {
        $hasInvoice = $this->invoices()->exists();
        $paidInvoices = $this->invoices()->where('status', 'paid')->count();
        $totalInvoices = $this->invoices()->count();
        
        return [
            'can_be_billed' => $this->canBeBilled(),
            'has_invoice' => $hasInvoice,
            'invoices_count' => $totalInvoices,
            'paid_invoices_count' => $paidInvoices,
            'fully_paid' => $paidInvoices > 0 && $paidInvoices === $totalInvoices,
            'total_invoiced_amount' => $this->invoices()->sum('final_total'),
            'total_paid_amount' => $this->invoices()->sum('amount_paid'),
        ];
    }

    /**
     * Get billing history
     */
    public function getBillingHistory(): array
    {
        return $this->invoices()
            ->with(['customer'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($invoice) {
                return [
                    'invoice_number' => $invoice->invoice_number,
                    'type' => $invoice->invoice_type,
                    'status' => $invoice->status,
                    'amount' => $invoice->final_total,
                    'paid_amount' => $invoice->amount_paid,
                    'balance_due' => $invoice->balance_due,
                    'created_at' => $invoice->created_at,
                    'issued_at' => $invoice->issued_at,
                    'paid_at' => $invoice->paid_at,
                ];
            })
            ->toArray();
    }

    /**
     * Legacy methods for backward compatibility
     */
    public function calculateTax()
    {
        $billing = $this->calculateBilling();
        return $billing['success'] ? $billing['billing']['total_tax'] : 0;
    }

    public function calculateServiceCharge()
    {
        $billing = $this->calculateBilling();
        return $billing['success'] ? $billing['billing']['total_service_charges'] : 0;
    }
}