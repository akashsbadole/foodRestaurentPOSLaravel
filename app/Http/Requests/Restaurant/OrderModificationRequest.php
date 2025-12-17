<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Auth;

class OrderModificationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize()
    {
        $user = Auth::user();
        $order = $this->route('order');

        // Check if user has permission to modify orders
        if (!$user->hasPermissionTo('modify_restaurant_orders')) {
            return false;
        }

        // Check if user belongs to the same store as the order
        if ($order && $order->store_id !== $user->store_id) {
            return false;
        }

        // Check if user is the waiter who created the order or has admin privileges
        if ($order && $order->waiter_id !== $user->id && !$user->hasRole('admin|manager')) {
            return false;
        }

        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules()
    {
        $modificationType = $this->input('modification_type');
        
        $baseRules = [
            'modification_type' => 'required|in:add_item,remove_item,update_quantity,update_modifiers,cancel_order,batch_modify',
            'reason' => 'nullable|string|max:500',
            'user_id' => 'nullable|exists:users,id',
        ];

        switch ($modificationType) {
            case 'add_item':
                return array_merge($baseRules, [
                    'product_id' => 'required|exists:products,id',
                    'quantity' => 'required|numeric|min:0.01|max:999',
                    'unit_price' => 'required|numeric|min:0|max:99999.99',
                    'unit_cost' => 'nullable|numeric|min:0|max:99999.99',
                    'discount' => 'nullable|numeric|min:0|max:99999.99',
                    'special_instructions' => 'nullable|string|max:500',
                    'preparation_notes' => 'nullable|string|max:500',
                    'course_number' => 'nullable|integer|min:1|max:99',
                    'is_complimentary' => 'nullable|boolean',
                    'modifiers' => 'nullable|array',
                    'modifiers.*.modifier_id' => 'required|exists:menu_modifiers,id',
                    'modifiers.*.quantity' => 'required|numeric|min:0.01|max:999',
                    'modifiers.*.price_adjustment' => 'required|numeric|min:-99999.99|max:99999.99',
                ]);

            case 'remove_item':
                return array_merge($baseRules, [
                    'item_id' => 'required|exists:restaurant_order_items,id',
                    'reason' => 'required|string|max:500',
                ]);

            case 'update_quantity':
                return array_merge($baseRules, [
                    'item_id' => 'required|exists:restaurant_order_items,id',
                    'quantity' => 'required|numeric|min:0.01|max:999',
                    'reason' => 'nullable|string|max:500',
                ]);

            case 'update_modifiers':
                return array_merge($baseRules, [
                    'item_id' => 'required|exists:restaurant_order_items,id',
                    'modifiers' => 'required|array',
                    'modifiers.*.modifier_id' => 'required|exists:menu_modifiers,id',
                    'modifiers.*.quantity' => 'required|numeric|min:0.01|max:999',
                    'modifiers.*.price_adjustment' => 'required|numeric|min:-99999.99|max:99999.99',
                    'reason' => 'nullable|string|max:500',
                ]);

            case 'cancel_order':
                return array_merge($baseRules, [
                    'cancellation_reason' => 'required|string|max:500',
                    'refund_items' => 'nullable|array',
                    'refund_items.*.item_id' => 'required|exists:restaurant_order_items,id',
                    'refund_items.*.refund_amount' => 'required|numeric|min:0|max:99999.99',
                    'refund_items.*.refund_reason' => 'nullable|string|max:500',
                ]);

            case 'batch_modify':
                return array_merge($baseRules, [
                    'modifications' => 'required|array|min:1|max:50',
                    'modifications.*.item_id' => 'required|exists:restaurant_order_items,id',
                    'modifications.*.action' => 'required|in:update_quantity,update_modifiers,remove',
                    'modifications.*.data' => 'nullable|array',
                    'modifications.*.data.quantity' => 'required_if:modifications.*.action,update_quantity|numeric|min:0.01|max:999',
                    'modifications.*.data.modifiers' => 'required_if:modifications.*.action,update_modifiers|array',
                    'modifications.*.data.modifiers.*.modifier_id' => 'required_with:modifications.*.data.modifiers|exists:menu_modifiers,id',
                    'modifications.*.data.modifiers.*.quantity' => 'required_with:modifications.*.data.modifiers|numeric|min:0.01|max:999',
                    'modifications.*.data.modifiers.*.price_adjustment' => 'required_with:modifications.*.data.modifiers|numeric|min:-99999.99|max:99999.99',
                    'modifications.*.reason' => 'nullable|string|max:500',
                ]);

            default:
                return $baseRules;
        }
    }

    /**
     * Get custom error messages for validation rules.
     */
    public function messages()
    {
        return [
            'modification_type.required' => 'Modification type is required',
            'modification_type.in' => 'Invalid modification type',
            'product_id.required' => 'Product selection is required',
            'product_id.exists' => 'Selected product does not exist',
            'quantity.required' => 'Quantity is required',
            'quantity.min' => 'Quantity must be at least 0.01',
            'quantity.max' => 'Quantity cannot exceed 999',
            'unit_price.required' => 'Unit price is required',
            'unit_price.min' => 'Unit price must be at least 0',
            'modifiers.required' => 'Modifiers are required when specified',
            'modifiers.array' => 'Modifiers must be an array',
            'modifiers.*.modifier_id.required' => 'Modifier ID is required',
            'modifiers.*.modifier_id.exists' => 'Selected modifier does not exist',
            'modifiers.*.quantity.required' => 'Modifier quantity is required',
            'modifiers.*.quantity.min' => 'Modifier quantity must be at least 0.01',
            'item_id.required' => 'Item ID is required',
            'item_id.exists' => 'Selected item does not exist',
            'cancellation_reason.required' => 'Cancellation reason is required',
            'cancellation_reason.max' => 'Cancellation reason cannot exceed 500 characters',
            'modifications.required' => 'Modifications array is required for batch operations',
            'modifications.min' => 'At least one modification is required',
            'modifications.max' => 'Cannot process more than 50 modifications at once',
            'modifications.*.item_id.required' => 'Item ID is required for each modification',
            'modifications.*.action.required' => 'Action is required for each modification',
            'modifications.*.action.in' => 'Invalid action specified for modification',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $this->validateBusinessRules($validator);
            $this->validateStockAvailability($validator);
            $this->validateTimingRestrictions($validator);
            $this->validatePermissionRestrictions($validator);
        });
    }

    /**
     * Validate business rules for the modification
     */
    private function validateBusinessRules($validator)
    {
        $modificationType = $this->input('modification_type');
        $order = $this->route('order');

        if (!$order) {
            return;
        }

        // Check if order can be modified based on status
        if (!$order->canBeModified()) {
            $validator->errors()->add('order_status', 'Order cannot be modified in current status: ' . $order->status);
            return;
        }

        // Specific business rule validations
        switch ($modificationType) {
            case 'remove_item':
                $itemId = $this->input('item_id');
                if ($itemId && $order->items()->count() <= 1) {
                    $validator->errors()->add('item_removal', 'Cannot remove the last item from an order. Consider cancelling the order instead.');
                }
                break;

            case 'cancel_order':
                if ($order->sale && $order->sale->payment_status === 'paid') {
                    $validator->errors()->add('payment_status', 'Cannot cancel an order that has already been paid for.');
                }
                break;

            case 'batch_modify':
                $modifications = $this->input('modifications', []);
                $itemIds = collect($modifications)->pluck('item_id');
                $uniqueItems = $itemIds->unique();
                
                if ($uniqueItems->count() !== $itemIds->count()) {
                    $validator->errors()->add('duplicate_items', 'Cannot modify the same item multiple times in a single batch operation.');
                }
                break;
        }
    }

    /**
     * Validate stock availability for the modification
     */
    private function validateStockAvailability($validator)
    {
        $modificationType = $this->input('modification_type');
        $order = $this->route('order');

        if (!$order) {
            return;
        }

        $storeId = $order->store_id;

        switch ($modificationType) {
            case 'add_item':
                $productId = $this->input('product_id');
                $quantity = $this->input('quantity');
                
                if ($productId && $quantity) {
                    $product = \App\Models\Product::find($productId);
                    if ($product && $product->is_stock_managed) {
                        $stock = \App\Models\ProductStock::where('product_id', $productId)
                            ->where('store_id', $storeId)
                            ->sum('quantity');
                        
                        if ($stock < $quantity) {
                            $validator->errors()->add('stock', "Insufficient stock for '{$product->name}'. Available: {$stock}, Required: {$quantity}");
                        }
                    }

                    // Check modifier stock
                    $modifiers = $this->input('modifiers', []);
                    foreach ($modifiers as $modifierData) {
                        $modifier = \App\Models\Restaurant\MenuModifier::find($modifierData['modifier_id']);
                        if ($modifier && $modifier->is_stock_managed) {
                            $modifierStock = \App\Models\ProductStock::where('product_id', $modifier->id)
                                ->where('store_id', $storeId)
                                ->sum('quantity');
                            
                            $requiredModifierQuantity = $modifierData['quantity'] * $quantity;
                            if ($modifierStock < $requiredModifierQuantity) {
                                $validator->errors()->add('modifier_stock', "Insufficient stock for modifier '{$modifier->name}'. Available: {$modifierStock}, Required: {$requiredModifierQuantity}");
                            }
                        }
                    }
                }
                break;

            case 'update_quantity':
                $itemId = $this->input('item_id');
                $newQuantity = $this->input('quantity');
                
                if ($itemId && $newQuantity) {
                    $orderItem = \App\Models\Restaurant\RestaurantOrderItem::find($itemId);
                    if ($orderItem) {
                        $currentQuantity = $orderItem->quantity;
                        $difference = $newQuantity - $currentQuantity;
                        
                        if ($difference > 0 && $orderItem->product->is_stock_managed) {
                            $stock = \App\Models\ProductStock::where('product_id', $orderItem->product_id)
                                ->where('store_id', $storeId)
                                ->sum('quantity');
                            
                            if ($stock < $difference) {
                                $validator->errors()->add('stock', "Insufficient stock for '{$orderItem->product->name}'. Available: {$stock}, Additional Required: {$difference}");
                            }
                        }
                    }
                }
                break;
        }
    }

    /**
     * Validate timing restrictions for the modification
     */
    private function validateTimingRestrictions($validator)
    {
        $modificationType = $this->input('modification_type');
        $order = $this->route('order');

        if (!$order) {
            return;
        }

        // Check time-based restrictions
        if ($order->status === 'confirmed') {
            $minutesSinceConfirmation = $order->updated_at->diffInMinutes(now());
            
            switch ($modificationType) {
                case 'add_item':
                case 'remove_item':
                case 'update_quantity':
                case 'update_modifiers':
                    if ($minutesSinceConfirmation > 10) {
                        $validator->errors()->add('timing', 'Order modifications are not allowed after 10 minutes of confirmation.');
                    }
                    break;

                case 'cancel_order':
                    if ($minutesSinceConfirmation > 15) {
                        $validator->errors()->add('timing', 'Order cancellation is not allowed after 15 minutes of confirmation.');
                    }
                    break;
            }
        }

        // Check if any items are already being prepared
        $itemsBeingPrepared = $order->items()->whereHas('kitchenQueue', function($query) {
            $query->whereIn('status', ['in_progress', 'ready']);
        })->count();

        if ($itemsBeingPrepared > 0) {
            $validator->errors()->add('preparation_status', 'Cannot modify order when items are already being prepared.');
        }
    }

    /**
     * Validate permission restrictions for the modification
     */
    private function validatePermissionRestrictions($validator)
    {
        $user = Auth::user();
        $modificationType = $this->input('modification_type');

        // Check if user has specific permissions for certain modification types
        switch ($modificationType) {
            case 'cancel_order':
                if (!$user->hasPermissionTo('cancel_restaurant_orders')) {
                    $validator->errors()->add('permission', 'You do not have permission to cancel orders.');
                }
                break;

            case 'batch_modify':
                if (!$user->hasPermissionTo('batch_modify_orders')) {
                    $validator->errors()->add('permission', 'You do not have permission to perform batch modifications.');
                }
                break;
        }
    }

    /**
     * Get the proper error response for validation failures.
     */
    protected function failedValidation(Validator $validator)
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
                'modification_type' => $this->input('modification_type'),
                'timestamp' => now()->toISOString()
            ], 422)
        );
    }

    /**
     * Get additional data to return with the validation response.
     */
    public function getModificationData()
    {
        $order = $this->route('order');
        
        return [
            'order_id' => $order ? $order->id : null,
            'order_number' => $order ? $order->order_number : null,
            'order_status' => $order ? $order->status : null,
            'modification_type' => $this->input('modification_type'),
            'user_id' => Auth::id(),
            'store_id' => $order ? $order->store_id : null,
            'timestamp' => now()->toISOString(),
            'validation_context' => [
                'can_modify' => $order ? $order->canBeModified() : false,
                'can_cancel' => $order ? $order->canBeCancelled() : false,
                'time_restrictions' => $order ? $order->getTimeUntilModificationLock() : null,
                'modifiable_items' => $order ? $order->getModifiableItems()->pluck('id') : [],
            ]
        ];
    }
}