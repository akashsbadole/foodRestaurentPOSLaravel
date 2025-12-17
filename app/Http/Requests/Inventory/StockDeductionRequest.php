<?php

namespace App\Http\Requests\Inventory;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class StockDeductionRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'order_items' => 'required|array|min:1',
            'order_items.*.product_id' => [
                'required',
                'integer',
                'exists:products,id',
                Rule::exists('product_stocks', function ($query) {
                    $query->where('store_id', $this->store_id);
                })
            ],
            'order_items.*.quantity' => [
                'required',
                'numeric',
                'min:0.01',
                'regex:/^\d+(\.\d{1,2})?$/',
            ],
            'order_items.*.reference_type' => 'nullable|string|in:restaurant_order,restaurant_payment,restaurant_refund,adjustment,waste',
            'order_items.*.reference_id' => 'nullable|integer',
            'order_items.*.batch_id' => 'nullable|exists:product_batches,id',
            'store_id' => [
                'required',
                'integer',
                'exists:stores,id',
            ],
            'deduction_reason' => 'nullable|string|max:500',
            'performed_by' => 'nullable|exists:users,id',
            'deduction_date' => 'nullable|date|before_or_equal:today',
        ];
    }

    public function messages()
    {
        return [
            'order_items.required' => 'At least one order item is required',
            'order_items.*.product_id.required' => 'Product ID is required for each order item',
            'order_items.*.product_id.exists' => 'Selected product does not exist',
            'order_items.*.product_id.exists_stock' => 'Product is not available in the specified store',
            'order_items.*.quantity.required' => 'Quantity is required for each order item',
            'order_items.*.quantity.numeric' => 'Quantity must be a valid number',
            'order_items.*.quantity.min' => 'Quantity must be greater than 0',
            'order_items.*.quantity.regex' => 'Quantity can have maximum 2 decimal places',
            'order_items.*.reference_type.in' => 'Invalid reference type',
            'order_items.*.batch_id.exists' => 'Selected batch does not exist',
            'store_id.required' => 'Store ID is required',
            'store_id.exists' => 'Selected store does not exist',
            'deduction_reason.max' => 'Deduction reason cannot exceed 500 characters',
            'performed_by.exists' => 'Selected user does not exist',
            'deduction_date.before_or_equal' => 'Deduction date cannot be in the future',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $orderItems = $this->input('order_items', []);
            
            foreach ($orderItems as $index => $item) {
                $productId = $item['product_id'] ?? null;
                $quantity = $item['quantity'] ?? 0;
                $batchId = $item['batch_id'] ?? null;
                
                if ($productId && $quantity > 0) {
                    // Check if product is stock managed
                    $product = \App\Models\Product::find($productId);
                    
                    if ($product && $product->track_inventory) {
                        // Check stock availability
                        $stock = \App\Models\ProductStock::where('product_id', $productId)
                            ->where('store_id', $this->store_id)
                            ->first();
                        
                        if (!$stock || $stock->available_quantity < $quantity) {
                            $available = $stock?->available_quantity ?? 0;
                            $validator->errors()->add("order_items.{$index}.quantity", 
                                "Insufficient stock for {$product->name}. Available: {$available}, Required: {$quantity}");
                        }
                        
                        // Check batch validity if specified
                        if ($batchId) {
                            $batch = \App\Models\ProductBatch::find($batchId);
                            
                            if (!$batch || $batch->product_id != $productId) {
                                $validator->errors()->add("order_items.{$index}.batch_id", 
                                    "Selected batch does not belong to the specified product");
                            }
                            
                            if ($batch && $batch->expiry_date && $batch->expiry_date->isPast()) {
                                $validator->errors()->add("order_items.{$index}.batch_id", 
                                    "Selected batch has expired on {$batch->expiry_date->format('Y-m-d')}");
                            }
                            
                            if ($batch && $batch->quantity < $quantity) {
                                $available = $batch->quantity ?? 0;
                                $validator->errors()->add("order_items.{$index}.quantity", 
                                    "Insufficient quantity in selected batch. Available: {$available}, Required: {$quantity}");
                            }
                        }
                        
                        // Check for reserved stock
                        if ($stock && $stock->reserved_quantity < $quantity) {
                            $reserved = $stock->reserved_quantity ?? 0;
                            $validator->errors()->add("order_items.{$index}.quantity", 
                                "Only {$reserved} units are reserved for {$product->name}. Required: {$quantity}");
                        }
                    }
                }
            }
        });
    }

    protected function prepareForValidation()
    {
        // Convert string quantities to float
        if ($this->has('order_items')) {
            $orderItems = $this->input('order_items');
            
            foreach ($orderItems as &$item) {
                if (isset($item['quantity']) && is_string($item['quantity'])) {
                    $item['quantity'] = (float) $item['quantity'];
                }
            }
            
            $this->merge(['order_items' => $orderItems]);
        }
    }
}