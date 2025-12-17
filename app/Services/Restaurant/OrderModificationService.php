<?php

namespace App\Services\Restaurant;

use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantOrderItem;
use App\Models\Restaurant\RestaurantOrderItemModifier;
use App\Models\Restaurant\KitchenOrderQueue;
use App\Models\Restaurant\MenuModifier;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\InventoryTransaction;
use App\Models\InventoryTransactionItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

class OrderModificationService
{
    /**
     * Add item to existing order with comprehensive validation
     */
    public function addItemToOrder(RestaurantOrder $order, array $itemData, int $storeId, int $userId): array
    {
        // Validate order can be modified
        if (!$this->canOrderBeModified($order)) {
            return [
                'success' => false,
                'message' => 'Order cannot be modified in current status: ' . $order->status
            ];
        }

        // Validate product availability
        $productValidation = $this->validateProductForAddition($itemData['product_id'], $itemData['quantity'], $storeId);
        if (!$productValidation['valid']) {
            return [
                'success' => false,
                'message' => $productValidation['message']
            ];
        }

        // Validate modifiers if provided
        if (isset($itemData['modifiers']) && !empty($itemData['modifiers'])) {
            $modifierValidation = $this->validateModifiersForItem($itemData['modifiers'], $storeId);
            if (!$modifierValidation['valid']) {
                return [
                    'success' => false,
                    'message' => $modifierValidation['message']
                ];
            }
        }

        DB::beginTransaction();
        try {
            // Create new order item
            $orderItem = RestaurantOrderItem::create([
                'order_id' => $order->id,
                'product_id' => $itemData['product_id'],
                'batch_id' => $itemData['batch_id'] ?? null,
                'quantity' => $itemData['quantity'],
                'unit_price' => $itemData['unit_price'],
                'unit_cost' => $itemData['unit_cost'] ?? $this->getProductCost($itemData['product_id']),
                'discount' => $itemData['discount'] ?? 0,
                'status' => 'pending',
                'special_instructions' => $itemData['special_instructions'] ?? null,
                'preparation_notes' => $itemData['preparation_notes'] ?? null,
                'course_number' => $itemData['course_number'] ?? 1,
                'is_complimentary' => $itemData['is_complimentary'] ?? false,
            ]);

            // Reserve stock for products with stock management
            $product = Product::find($itemData['product_id']);
            if ($product && $product->is_stock_managed) {
                $orderItem->reserveStock($storeId, $itemData['quantity']);
            }

            // Add modifiers if any
            if (isset($itemData['modifiers']) && !empty($itemData['modifiers'])) {
                foreach ($itemData['modifiers'] as $modifierData) {
                    RestaurantOrderItemModifier::create([
                        'order_item_id' => $orderItem->id,
                        'modifier_id' => $modifierData['modifier_id'],
                        'quantity' => $modifierData['quantity'],
                        'price_adjustment' => $modifierData['price_adjustment'],
                    ]);

                    // Reserve stock for modifiers with stock management
                    $modifier = MenuModifier::find($modifierData['modifier_id']);
                    if ($modifier && $modifier->is_stock_managed) {
                        $modifierQuantity = $modifierData['quantity'] * $itemData['quantity'];
                        $this->reserveModifierStock($modifier, $modifierQuantity, $storeId, $orderItem->id);
                    }
                }
            }

            // Record modification history
            $this->recordModification($order, 'item_added', [
                'item_id' => $orderItem->id,
                'product_name' => $product->name,
                'quantity' => $itemData['quantity'],
                'user_id' => $userId
            ]);

            // Recalculate order totals
            $order->calculateTotals();

            // Generate KOT for new item if order is already confirmed
            if ($order->status === 'confirmed' || $order->status === 'preparing') {
                $this->generateKOTForNewItem($orderItem, $storeId);
            }

            DB::commit();

            return [
                'success' => true,
                'message' => 'Item added successfully',
                'order_item' => $orderItem->load(['product', 'modifiers.modifier']),
                'order' => $order->load(['items.product'])
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to add item to order', [
                'error' => $e->getMessage(),
                'order_id' => $order->id,
                'item_data' => $itemData
            ]);

            return [
                'success' => false,
                'message' => 'Failed to add item: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Remove item from order with proper stock release
     */
    public function removeItemFromOrder(RestaurantOrder $order, RestaurantOrderItem $orderItem, int $storeId, int $userId, string $reason = ''): array
    {
        // Validate order can be modified
        if (!$this->canOrderBeModified($order)) {
            return [
                'success' => false,
                'message' => 'Order cannot be modified in current status: ' . $order->status
            ];
        }

        // Check if item can be removed based on KOT status
        if (!$this->canItemBeRemoved($orderItem)) {
            return [
                'success' => false,
                'message' => 'Item cannot be removed - preparation has already started'
            ];
        }

        DB::beginTransaction();
        try {
            $productName = $orderItem->product->name;
            $quantity = $orderItem->quantity;

            // Cancel KOT if exists
            $this->cancelKOTForItem($orderItem, 'Item removed from order');

            // Release reserved stock
            if ($orderItem->product && $orderItem->product->is_stock_managed) {
                $orderItem->releaseStock($storeId, $orderItem->quantity);
            }

            // Release modifier stock
            foreach ($orderItem->modifiers as $modifier) {
                if ($modifier->modifier && $modifier->modifier->is_stock_managed) {
                    $modifierQuantity = $modifier->quantity * $orderItem->quantity;
                    $this->releaseModifierStock($modifier->modifier, $modifierQuantity, $storeId, $orderItem->id);
                }
            }

            // Record modification history
            $this->recordModification($order, 'item_removed', [
                'item_id' => $orderItem->id,
                'product_name' => $productName,
                'quantity' => $quantity,
                'reason' => $reason,
                'user_id' => $userId
            ]);

            // Delete modifiers first
            $orderItem->modifiers()->delete();
            
            // Delete order item
            $orderItem->delete();

            // Recalculate order totals
            $order->calculateTotals();

            DB::commit();

            return [
                'success' => true,
                'message' => 'Item removed successfully',
                'order' => $order->load(['items.product'])
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to remove item from order', [
                'error' => $e->getMessage(),
                'order_id' => $order->id,
                'item_id' => $orderItem->id
            ]);

            return [
                'success' => false,
                'message' => 'Failed to remove item: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update item quantity with stock management
     */
    public function updateItemQuantity(RestaurantOrder $order, RestaurantOrderItem $orderItem, float $newQuantity, int $storeId, int $userId): array
    {
        // Validate order can be modified
        if (!$this->canOrderBeModified($order)) {
            return [
                'success' => false,
                'message' => 'Order cannot be modified in current status: ' . $order->status
            ];
        }

        // Check if item can be modified based on KOT status
        if (!$this->canItemBeModified($orderItem)) {
            return [
                'success' => false,
                'message' => 'Item quantity cannot be modified - preparation has already started'
            ];
        }

        $currentQuantity = $orderItem->quantity;
        $difference = $newQuantity - $currentQuantity;

        if ($difference == 0) {
            return [
                'success' => false,
                'message' => 'No quantity change detected'
            ];
        }

        // Check stock availability if increasing quantity
        if ($difference > 0) {
            $stockCheck = $this->validateProductForAddition($orderItem->product_id, $difference, $storeId);
            if (!$stockCheck['valid']) {
                return [
                    'success' => false,
                    'message' => $stockCheck['message']
                ];
            }
        }

        DB::beginTransaction();
        try {
            // Update quantity with stock management
            $orderItem->updateQuantity($newQuantity, $storeId);

            // Update modifier quantities proportionally
            foreach ($orderItem->modifiers as $modifier) {
                $newModifierQuantity = ($newQuantity / $currentQuantity) * $modifier->quantity;
                $modifier->quantity = $newModifierQuantity;
                $modifier->save();

                // Handle modifier stock changes
                $modifierDifference = $newModifierQuantity - $modifier->quantity;
                if ($modifierDifference != 0 && $modifier->modifier->is_stock_managed) {
                    if ($modifierDifference > 0) {
                        $this->reserveModifierStock($modifier->modifier, $modifierDifference, $storeId, $orderItem->id);
                    } else {
                        $this->releaseModifierStock($modifier->modifier, abs($modifierDifference), $storeId, $orderItem->id);
                    }
                }
            }

            // Record modification history
            $this->recordModification($order, 'quantity_updated', [
                'item_id' => $orderItem->id,
                'product_name' => $orderItem->product->name,
                'old_quantity' => $currentQuantity,
                'new_quantity' => $newQuantity,
                'user_id' => $userId
            ]);

            // Recalculate order totals
            $order->calculateTotals();

            // Regenerate KOT if order is confirmed
            if ($order->status === 'confirmed' || $order->status === 'preparing') {
                $this->regenerateKOTForModifiedItem($orderItem, $storeId);
            }

            DB::commit();

            return [
                'success' => true,
                'message' => 'Item quantity updated successfully',
                'order_item' => $orderItem->load(['product', 'modifiers.modifier']),
                'order' => $order->load(['items.product'])
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update item quantity', [
                'error' => $e->getMessage(),
                'order_id' => $order->id,
                'item_id' => $orderItem->id,
                'old_quantity' => $currentQuantity,
                'new_quantity' => $newQuantity
            ]);

            return [
                'success' => false,
                'message' => 'Failed to update quantity: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update item modifiers
     */
    public function updateItemModifiers(RestaurantOrder $order, RestaurantOrderItem $orderItem, array $newModifiers, int $storeId, int $userId): array
    {
        // Validate order can be modified
        if (!$this->canOrderBeModified($order)) {
            return [
                'success' => false,
                'message' => 'Order cannot be modified in current status: ' . $order->status
            ];
        }

        // Check if item can be modified based on KOT status
        if (!$this->canItemBeModified($orderItem)) {
            return [
                'success' => false,
                'message' => 'Item modifiers cannot be changed - preparation has already started'
            ];
        }

        // Validate new modifiers
        $modifierValidation = $this->validateModifiersForItem($newModifiers, $storeId);
        if (!$modifierValidation['valid']) {
            return [
                'success' => false,
                'message' => $modifierValidation['message']
            ];
        }

        DB::beginTransaction();
        try {
            $oldModifiers = $orderItem->modifiers->keyBy('modifier_id');

            // Release stock for removed modifiers
            foreach ($oldModifiers as $modifierId => $oldModifier) {
                if (!isset($newModifiers[$modifierId])) {
                    if ($oldModifier->modifier->is_stock_managed) {
                        $modifierQuantity = $oldModifier->quantity * $orderItem->quantity;
                        $this->releaseModifierStock($oldModifier->modifier, $modifierQuantity, $storeId, $orderItem->id);
                    }
                    $oldModifier->delete();
                }
            }

            // Add or update modifiers
            foreach ($newModifiers as $modifierData) {
                $modifierId = $modifierData['modifier_id'];
                $modifier = MenuModifier::find($modifierId);

                if (isset($oldModifiers[$modifierId])) {
                    // Update existing modifier
                    $oldModifier = $oldModifiers[$modifierId];
                    $oldQuantity = $oldModifier->quantity;
                    $newQuantity = $modifierData['quantity'];
                    $difference = $newQuantity - $oldQuantity;

                    $oldModifier->quantity = $newQuantity;
                    $oldModifier->price_adjustment = $modifierData['price_adjustment'];
                    $oldModifier->save();

                    // Handle stock changes
                    if ($modifier->is_stock_managed && $difference != 0) {
                        $modifierQuantity = $difference * $orderItem->quantity;
                        if ($difference > 0) {
                            $this->reserveModifierStock($modifier, $modifierQuantity, $storeId, $orderItem->id);
                        } else {
                            $this->releaseModifierStock($modifier, abs($modifierQuantity), $storeId, $orderItem->id);
                        }
                    }
                } else {
                    // Add new modifier
                    RestaurantOrderItemModifier::create([
                        'order_item_id' => $orderItem->id,
                        'modifier_id' => $modifierId,
                        'quantity' => $modifierData['quantity'],
                        'price_adjustment' => $modifierData['price_adjustment'],
                    ]);

                    // Reserve stock for new modifier
                    if ($modifier->is_stock_managed) {
                        $modifierQuantity = $modifierData['quantity'] * $orderItem->quantity;
                        $this->reserveModifierStock($modifier, $modifierQuantity, $storeId, $orderItem->id);
                    }
                }
            }

            // Record modification history
            $this->recordModification($order, 'modifiers_updated', [
                'item_id' => $orderItem->id,
                'product_name' => $orderItem->product->name,
                'old_modifiers' => $oldModifiers->pluck('modifier.name')->toArray(),
                'new_modifiers' => collect($newModifiers)->pluck('modifier_id')->map(function($id) {
                    return MenuModifier::find($id)->name;
                })->toArray(),
                'user_id' => $userId
            ]);

            // Recalculate order totals
            $order->calculateTotals();

            // Regenerate KOT if order is confirmed
            if ($order->status === 'confirmed' || $order->status === 'preparing') {
                $this->regenerateKOTForModifiedItem($orderItem, $storeId);
            }

            DB::commit();

            return [
                'success' => true,
                'message' => 'Item modifiers updated successfully',
                'order_item' => $orderItem->load(['product', 'modifiers.modifier']),
                'order' => $order->load(['items.product'])
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update item modifiers', [
                'error' => $e->getMessage(),
                'order_id' => $order->id,
                'item_id' => $orderItem->id
            ]);

            return [
                'success' => false,
                'message' => 'Failed to update modifiers: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Cancel entire order with comprehensive cleanup
     */
    public function cancelOrder(RestaurantOrder $order, int $storeId, int $userId, string $reason): array
    {
        // Validate order can be cancelled
        if (!in_array($order->status, ['pending', 'confirmed'])) {
            return [
                'success' => false,
                'message' => 'Order cannot be cancelled in current status: ' . $order->status
            ];
        }

        DB::beginTransaction();
        try {
            // Cancel all KOTs
            $this->cancelAllKOTsForOrder($order, $reason);

            // Release stock for all items
            foreach ($order->items as $item) {
                if ($item->product && $item->product->is_stock_managed) {
                    $item->releaseStock($storeId, $item->quantity);
                }

                // Release modifier stock
                foreach ($item->modifiers as $modifier) {
                    if ($modifier->modifier && $modifier->modifier->is_stock_managed) {
                        $modifierQuantity = $modifier->quantity * $item->quantity;
                        $this->releaseModifierStock($modifier->modifier, $modifierQuantity, $storeId, $item->id);
                    }
                }
            }

            // Update order status
            $order->status = 'cancelled';
            $order->special_instructions = ($order->special_instructions ?? '') . 
                                       "\n\nCancelled: " . $reason;
            $order->save();

            // Update table status if dine-in
            if ($order->table) {
                $order->table->markAsAvailable();
            }

            // Update sale status
            if ($order->sale) {
                $order->sale->status = 'cancelled';
                $order->sale->save();
            }

            // Record modification history
            $this->recordModification($order, 'order_cancelled', [
                'reason' => $reason,
                'user_id' => $userId
            ]);

            DB::commit();

            return [
                'success' => true,
                'message' => 'Order cancelled successfully',
                'order' => $order->load(['table', 'waiter'])
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to cancel order', [
                'error' => $e->getMessage(),
                'order_id' => $order->id
            ]);

            return [
                'success' => false,
                'message' => 'Failed to cancel order: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Check if order can be modified based on business rules
     */
    private function canOrderBeModified(RestaurantOrder $order): bool
    {
        // Order can only be modified in certain statuses
        if (!in_array($order->status, ['pending', 'confirmed'])) {
            return false;
        }

        // Check time-based restrictions (e.g., no modifications after 10 minutes)
        if ($order->status === 'confirmed' && $order->updated_at->diffInMinutes(now()) > 10) {
            return false;
        }

        return true;
    }

    /**
     * Check if item can be removed based on KOT status
     */
    private function canItemBeRemoved(RestaurantOrderItem $orderItem): bool
    {
        $kot = $orderItem->getKOT();
        
        if (!$kot) {
            return true; // No KOT generated yet, can be removed
        }

        // Can only remove if KOT is in queued status
        return $kot->status === 'queued';
    }

    /**
     * Check if item can be modified based on KOT status
     */
    private function canItemBeModified(RestaurantOrderItem $orderItem): bool
    {
        $kot = $orderItem->getKOT();
        
        if (!$kot) {
            return true; // No KOT generated yet, can be modified
        }

        // Can only modify if KOT is in queued status
        return $kot->status === 'queued';
    }

    /**
     * Validate product for addition to order
     */
    private function validateProductForAddition(int $productId, float $quantity, int $storeId): array
    {
        $product = Product::find($productId);
        
        if (!$product) {
            return ['valid' => false, 'message' => 'Product not found'];
        }

        if (!$product->is_active) {
            return ['valid' => false, 'message' => 'Product is not available'];
        }

        // Check stock if product manages stock
        if ($product->is_stock_managed) {
            $stock = ProductStock::where('product_id', $productId)
                ->where('store_id', $storeId)
                ->sum('quantity');
            
            if ($stock < $quantity) {
                return [
                    'valid' => false,
                    'message' => "Insufficient stock. Available: {$stock}, Requested: {$quantity}"
                ];
            }
        }

        return ['valid' => true];
    }

    /**
     * Validate modifiers for item
     */
    private function validateModifiersForItem(array $modifiers, int $storeId): array
    {
        $modifierIds = collect($modifiers)->pluck('modifier_id');
        $availableModifiers = MenuModifier::whereIn('id', $modifierIds)->active()->get();
        
        if ($availableModifiers->count() !== $modifierIds->count()) {
            return ['valid' => false, 'message' => 'One or more modifiers are not available'];
        }

        // Check modifier stock if applicable
        foreach ($availableModifiers as $modifier) {
            if ($modifier->is_stock_managed) {
                $modifierData = collect($modifiers)->firstWhere('modifier_id', $modifier->id);
                $requiredQuantity = $modifierData['quantity'];
                
                $stock = ProductStock::where('product_id', $modifier->id)
                    ->where('store_id', $storeId)
                    ->sum('quantity');
                
                if ($stock < $requiredQuantity) {
                    return [
                        'valid' => false,
                        'message' => "Insufficient stock for modifier '{$modifier->name}'. Available: {$stock}, Required: {$requiredQuantity}"
                    ];
                }
            }
        }

        return ['valid' => true];
    }

    /**
     * Generate KOT for new item
     */
    private function generateKOTForNewItem(RestaurantOrderItem $orderItem, int $storeId): void
    {
        try {
            $kotService = new KOTGenerationService();
            $result = $kotService->generateKOTForOrder($orderItem->order);
            
            Log::info('KOT generated for new item', [
                'order_item_id' => $orderItem->id,
                'result' => $result
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to generate KOT for new item', [
                'order_item_id' => $orderItem->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Regenerate KOT for modified item
     */
    private function regenerateKOTForModifiedItem(RestaurantOrderItem $orderItem, int $storeId): void
    {
        try {
            $kotService = new KOTGenerationService();
            $result = $kotService->regenerateKOTForItem($orderItem);
            
            Log::info('KOT regenerated for modified item', [
                'order_item_id' => $orderItem->id,
                'result' => $result
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to regenerate KOT for modified item', [
                'order_item_id' => $orderItem->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Cancel KOT for item
     */
    private function cancelKOTForItem(RestaurantOrderItem $orderItem, string $reason): void
    {
        $kot = $orderItem->getKOT();
        
        if ($kot) {
            $kot->status = 'cancelled';
            $kot->notes = ($kot->notes ?? '') . ' | Cancelled: ' . $reason;
            $kot->save();
            
            // Update order item status
            $orderItem->status = 'cancelled';
            $orderItem->void_reason = $reason;
            $orderItem->save();
        }
    }

    /**
     * Cancel all KOTs for order
     */
    private function cancelAllKOTsForOrder(RestaurantOrder $order, string $reason): void
    {
        $kots = KitchenOrderQueue::whereHas('orderItem', function($query) use ($order) {
                $query->where('order_id', $order->id);
            })
            ->whereIn('status', ['queued', 'in_progress'])
            ->get();

        foreach ($kots as $kot) {
            $kot->status = 'cancelled';
            $kot->notes = ($kot->notes ?? '') . ' | Cancelled: ' . $reason;
            $kot->save();
            
            // Update order item status
            $orderItem = $kot->orderItem;
            $orderItem->status = 'cancelled';
            $orderItem->void_reason = $reason;
            $orderItem->save();
        }
    }

    /**
     * Reserve stock for modifier
     */
    private function reserveModifierStock(MenuModifier $modifier, float $quantity, int $storeId, int $orderItemId): void
    {
        $stock = ProductStock::where('product_id', $modifier->id)
            ->where('store_id', $storeId)
            ->lockForUpdate()
            ->first();

        if (!$stock || $stock->quantity < $quantity) {
            throw new \Exception('Insufficient stock for modifier: ' . $modifier->name);
        }

        $stock->quantity -= $quantity;
        $stock->save();

        // Create inventory transaction
        $transaction = InventoryTransaction::create([
            'store_id' => $storeId,
            'transaction_type' => 'reservation',
            'reference_type' => 'restaurant_order_item_modifier',
            'reference_id' => $orderItemId,
            'notes' => "Stock reserved for modifier - Order Item ID: {$orderItemId}",
            'created_by' => auth()->id() ?? 1
        ]);

        InventoryTransactionItem::create([
            'inventory_transaction_id' => $transaction->id,
            'product_id' => $modifier->id,
            'quantity' => $quantity,
            'action' => 'reserve',
            'unit_cost' => $modifier->cost ?? 0
        ]);
    }

    /**
     * Release stock for modifier
     */
    private function releaseModifierStock(MenuModifier $modifier, float $quantity, int $storeId, int $orderItemId): void
    {
        $stock = ProductStock::where('product_id', $modifier->id)
            ->where('store_id', $storeId)
            ->lockForUpdate()
            ->first();

        if (!$stock) {
            // Create stock record if it doesn't exist
            $stock = ProductStock::create([
                'product_id' => $modifier->id,
                'store_id' => $storeId,
                'quantity' => $quantity,
            ]);
        } else {
            // Release stock by increasing available quantity
            $stock->quantity += $quantity;
            $stock->save();
        }

        // Find and reverse reservation transactions
        $transactions = InventoryTransaction::where('reference_type', 'restaurant_order_item_modifier')
            ->where('reference_id', $orderItemId)
            ->where('transaction_type', 'reservation')
            ->get();

        foreach ($transactions as $transaction) {
            $transaction->status = 'reversed';
            $transaction->save();
        }
    }

    /**
     * Get product cost
     */
    private function getProductCost(int $productId): float
    {
        $product = Product::find($productId);
        return $product ? $product->cost ?? 0 : 0;
    }

    /**
     * Record modification history
     */
    private function recordModification(RestaurantOrder $order, string $action, array $data): void
    {
        // This would typically save to a modifications history table
        // For now, we'll log it
        Log::info('Order modification', [
            'order_id' => $order->id,
            'action' => $action,
            'data' => $data,
            'timestamp' => now()
        ]);
    }
}