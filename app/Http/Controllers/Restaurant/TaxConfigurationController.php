<?php

namespace App\Http\Controllers\Restaurant;

use App\Http\Controllers\Controller;
use App\Models\TaxConfiguration;
use App\Services\Restaurant\TaxConfigurationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class TaxConfigurationController extends Controller
{
    protected TaxConfigurationService $taxService;

    public function __construct(TaxConfigurationService $taxService)
    {
        $this->taxService = $taxService;
        
        // Apply middleware for permissions
        $this->middleware('permission:restaurant.tax.view')->only(['index', 'show', 'getApplicableTaxes', 'checkTaxExemption']);
        $this->middleware('permission:restaurant.tax.create')->only(['store']);
        $this->middleware('permission:restaurant.tax.update')->only(['update']);
        $this->middleware('permission:restaurant.tax.delete')->only(['destroy']);
        $this->middleware('permission:restaurant.tax.calculate')->only(['calculateTaxes']);
    }

    /**
     * Display a listing of tax configurations.
     */
    public function index(Request $request): JsonResponse
    {
        $query = TaxConfiguration::byStore($request->user()->store_id);

        // Filter by tax type
        if ($request->has('tax_type')) {
            $query->where('tax_type', $request->tax_type);
        }

        // Filter by status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Filter by date
        if ($request->has('as_of_date')) {
            $query->where('effective_from', '<=', $request->as_of_date)
                  ->where(function ($q) use ($request) {
                      $q->whereNull('effective_to')
                        ->orWhere('effective_to', '>=', $request->as_of_date);
                  });
        }

        $taxConfigs = $query->orderBy('tax_type')
            ->orderBy('effective_from', 'desc')
            ->get();

        return response()->json($taxConfigs);
    }

    /**
     * Store a newly created tax configuration.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tax_code' => 'required|string|max:20',
            'tax_name' => 'required|string|max:100',
            'rate' => 'required|numeric|min:0|max:1',
            'tax_type' => 'required|in:vat,service_tax,sales_tax,excise,other',
            'is_compound' => 'boolean',
            'compound_tax_codes' => 'nullable|array',
            'compound_tax_codes.*' => 'string',
            'is_active' => 'boolean',
            'effective_from' => 'required|date',
            'effective_to' => 'nullable|date|after:effective_from',
            'applicable_categories' => 'nullable|array',
            'applicable_categories.*' => 'integer',
            'exempt_categories' => 'nullable|array',
            'exempt_categories.*' => 'integer',
            'applicable_products' => 'nullable|array',
            'applicable_products.*' => 'integer',
            'exempt_products' => 'nullable|array',
            'exempt_products.*' => 'integer',
            'applicable_locations' => 'nullable|array',
            'applicable_locations.*' => 'string',
            'is_default' => 'boolean',
            'reporting_category' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        try {
            $validated['store_id'] = $request->user()->store_id;
            
            $taxConfig = TaxConfiguration::create($validated);

            return response()->json($taxConfig, 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to create tax configuration: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified tax configuration.
     */
    public function show(TaxConfiguration $taxConfiguration): JsonResponse
    {
        return response()->json($taxConfiguration);
    }

    /**
     * Update the specified tax configuration.
     */
    public function update(Request $request, TaxConfiguration $taxConfiguration): JsonResponse
    {
        $validated = $request->validate([
            'tax_name' => 'sometimes|string|max:100',
            'rate' => 'sometimes|numeric|min:0|max:1',
            'tax_type' => 'sometimes|in:vat,service_tax,sales_tax,excise,other',
            'is_compound' => 'sometimes|boolean',
            'compound_tax_codes' => 'sometimes|array',
            'compound_tax_codes.*' => 'string',
            'is_active' => 'sometimes|boolean',
            'effective_from' => 'sometimes|date',
            'effective_to' => 'sometimes|nullable|date|after:effective_from',
            'applicable_categories' => 'sometimes|array',
            'applicable_categories.*' => 'integer',
            'exempt_categories' => 'sometimes|array',
            'exempt_categories.*' => 'integer',
            'applicable_products' => 'sometimes|array',
            'applicable_products.*' => 'integer',
            'exempt_products' => 'sometimes|array',
            'exempt_products.*' => 'integer',
            'applicable_locations' => 'sometimes|array',
            'applicable_locations.*' => 'string',
            'is_default' => 'sometimes|boolean',
            'reporting_category' => 'sometimes|nullable|string|max:50',
            'description' => 'sometimes|nullable|string',
            'metadata' => 'sometimes|array',
        ]);

        try {
            $taxConfiguration->update($validated);

            return response()->json($taxConfiguration->fresh());
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to update tax configuration: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified tax configuration.
     */
    public function destroy(TaxConfiguration $taxConfiguration): JsonResponse
    {
        try {
            $taxConfiguration->delete();

            return response()->json(['message' => 'Tax configuration deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to delete tax configuration: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Calculate taxes for a given amount and context.
     */
    public function calculateTaxes(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'context' => 'required|array',
            'context.store_id' => 'required|integer',
            'context.order_type' => 'nullable|string',
            'context.location_code' => 'nullable|string',
            'context.customer_type' => 'nullable|in:individual,business,tax_exempt',
            'context.product_id' => 'nullable|integer',
            'context.category_id' => 'nullable|integer',
            'context.tax_codes' => 'nullable|array',
            'context.tax_codes.*' => 'string',
        ]);

        try {
            $taxes = $this->taxService->calculateTaxes($validated['amount'], $validated['context']);

            return response()->json([
                'taxes' => $taxes,
                'total_tax' => array_sum(array_column($taxes, 'amount')),
                'effective_rate' => $validated['amount'] > 0 ? array_sum(array_column($taxes, 'amount')) / $validated['amount'] : 0,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to calculate taxes: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get applicable taxes for a product.
     */
    public function getApplicableTaxes(Request $request, int $productId): JsonResponse
    {
        $validated = $request->validate([
            'store_id' => 'required|integer',
            'location_code' => 'nullable|string',
            'customer_type' => 'nullable|in:individual,business,tax_exempt',
            'order_type' => 'nullable|string',
        ]);

        try {
            $context = [
                'store_id' => $validated['store_id'],
                'product_id' => $productId,
                'location_code' => $validated['location_code'] ?? null,
                'customer_type' => $validated['customer_type'] ?? 'individual',
                'order_type' => $validated['order_type'] ?? null,
            ];

            $applicableTaxes = $this->taxService->getApplicableTaxes($productId, $context);

            return response()->json($applicableTaxes);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to get applicable taxes: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Check if a product is tax exempt.
     */
    public function checkTaxExemption(Request $request, int $productId): JsonResponse
    {
        $validated = $request->validate([
            'store_id' => 'required|integer',
            'tax_code' => 'required|string',
            'location_code' => 'nullable|string',
            'customer_type' => 'nullable|in:individual,business,tax_exempt',
        ]);

        try {
            $isExempt = $this->taxService->isTaxExempt(
                $productId,
                $validated['tax_code'],
                $validated['store_id'],
                $validated['location_code'] ?? null,
                $validated['customer_type'] ?? 'individual'
            );

            return response()->json([
                'is_exempt' => $isExempt,
                'product_id' => $productId,
                'tax_code' => $validated['tax_code'],
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to check tax exemption: ' . $e->getMessage()], 500);
        }
    }
}