<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;

class StoreReservationRequest extends FormRequest
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
            'table_id' => 'required|exists:restaurant_tables,id',
            'contact_id' => 'nullable|exists:contacts,id',
            'customer_name' => 'required_without:contact_id|string|max:100',
            'customer_phone' => 'required_without:contact_id|string|max:20',
            'reservation_date' => 'required|date|after_or_equal:today',
            'reservation_time' => 'required|date_format:H:i',
            'duration_minutes' => 'required|integer|min:15|max:480',
            'party_size' => 'required|integer|min:1|max:50',
            'special_requests' => 'nullable|string|max:500',
            'deposit_amount' => 'nullable|numeric|min:0',
            'deposit_paid' => 'nullable|boolean',
            'notes' => 'nullable|string|max:500',
        ];
    }

    /**
     * Get the custom error messages for the defined validation rules.
     */
    public function messages()
    {
        return [
            'table_id.required' => 'Table selection is required.',
            'table_id.exists' => 'The selected table is invalid.',
            'contact_id.exists' => 'The selected customer is invalid.',
            'customer_name.required_without' => 'Customer name is required when no customer is selected.',
            'customer_name.max' => 'Customer name cannot exceed 100 characters.',
            'customer_phone.required_without' => 'Customer phone is required when no customer is selected.',
            'customer_phone.max' => 'Customer phone cannot exceed 20 characters.',
            'reservation_date.required' => 'Reservation date is required.',
            'reservation_date.after_or_equal' => 'Reservation date cannot be in the past.',
            'reservation_time.required' => 'Reservation time is required.',
            'reservation_time.date_format' => 'Reservation time must be in HH:MM format.',
            'duration_minutes.required' => 'Duration is required.',
            'duration_minutes.min' => 'Duration must be at least 15 minutes.',
            'duration_minutes.max' => 'Duration cannot exceed 480 minutes (8 hours).',
            'party_size.required' => 'Party size is required.',
            'party_size.min' => 'Party size must be at least 1.',
            'party_size.max' => 'Party size cannot exceed 50.',
            'special_requests.max' => 'Special requests cannot exceed 500 characters.',
            'deposit_amount.min' => 'Deposit amount cannot be negative.',
            'notes.max' => 'Notes cannot exceed 500 characters.',
        ];
    }
}