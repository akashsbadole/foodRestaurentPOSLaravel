<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SplitBillingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('restaurant.billing.split');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'split_type' => [
                'required',
                Rule::in(['equal', 'percentage', 'custom', 'item_based']),
            ],
            'splits' => 'required|array|min:2',
            'splits.*.name' => 'required|string|max:100',
            'splits.*.percentage' => 'required_if:split_type,percentage|numeric|min:0|max:100',
            'splits.*.amount' => 'required_if:split_type,custom|numeric|min:0',
            'splits.*.items' => 'required_if:split_type,item_based|array',
            'splits.*.items.*' => 'integer|exists:restaurant_order_items,id',
        ];
    }

    /**
     * Get custom error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'split_type.required' => 'Split type is required.',
            'split_type.in' => 'Split type must be one of: equal, percentage, custom, item_based.',
            
            'splits.required' => 'At least 2 splits are required.',
            'splits.min' => 'At least 2 splits are required.',
            
            'splits.*.name.required' => 'Split name is required.',
            'splits.*.name.max' => 'Split name cannot exceed 100 characters.',
            
            'splits.*.percentage.required_if' => 'Percentage is required when split type is percentage.',
            'splits.*.percentage.numeric' => 'Percentage must be a number.',
            'splits.*.percentage.min' => 'Percentage cannot be negative.',
            'splits.*.percentage.max' => 'Percentage cannot exceed 100%.',
            
            'splits.*.amount.required_if' => 'Amount is required when split type is custom.',
            'splits.*.amount.numeric' => 'Amount must be a number.',
            'splits.*.amount.min' => 'Amount cannot be negative.',
            
            'splits.*.items.required_if' => 'Items are required when split type is item_based.',
            'splits.*.items.array' => 'Items must be an array.',
            'splits.*.items.*.exists' => 'Selected item does not exist.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Validate split billing is enabled
            if (!setting('restaurant.enable_split_billing', true, $this->user()->store_id)) {
                $validator->errors()->add('split_type', 'Split billing is not enabled for this store.');
            }

            // For percentage splits, validate total equals 100%
            if ($this->input('split_type') === 'percentage') {
                $totalPercentage = collect($this->input('splits', []))->sum('percentage');
                if (abs($totalPercentage - 100) > 0.01) { // Allow small floating point differences
                    $validator->errors()->add('splits', 'Total percentage must equal 100%. Current total: ' . $totalPercentage . '%');
                }
            }

            // For custom splits, validate total matches order total
            if ($this->input('split_type') === 'custom') {
                $order = $this->route('order');
                if ($order) {
                    $totalSplitAmount = collect($this->input('splits', []))->sum('amount');
                    if (abs($totalSplitAmount - $order->final_total) > 0.01) { // Allow small floating point differences
                        $validator->errors()->add('splits', 'Total split amount must equal order total. Order total: ' . $order->final_total . ', Split total: ' . $totalSplitAmount);
                    }
                }
            }

            // For item-based splits, validate all items are assigned and no duplicates
            if ($this->input('split_type') === 'item_based') {
                $order = $this->route('order');
                if ($order) {
                    $allSplitItems = collect($this->input('splits', []))->flatMap->items->toArray();
                    $orderItemIds = $order->items->pluck('id')->toArray();

                    // Check for unassigned items
                    $unassignedItems = array_diff($orderItemIds, $allSplitItems);
                    if (!empty($unassignedItems)) {
                        $validator->errors()->add('splits', 'All order items must be assigned to a split. Unassigned items: ' . implode(', ', $unassignedItems));
                    }

                    // Check for duplicate items
                    $duplicateItems = array_diff_assoc($allSplitItems, array_unique($allSplitItems));
                    if (!empty($duplicateItems)) {
                        $validator->errors()->add('splits', 'Items cannot be assigned to multiple splits. Duplicates: ' . implode(', ', array_unique($duplicateItems)));
                    }

                    // Check for invalid items
                    $invalidItems = array_diff($allSplitItems, $orderItemIds);
                    if (!empty($invalidItems)) {
                        $validator->errors()->add('splits', 'Invalid items found: ' . implode(', ', $invalidItems));
                    }
                }
            }

            // Validate minimum number of splits
            if (count($this->input('splits', [])) < 2) {
                $validator->errors()->add('splits', 'At least 2 splits are required for split billing.');
            }

            // Validate maximum number of splits (reasonable limit)
            if (count($this->input('splits', [])) > 20) {
                $validator->errors()->add('splits', 'Cannot create more than 20 splits.');
            }
        });
    }
}