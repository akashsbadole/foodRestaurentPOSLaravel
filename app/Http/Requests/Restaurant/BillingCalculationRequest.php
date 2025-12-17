<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BillingCalculationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('restaurant.billing.calculate');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'discounts' => 'nullable|array',
            'discounts.*.type' => [
                'required',
                Rule::in(['percentage', 'fixed', 'promotional']),
            ],
            'discounts.*.value' => 'required|numeric|min:0',
            'discounts.*.reason' => 'nullable|string|max:255',
            
            'service_charges' => 'nullable|array',
            'service_charges.*.type' => [
                'required',
                Rule::in(['percentage', 'fixed']),
            ],
            'service_charges.*.value' => 'required|numeric|min:0',
            'service_charges.*.name' => 'required|string|max:100',
            
            'tax_inclusive' => 'boolean',
            'rounding_rule' => [
                'nullable',
                Rule::in(['nearest_0.05', 'nearest_0.10', 'nearest_1.00', 'always_up', 'always_down', 'standard']),
            ],
            
            'customer_type' => [
                'nullable',
                Rule::in(['individual', 'business', 'tax_exempt']),
            ],
            'location_code' => 'nullable|string|max:50',
            'tax_codes' => 'nullable|array',
            'tax_codes.*' => 'string|max:20',
        ];
    }

    /**
     * Get custom error messages for validation rules.
     */
    public function messages(): array
    {
        return [
            'discounts.*.type.required' => 'Discount type is required.',
            'discounts.*.type.in' => 'Discount type must be one of: percentage, fixed, promotional.',
            'discounts.*.value.required' => 'Discount value is required.',
            'discounts.*.value.numeric' => 'Discount value must be a number.',
            'discounts.*.value.min' => 'Discount value cannot be negative.',
            
            'service_charges.*.type.required' => 'Service charge type is required.',
            'service_charges.*.type.in' => 'Service charge type must be either percentage or fixed.',
            'service_charges.*.value.required' => 'Service charge value is required.',
            'service_charges.*.value.numeric' => 'Service charge value must be a number.',
            'service_charges.*.value.min' => 'Service charge value cannot be negative.',
            'service_charges.*.name.required' => 'Service charge name is required.',
            
            'rounding_rule.in' => 'Rounding rule must be one of: nearest_0.05, nearest_0.10, nearest_1.00, always_up, always_down, standard.',
            
            'customer_type.in' => 'Customer type must be one of: individual, business, tax_exempt.',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Validate percentage discounts don't exceed 100%
            if ($this->has('discounts')) {
                foreach ($this->input('discounts', []) as $index => $discount) {
                    if (isset($discount['type']) && $discount['type'] === 'percentage' && isset($discount['value'])) {
                        if ($discount['value'] > 100) {
                            $validator->errors()->add("discounts.{$index}.value", 'Percentage discount cannot exceed 100%.');
                        }
                    }
                }
            }

            // Validate percentage service charges don't exceed 100%
            if ($this->has('service_charges')) {
                foreach ($this->input('service_charges', []) as $index => $charge) {
                    if (isset($charge['type']) && $charge['type'] === 'percentage' && isset($charge['value'])) {
                        if ($charge['value'] > 100) {
                            $validator->errors()->add("service_charges.{$index}.value", 'Percentage service charge cannot exceed 100%.');
                        }
                    }
                }
            }

            // Validate discount permissions if required
            if (setting('restaurant.require_manager_for_discount', false, $this->user()->store_id) && $this->has('discounts')) {
                if (!$this->user()->can('restaurant.billing.manager_discount')) {
                    $validator->errors()->add('discounts', 'You do not have permission to apply discounts. Manager approval required.');
                }
            }

            // Validate maximum discount percentage
            $maxDiscountPercentage = setting('restaurant.max_discount_percentage', 100, $this->user()->store_id);
            if ($this->has('discounts')) {
                foreach ($this->input('discounts', []) as $index => $discount) {
                    if (isset($discount['type']) && $discount['type'] === 'percentage' && isset($discount['value'])) {
                        if ($discount['value'] > $maxDiscountPercentage) {
                            $validator->errors()->add("discounts.{$index}.value", "Percentage discount cannot exceed {$maxDiscountPercentage}%.");
                        }
                    }
                }
            }
        });
    }
}