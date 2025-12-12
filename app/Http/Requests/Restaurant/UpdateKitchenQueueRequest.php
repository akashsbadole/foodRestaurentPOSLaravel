<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateKitchenQueueRequest extends FormRequest
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
            'status' => 'required|in:queued,in_progress,ready,completed',
            'priority' => 'nullable|in:low,normal,high,urgent',
            'estimated_time' => 'nullable|integer|min:1',
            'notes' => 'nullable|string|max:500',
        ];
    }

    /**
     * Get the custom error messages for the defined validation rules.
     */
    public function messages()
    {
        return [
            'status.required' => 'Status is required.',
            'status.in' => 'Status must be one of: queued, in_progress, ready, completed.',
            'priority.in' => 'Priority must be one of: low, normal, high, urgent.',
            'estimated_time.min' => 'Estimated time must be at least 1 minute.',
            'notes.max' => 'Notes cannot exceed 500 characters.',
        ];
    }
}