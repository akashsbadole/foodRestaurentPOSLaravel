<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StockReservationRequest extends FormRequest
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
            'order_id' => 'required|integer|exists:restaurant_orders,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.batch_preference' => 'nullable|string|in:fifo,fefo,specific',
            'items.*.specific_batch_id' => 'nullable|integer|exists:product_batches,id',
            'items.*.notes' => 'nullable|string|max:200',
            'auto_release' => 'boolean',
            'release_timeout_minutes' => 'nullable|integer|min:5|max:1440', // 5 minutes to 24 hours
        ];
    }

    /**
     * Get custom error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'store_id.required' => 'Store ID is required for stock reservation.',
            'order_id.required' => 'Order ID is required for stock reservation.',
            'items.required' => 'At least one item is required for stock reservation.',
            'items.*.product_id.required' => 'Product ID is required for each item.',
            'items.*.product_id.exists' => 'One or more products do not exist.',
            'items.*.quantity.required' => 'Quantity is required for each item.',
            'items.*.quantity.min' => 'Quantity must be greater than 0.',
            'items.*.batch_preference.in' => 'Batch preference must be one of: fifo, fefo, specific.',
            'items.*.specific_batch_id.exists' => 'The specified batch does not exist.',
            'release_timeout_minutes.min' => 'Release timeout must be at least 5 minutes.',
            'release_timeout_minutes.max' => 'Release timeout cannot exceed 24 hours.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $this->validateOrderStatus($validator);
            $this->validateStockAvailability($validator);
            $this->validateBatchPreferences($validator);
            $this->validateProductInventoryTracking($validator);
        });
    }

    /**
     * Validate order status
     */
    private function validateOrderStatus(Validator $validator): void
    {
        $orderId = $this->input('order_id');
        
        $order = DB::table('restaurant_orders')
            ->where('id', $orderId)
            ->first();

        if (!$order) {
            $validator->errors()->add('order_id', 'Order not found.');
            return;
        }

        // Check if order is in a valid status for reservation
        $validStatuses = ['pending', 'confirmed', 'preparing'];
        if (!in_array($order->status, $validStatuses)) {
            $validator->errors()->add('order_id', 
                "Cannot reserve stock for order with status: {$order->status}. Order must be pending, confirmed, or preparing.");
        }

        // Check if stock is already reserved for this order
        $existingReservation = DB::table('inventory_transactions')
            ->where('reference_type', 'order')
            ->where('reference_id', $orderId)
            ->where('transaction_type', 'reservation')
            ->where('status', 'active')
            ->exists();

        if ($existingReservation) {
            $validator->errors()->add('order_id', 
                'Stock is already reserved for this order.');
        }
    }

    /**
     * Validate stock availability
     */
    private function validateStockAvailability(Validator $validator): void
    {
        $storeId = $this->input('store_id');
        $items = $this->input('items');

        foreach ($items as $index => $item) {
            $productId = $item['product_id'];
            $requestedQuantity = $item['quantity'];
            $batchPreference = $item['batch_preference'] ?? 'fifo';
            $specificBatchId = $item['specific_batch_id'] ?? null;

            // Get available stock based on batch preference
            $availableStock = $this->getAvailableStockByPreference(
                $storeId, 
                $productId, 
                $batchPreference, 
                $specificBatchId
            );

            if ($availableStock < $requestedQuantity) {
                $validator->errors()->add("items.{$index}.quantity", 
                    "Insufficient stock for product ID {$productId}. Available: {$availableStock}, Requested: {$requestedQuantity}");
            }
        }
    }

    /**
     * Validate batch preferences
     */
    private function validateBatchPreferences(Validator $validator): void
    {
        $items = $this->input('items');

        foreach ($items as $index => $item) {
            $batchPreference = $item['batch_preference'] ?? 'fifo';
            $specificBatchId = $item['specific_batch_id'] ?? null;

            if ($batchPreference === 'specific' && !$specificBatchId) {
                $validator->errors()->add("items.{$index}.specific_batch_id", 
                    'Specific batch ID is required when batch preference is set to "specific".');
            }

            if ($specificBatchId) {
                // Validate that the specific batch belongs to the product and has stock
                $batch = DB::table('product_batches')
                    ->where('id', $specificBatchId)
                    ->where('product_id', $item['product_id'])
                    ->first();

                if (!$batch) {
                    $validator->errors()->add("items.{$index}.specific_batch_id", 
                        'The specified batch does not belong to this product.');
                } elseif ($batch->quantity <= 0) {
                    $validator->errors()->add("items.{$index}.specific_batch_id", 
                        'The specified batch has no available stock.');
                }
            }
        }
    }

    /**
     * Validate that products have inventory tracking enabled
     */
    private function validateProductInventoryTracking(Validator $validator): void
    {
        $items = $this->input('items');

        foreach ($items as $index => $item) {
            $product = DB::table('products')
                ->where('id', $item['product_id'])
                ->first();

            if (!$product || !$product->track_inventory) {
                $validator->errors()->add("items.{$index}.product_id", 
                    'Inventory tracking is not enabled for this product.');
            }
        }
    }

    /**
     * Get available stock based on batch preference
     */
    private function getAvailableStockByPreference(
        int $storeId, 
        int $productId, 
        string $preference, 
        ?int $specificBatchId = null
    ): float {
        switch ($preference) {
            case 'specific':
                if ($specificBatchId) {
                    $stock = DB::table('product_stocks')
                        ->join('product_batches', 'product_stocks.batch_id', '=', 'product_batches.id')
                        ->where('product_stocks.store_id', $storeId)
                        ->where('product_stocks.product_id', $productId)
                        ->where('product_stocks.batch_id', $specificBatchId)
                        ->selectRaw('SUM(product_stocks.available_quantity) as available')
                        ->value('available');
                    
                    return $stock ?? 0;
                }
                break;

            case 'fifo':
                // First In, First Out - sum all available stock
                $stock = DB::table('product_stocks')
                    ->where('store_id', $storeId)
                    ->where('product_id', $productId)
                    ->selectRaw('SUM(available_quantity) as available')
                    ->value('available');
                
                return $stock ?? 0;

            case 'fefo':
                // First Expired, First Out - sum all available stock
                $stock = DB::table('product_stocks')
                    ->join('product_batches', 'product_stocks.batch_id', '=', 'product_batches.id')
                    ->where('product_stocks.store_id', $storeId)
                    ->where('product_stocks.product_id', $productId)
                    ->whereNotNull('product_batches.expiry_date')
                    ->selectRaw('SUM(product_stocks.available_quantity) as available')
                    ->value('available');
                
                return $stock ?? 0;
        }

        return 0;
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'store_id' => 'store',
            'order_id' => 'order',
            'items' => 'items',
            'items.*.product_id' => 'product',
            'items.*.quantity' => 'quantity',
            'items.*.batch_preference' => 'batch preference',
            'items.*.specific_batch_id' => 'specific batch',
            'items.*.notes' => 'item notes',
            'auto_release' => 'auto release',
            'release_timeout_minutes' => 'release timeout',
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
                'message' => 'Stock reservation validation failed',
                'errors' => $validator->errors(),
            ], 422)
        );
    }
}