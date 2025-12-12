<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;

class StoreTableRequest extends FormRequest
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
            'table_number' => 'required|string|max:50|unique:restaurant_tables,table_number,NULL,id,store_id,' . $this->getStoreId(),
            'name' => 'nullable|string|max:100',
            'capacity' => 'required|integer|min:1|max:50',
            'section_id' => 'nullable|exists:table_sections,id',
            'shape' => 'nullable|in:round,square,rectangle',
            'position_x' => 'nullable|numeric|min:0',
            'position_y' => 'nullable|numeric|min:0',
            'width' => 'nullable|numeric|min:1',
            'height' => 'nullable|numeric|min:1',
            'notes' => 'nullable|string|max:500',
        ];
    }

    /**
     * Get custom error messages for validation rules.
     */
    public function messages()
    {
        return [
            'table_number.required' => 'Table number is required.',
            'table_number.unique' => 'Table number already exists for this store.',
            'table_number.max' => 'Table number cannot exceed 50 characters.',
            'name.max' => 'Table name cannot exceed 100 characters.',
            'capacity.required' => 'Table capacity is required.',
            'capacity.min' => 'Table capacity must be at least 1.',
            'capacity.max' => 'Table capacity cannot exceed 50.',
            'section_id.exists' => 'The selected section is invalid.',
            'shape.in' => 'Table shape must be one of: round, square, rectangle.',
            'position_x.min' => 'Position X cannot be negative.',
            'position_y.min' => 'Position Y cannot be negative.',
            'width.min' => 'Width must be at least 1.',
            'height.min' => 'Height must be at least 1.',
            'notes.max' => 'Notes cannot exceed 500 characters.',
        ];
    }

    /**
     * Get the store ID for validation
     */
    private function getStoreId()
    {
        return request('store_id') 
            ?? session('store_id') 
            ?? (auth()->user() ? auth()->user()->store_id : 1);
    }
}