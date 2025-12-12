<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;

class StoreRestaurantOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize()
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules()
    {
        return [
            'table_id' => 'nullable|exists:restaurant_tables,id',
            'order_type' => 'required|in:dine_in,takeaway,delivery',
            'customer_count' => 'required|integer|min:1|max:50',
            'waiter_id' => 'nullable|exists:users,id',
            'contact_id' => 'nullable|exists:contacts,id',
            'priority' => 'nullable|in:low,normal,high,urgent',
            'special_instructions' => 'nullable|string|max:1000',
            'estimated_time' => 'nullable|integer|min:1',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'items.*.special_instructions' => 'nullable|string|max:500',
            'items.*.preparation_notes' => 'nullable|string|max:500',
            'items.*.course_number' => 'nullable|integer|min:1|max:10',
            'items.*.is_complimentary' => 'nullable|boolean',
            'items.*.modifiers' => 'nullable|array',
            'items.*.modifiers.*.modifier_id' => 'required|exists:menu_modifiers,id',
            'items.*.modifiers.*.quantity' => 'required|numeric|min:0.01',
            'items.*.modifiers.*.price_adjustment' => 'required|numeric',
        ];
    }

    /**
     * Get custom error messages for validation rules.
     */
    public function messages()
    {
        return [
            'table_id.exists' => 'The selected table is invalid.',
            'order_type.required' => 'Order type is required.',
            'order_type.in' => 'Order type must be one of: dine_in, takeaway, delivery.',
            'customer_count.required' => 'Customer count is required.',
            'customer_count.min' => 'Customer count must be at least 1.',
            'customer_count.max' => 'Customer count cannot exceed 50.',
            'waiter_id.exists' => 'The selected waiter is invalid.',
            'contact_id.exists' => 'The selected customer is invalid.',
            'priority.in' => 'Priority must be one of: low, normal, high, urgent.',
            'special_instructions.max' => 'Special instructions cannot exceed 1000 characters.',
            'estimated_time.min' => 'Estimated time must be at least 1 minute.',
            'items.required' => 'Order must contain at least one item.',
            'items.min' => 'Order must contain at least one item.',
            'items.*.product_id.required' => 'Product ID is required for each item.',
            'items.*.product_id.exists' => 'The selected product is invalid.',
            'items.*.quantity.required' => 'Quantity is required for each item.',
            'items.*.quantity.min' => 'Quantity must be at least 0.01.',
            'items.*.unit_price.required' => 'Unit price is required for each item.',
            'items.*.unit_price.min' => 'Unit price must be at least 0.',
            'items.*.unit_cost.required' => 'Unit cost is required for each item.',
            'items.*.unit_cost.min' => 'Unit cost must be at least 0.',
            'items.*.discount.min' => 'Discount cannot be negative.',
            'items.*.special_instructions.max' => 'Special instructions for items cannot exceed 500 characters.',
            'items.*.preparation_notes.max' => 'Preparation notes cannot exceed 500 characters.',
            'items.*.course_number.min' => 'Course number must be at least 1.',
            'items.*.course_number.max' => 'Course number cannot exceed 10.',
            'items.*.modifiers.*.modifier_id.required' => 'Modifier ID is required for each modifier.',
            'items.*.modifiers.*.modifier_id.exists' => 'The selected modifier is invalid.',
            'items.*.modifiers.*.quantity.required' => 'Modifier quantity is required.',
            'items.*.modifiers.*.quantity.min' => 'Modifier quantity must be at least 0.01.',
            'items.*.modifiers.*.price_adjustment.required' => 'Price adjustment is required for each modifier.',
        ];
    }
}