<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StockTransferRequest extends FormRequest
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
            'from_store_id' => 'required|integer|exists:stores,id',
            'to_store_id' => 'required|integer|exists:stores,id|different:from_store_id',
            'transfer_reason' => 'required|string|in:relocation,stock_balance,emergency,seasonal,promotion',
            'reference_number' => 'nullable|string|max:50',
            'expected_delivery_date' => 'nullable|date|after_or_equal:today',
            'notes' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.batch_id' => 'nullable|integer|exists:product_batches,id',
            'items.*.priority' => 'nullable|string|in:normal,urgent,critical',
            'items.*.notes' => 'nullable|string|max:200',
            'auto_approve' => 'boolean',
            'requires_approval' => 'boolean',
            'approver_id' => 'nullable|integer|exists:users,id',
        ];
    }

    /**
     * Get custom error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'from_store_id.required' => 'Source store ID is required.',
            'from_store_id.exists' => 'Source store does not exist.',
            'to_store_id.required' => 'Destination store ID is required.',
            'to_store_id.exists' => 'Destination store does not exist.',
            'to_store_id.different' => 'Source and destination stores must be different.',
            'transfer_reason.required' => 'Transfer reason is required.',
            'transfer_reason.in' => 'Invalid transfer reason. Must be one of: relocation, stock_balance, emergency, seasonal, promotion.',
            'expected_delivery_date.after_or_equal' => 'Expected delivery date cannot be in the past.',
            'items.required' => 'At least one item is required for stock transfer.',
            'items.*.product_id.required' => 'Product ID is required for each item.',
            'items.*.product_id.exists' => 'One or more products do not exist.',
            'items.*.quantity.required' => 'Quantity is required for each item.',
            'items.*.quantity.min' => 'Quantity must be greater than 0.',
            'items.*.batch_id.exists' => 'One or more specified batches do not exist.',
            'items.*.priority.in' => 'Priority must be one of: normal, urgent, critical.',
            'approver_id.exists' => 'The specified approver does not exist.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $this->validateStorePermissions($validator);
            $this->validateStockAvailability($validator);
            $this->validateBatchOwnership($validator);
            $this->validateTransferRules($validator);
            $this->validateApprovalRequirements($validator);
        });
    }

    /**
     * Validate user permissions for stores
     */
    private function validateStorePermissions(Validator $validator): void
    {
        $fromStoreId = $this->input('from_store_id');
        $toStoreId = $this->input('to_store_id');
        $userId = Auth::id();

        // Check if user has permission for source store
        $hasFromStorePermission = DB::table('user_stores')
            ->where('user_id', $userId)
            ->where('store_id', $fromStoreId)
            ->exists();

        if (!$hasFromStorePermission) {
            $validator->errors()->add('from_store_id', 
                'You do not have permission to transfer stock from the source store.');
        }

        // Check if user has permission for destination store
        $hasToStorePermission = DB::table('user_stores')
            ->where('user_id', $userId)
            ->where('store_id', $toStoreId)
            ->exists();

        if (!$hasToStorePermission) {
            $validator->errors()->add('to_store_id', 
                'You do not have permission to transfer stock to the destination store.');
        }
    }

    /**
     * Validate stock availability at source store
     */
    private function validateStockAvailability(Validator $validator): void
    {
        $fromStoreId = $this->input('from_store_id');
        $items = $this->input('items');

        foreach ($items as $index => $item) {
            $productId = $item['product_id'];
            $requestedQuantity = $item['quantity'];
            $batchId = $item['batch_id'] ?? null;

            // Get available stock at source store
            $availableStock = $this->getAvailableStock($fromStoreId, $productId, $batchId);

            if ($availableStock < $requestedQuantity) {
                $validator->errors()->add("items.{$index}.quantity", 
                    "Insufficient stock at source store for product ID {$productId}. Available: {$availableStock}, Requested: {$requestedQuantity}");
            }
        }
    }

    /**
     * Validate batch ownership and validity
     */
    private function validateBatchOwnership(Validator $validator): void
    {
        $fromStoreId = $this->input('from_store_id');
        $items = $this->input('items');

        foreach ($items as $index => $item) {
            $productId = $item['product_id'];
            $batchId = $item['batch_id'] ?? null;

            if ($batchId) {
                // Validate that batch belongs to the product and source store
                $batchExists = DB::table('product_stocks')
                    ->join('product_batches', 'product_stocks.batch_id', '=', 'product_batches.id')
                    ->where('product_stocks.store_id', $fromStoreId)
                    ->where('product_stocks.product_id', $productId)
                    ->where('product_stocks.batch_id', $batchId)
                    ->exists();

                if (!$batchExists) {
                    $validator->errors()->add("items.{$index}.batch_id", 
                        'The specified batch does not exist at the source store for this product.');
                }

                // Check if batch is expired
                $batch = DB::table('product_batches')
                    ->where('id', $batchId)
                    ->first();

                if ($batch && $batch->expiry_date && $batch->expiry_date->isPast()) {
                    $validator->errors()->add("items.{$index}.batch_id", 
                        'Cannot transfer expired items.');
                }
            }
        }
    }

    /**
     * Validate transfer business rules
     */
    private function validateTransferRules(Validator $validator): void
    {
        $transferReason = $this->input('transfer_reason');
        $expectedDeliveryDate = $this->input('expected_delivery_date');

        // Validate delivery date based on transfer reason
        if ($transferReason === 'emergency' && $expectedDeliveryDate) {
            $maxDays = 3; // Emergency transfers should be delivered within 3 days
            if (now()->diffInDays($expectedDeliveryDate) > $maxDays) {
                $validator->errors()->add('expected_delivery_date', 
                    "Emergency transfers must be delivered within {$maxDays} days.");
            }
        }

        // Check for duplicate transfer reference
        $referenceNumber = $this->input('reference_number');
        if ($referenceNumber) {
            $existingTransfer = DB::table('inventory_transfers')
                ->where('reference_number', $referenceNumber)
                ->whereNotIn('status', ['cancelled', 'completed'])
                ->exists();

            if ($existingTransfer) {
                $validator->errors()->add('reference_number', 
                    'A transfer with this reference number is already in progress.');
            }
        }
    }

    /**
     * Validate approval requirements
     */
    private function validateApprovalRequirements(Validator $validator): void
    {
        $requiresApproval = $this->input('requires_approval', false);
        $autoApprove = $this->input('auto_approve', false);
        $approverId = $this->input('approver_id');

        if ($requiresApproval && $autoApprove) {
            $validator->errors()->add('auto_approve', 
                'Transfer cannot both require approval and be auto-approved.');
        }

        if ($requiresApproval && !$approverId) {
            $validator->errors()->add('approver_id', 
                'Approver ID is required when approval is required.');
        }

        if ($approverId) {
            // Validate that approver has appropriate permissions
            $approverHasPermission = DB::table('users')
                ->join('user_stores', 'users.id', '=', 'user_stores.user_id')
                ->where('users.id', $approverId)
                ->where('user_stores.store_id', $this->input('to_store_id'))
                ->whereExists(function ($query) {
                    $query->select(DB::raw(1))
                        ->from('model_has_permissions')
                        ->whereColumn('model_has_permissions.model_id', 'users.id')
                        ->where('model_has_permissions.permission_id', function ($subQuery) {
                            $subQuery->select('id')
                                ->from('permissions')
                                ->where('name', 'approve-inventory-transfers');
                        });
                })
                ->exists();

            if (!$approverHasPermission) {
                $validator->errors()->add('approver_id', 
                    'The specified approver does not have permission to approve inventory transfers.');
            }
        }
    }

    /**
     * Get available stock for a product at a store
     */
    private function getAvailableStock(int $storeId, int $productId, ?int $batchId = null): float
    {
        $query = DB::table('product_stocks')
            ->where('store_id', $storeId)
            ->where('product_id', $productId);

        if ($batchId) {
            $query->where('batch_id', $batchId);
        }

        $stock = $query->selectRaw('SUM(available_quantity) as available')
            ->value('available');

        return $stock ?? 0;
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'from_store_id' => 'source store',
            'to_store_id' => 'destination store',
            'transfer_reason' => 'transfer reason',
            'reference_number' => 'reference number',
            'expected_delivery_date' => 'expected delivery date',
            'notes' => 'notes',
            'items' => 'items',
            'items.*.product_id' => 'product',
            'items.*.quantity' => 'quantity',
            'items.*.batch_id' => 'batch',
            'items.*.priority' => 'priority',
            'items.*.notes' => 'item notes',
            'auto_approve' => 'auto approve',
            'requires_approval' => 'requires approval',
            'approver_id' => 'approver',
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
                'message' => 'Stock transfer validation failed',
                'errors' => $validator->errors(),
            ], 422)
        );
    }
}