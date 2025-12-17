<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class InventoryOperationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return Auth::check();
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'store_id' => 'required|integer|exists:stores,id',
            'operation_type' => 'required|string|in:reservation,deduction,release,addition,adjustment,transfer',
            'reference_type' => 'nullable|string|in:order,purchase,return,waste,transfer,adjustment',
            'reference_id' => 'nullable|integer',
            'notes' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.batch_number' => 'nullable|string|max:50',
            'items.*.expiry_date' => 'nullable|date|after_or_equal:today',
            'items.*.unit_cost' => 'nullable|numeric|min:0',
            'items.*.location' => 'nullable|string|max:100',
            'items.*.bin_location' => 'nullable|string|max:50',
            'items.*.notes' => 'nullable|string|max:200',
        ];
    }

    /**
     * Get custom error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'store_id.required' => 'Store ID is required for inventory operations.',
            'store_id.exists' => 'The selected store does not exist.',
            'operation_type.required' => 'Operation type is required.',
            'operation_type.in' => 'Invalid operation type. Must be one of: reservation, deduction, release, addition, adjustment, transfer.',
            'reference_type.in' => 'Invalid reference type. Must be one of: order, purchase, return, waste, transfer, adjustment.',
            'items.required' => 'At least one item is required for inventory operations.',
            'items.*.product_id.required' => 'Product ID is required for each item.',
            'items.*.product_id.exists' => 'One or more products do not exist.',
            'items.*.quantity.required' => 'Quantity is required for each item.',
            'items.*.quantity.min' => 'Quantity must be greater than 0.',
            'items.*.expiry_date.after_or_equal' => 'Expiry date cannot be in the past.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $this->validateStockAvailability($validator);
            $this->validateBatchConsistency($validator);
            $this->validateBusinessRules($validator);
        });
    }

    /**
     * Validate stock availability for reservations and deductions
     */
    private function validateStockAvailability(Validator $validator): void
    {
        $operationType = $this->input('operation_type');
        
        if (!in_array($operationType, ['reservation', 'deduction'])) {
            return;
        }

        $storeId = $this->input('store_id');
        $items = $this->input('items');

        foreach ($items as $index => $item) {
            $productId = $item['product_id'];
            $requestedQuantity = $item['quantity'];
            $batchNumber = $item['batch_number'] ?? null;

            // Check stock availability
            $availableStock = $this->getAvailableStock($storeId, $productId, $batchNumber);

            if ($availableStock < $requestedQuantity) {
                $validator->errors()->add("items.{$index}.quantity", 
                    "Insufficient stock for product ID {$productId}. Available: {$availableStock}, Requested: {$requestedQuantity}");
            }
        }
    }

    /**
     * Validate batch consistency
     */
    private function validateBatchConsistency(Validator $validator): void
    {
        $items = $this->input('items');
        $operationType = $this->input('operation_type');

        if ($operationType === 'addition') {
            // For additions, validate batch information
            foreach ($items as $index => $item) {
                if (empty($item['batch_number'])) {
                    $validator->errors()->add("items.{$index}.batch_number", 
                        'Batch number is required for stock additions.');
                }

                if (empty($item['expiry_date'])) {
                    $validator->errors()->add("items.{$index}.expiry_date", 
                        'Expiry date is required for stock additions.');
                }
            }
        }
    }

    /**
     * Validate business rules
     */
    private function validateBusinessRules(Validator $validator): void
    {
        $operationType = $this->input('operation_type');
        $referenceType = $this->input('reference_type');
        $referenceId = $this->input('reference_id');

        // Validate reference consistency
        if ($referenceType && !$referenceId) {
            $validator->errors()->add('reference_id', 
                'Reference ID is required when reference type is specified.');
        }

        if ($referenceId && !$referenceType) {
            $validator->errors()->add('reference_type', 
                'Reference type is required when reference ID is specified.');
        }

        // Validate operation-specific rules
        switch ($operationType) {
            case 'reservation':
                if ($referenceType !== 'order') {
                    $validator->errors()->add('reference_type', 
                        'Reservations must be linked to an order.');
                }
                break;

            case 'deduction':
                if (!in_array($referenceType, ['order', 'waste'])) {
                    $validator->errors()->add('reference_type', 
                        'Deductions must be linked to an order or waste record.');
                }
                break;

            case 'addition':
                if ($referenceType !== 'purchase') {
                    $validator->errors()->add('reference_type', 
                        'Additions must be linked to a purchase.');
                }
                break;
        }
    }

    /**
     * Get available stock for a product
     */
    private function getAvailableStock(int $storeId, int $productId, ?string $batchNumber = null): float
    {
        $query = \App\Models\ProductStock::where('store_id', $storeId)
            ->where('product_id', $productId);

        if ($batchNumber) {
            $query->whereHas('batch', function ($q) use ($batchNumber) {
                $q->where('batch_number', $batchNumber);
            });
        }

        $stock = $query->first();

        return $stock ? $stock->available_quantity : 0;
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'store_id' => 'store',
            'operation_type' => 'operation type',
            'reference_type' => 'reference type',
            'reference_id' => 'reference ID',
            'notes' => 'notes',
            'items' => 'items',
            'items.*.product_id' => 'product',
            'items.*.quantity' => 'quantity',
            'items.*.batch_number' => 'batch number',
            'items.*.expiry_date' => 'expiry date',
            'items.*.unit_cost' => 'unit cost',
            'items.*.location' => 'location',
            'items.*.bin_location' => 'bin location',
            'items.*.notes' => 'item notes',
        ];
    }

    /**
     * Handle a failed validation attempt.
     */
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422)
        );
    }
}