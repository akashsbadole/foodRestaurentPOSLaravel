<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Userstamps;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductStock;
use App\Models\User;
use App\Services\Restaurant\KOTGenerationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RestaurantOrderItemEnhanced extends Model
{
    use Userstamps;

    protected $table = 'restaurant_order_items';

    protected $fillable = [
        'order_id',
        'product_id',
        'batch_id',
        'quantity',
        'unit_price',
        'unit_cost',
        'discount',
        'status',
        'special_instructions',
        'preparation_notes',
        'course_number',
        'is_complimentary',
        'void_reason',
        'kitchen_printed',
        'kitchen_printed_at',
        'served_by',
        'served_at',
        // Inventory tracking fields
        'stock_reserved_at',
        'stock_reserved_quantity',
        'stock_deducted_at',
        'stock_deducted_quantity',
        'waste_recorded',
        'waste_quantity',
        'waste_reason',
        'variance_quantity',
        'variance_reason',
        'batch_used_id',
        'batch_expiry_date',
        'ingredient_cost_calculated',
        'total_ingredient_cost',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'discount' => 'decimal:2',
        'kitchen_printed_at' => 'datetime',
        'served_at' => 'datetime',
        'stock_reserved_at' => 'datetime',
        'stock_deducted_at' => 'datetime',
        'is_complimentary' => 'boolean',
        'waste_recorded' => 'boolean',
        'ingredient_cost_calculated' => 'boolean',
        'batch_expiry_date' => 'datetime',
    ];

    // Relationships
    public function order()
    {
        return $this->belongsTo(RestaurantOrder::class, 'order_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function batch()
    {
        return $this->belongsTo(ProductBatch::class, 'batch_id');
    }

    public function batchUsed()
    {
        return $this->belongsTo(ProductBatch::class, 'batch_used_id');
    }

    public function modifiers()
    {
        return $this->hasMany(RestaurantOrderItemModifier::class, 'order_item_id');
    }

    public function kitchenQueue()
    {
        return $this->hasMany(KitchenOrderQueue::class, 'order_item_id');
    }

    public function servedBy()
    {
        return $this->belongsTo(User::class, 'served_by');
    }

    public function inventoryTransactions()
    {
        return $this->hasManyThrough(
            \App\Models\InventoryTransactionItem::class,
            Product::class,
            'product_id',
            'product_id',
            'id',
            'product_id'
        );
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByCourse($query, $courseNumber)
    {
        return $query->where('course_number', $courseNumber);
    }

    public function scopeForKitchen($query)
    {
        return $query->whereIn('status', ['pending', 'confirmed', 'preparing']);
    }

    public function scopeWithStockIssues($query)
    {
        return $query->where(function($q) {
            $q->where('variance_quantity', '!=', 0)
              ->orWhere('waste_quantity', '>', 0);
        });
    }

    // Methods
    /**
     * Calculate item subtotal with modifiers
     */
    public function calculateSubtotal()
    {
        $subtotal = $this->quantity * $this->unit_price;
        
        // Add modifier prices
        foreach ($this->modifiers as $modifier) {
            $subtotal += $modifier->price_adjustment * $modifier->quantity;
        }
        
        return $subtotal - $this->discount;
    }

    /**
     * Calculate actual cost including ingredients and waste
     */
    public function calculateActualCost()
    {
        $baseCost = $this->unit_cost * $this->quantity;
        
        // Add ingredient costs for recipes
        if ($this->product && $this->product->is_recipe) {
            $baseCost = $this->total_ingredient_cost ?? $baseCost;
        }
        
        // Add waste cost
        $wasteCost = ($this->unit_cost * $this->waste_quantity) ?? 0;
        
        return $baseCost + $wasteCost;
    }

    /**
     * Calculate food cost percentage
     */
    public function getFoodCostPercentage()
    {
        $revenue = $this->calculateSubtotal();
        $cost = $this->calculateActualCost();
        
        return $revenue > 0 ? ($cost / $revenue) * 100 : 0;
    }

    /**
     * Calculate profit margin
     */
    public function getProfitMargin()
    {
        $revenue = $this->calculateSubtotal();
        $cost = $this->calculateActualCost();
        
        return $revenue > 0 ? (($revenue - $cost) / $revenue) * 100 : 0;
    }

    /**
     * Reserve inventory stock for this item
     */
    public function reserveInventoryStock()
    {
        if ($this->stock_reserved_at) {
            return true; // Already reserved
        }

        try {
            return DB::transaction(function() {
                $product = $this->product;
                
                if (!$product || !$product->track_inventory) {
                    $this->update([
                        'stock_reserved_at' => now(),
                        'stock_reserved_quantity' => $this->quantity,
                    ]);
                    return true;
                }

                // Handle recipe stock reservation
                if ($product->is_recipe) {
                    return $this->reserveRecipeStock();
                }

                // Reserve simple product stock
                $stock = ProductStock::where('product_id', $product->id)
                    ->where('store_id', $this->order->store_id)
                    ->lockForUpdate()
                    ->first();

                if (!$stock || $stock->available_quantity < $this->quantity) {
                    throw new \Exception('Insufficient stock available');
                }

                $stock->reserved_quantity += $this->quantity;
                $stock->available_quantity = $stock->quantity - $stock->reserved_quantity;
                $stock->save();

                // Select batch for this item
                $batch = $this->selectOptimalBatch($product->id, $this->order->store_id, $this->quantity);

                $this->update([
                    'stock_reserved_at' => now(),
                    'stock_reserved_quantity' => $this->quantity,
                    'batch_used_id' => $batch->id ?? null,
                    'batch_expiry_date' => $batch->expiry_date ?? null,
                ]);

                Log::info('Stock reserved for order item', [
                    'order_item_id' => $this->id,
                    'product_id' => $product->id,
                    'quantity' => $this->quantity,
                    'batch_id' => $batch->id ?? null,
                ]);

                return true;
            });
        } catch (\Exception $e) {
            Log::error('Failed to reserve stock for order item', [
                'order_item_id' => $this->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Reserve recipe ingredient stock
     */
    private function reserveRecipeStock()
    {
        $product = $this->product;
        $recipeIngredients = $this->getRecipeIngredients($product->id);
        $totalIngredientCost = 0;

        foreach ($recipeIngredients as $ingredient) {
            $requiredQuantity = $ingredient->quantity * $this->quantity;
            
            $stock = ProductStock::where('product_id', $ingredient->ingredient_product_id)
                ->where('store_id', $this->order->store_id)
                ->lockForUpdate()
                ->first();

            if (!$stock || $stock->available_quantity < $requiredQuantity) {
                throw new \Exception("Insufficient ingredient stock: {$ingredient->ingredient->name}");
            }

            $stock->reserved_quantity += $requiredQuantity;
            $stock->available_quantity = $stock->quantity - $stock->reserved_quantity;
            $stock->save();

            $totalIngredientCost += ($ingredient->ingredient->cost_price ?? 0) * $requiredQuantity;
        }

        $this->update([
            'stock_reserved_at' => now(),
            'stock_reserved_quantity' => $this->quantity,
            'ingredient_cost_calculated' => true,
            'total_ingredient_cost' => $totalIngredientCost,
        ]);

        return true;
    }

    /**
     * Deduct inventory stock when item is served
     */
    public function deductInventoryStock()
    {
        if ($this->stock_deducted_at) {
            return true; // Already deducted
        }

        try {
            return DB::transaction(function() {
                $product = $this->product;
                
                if (!$product || !$product->track_inventory) {
                    $this->update([
                        'stock_deducted_at' => now(),
                        'stock_deducted_quantity' => $this->quantity,
                    ]);
                    return true;
                }

                // Handle recipe stock deduction
                if ($product->is_recipe) {
                    return $this->deductRecipeStock();
                }

                // Deduct simple product stock
                $stock = ProductStock::where('product_id', $product->id)
                    ->where('store_id', $this->order->store_id)
                    ->lockForUpdate()
                    ->first();

                if (!$stock || $stock->reserved_quantity < $this->quantity) {
                    throw new \Exception('Insufficient reserved stock');
                }

                $stock->quantity -= $this->quantity;
                $stock->reserved_quantity -= $this->quantity;
                $stock->available_quantity = $stock->quantity - $stock->reserved_quantity;
                $stock->save();

                // Update batch quantity
                if ($this->batch_used_id) {
                    $batch = ProductBatch::find($this->batch_used_id);
                    if ($batch) {
                        $batch->quantity -= $this->quantity;
                        $batch->save();
                    }
                }

                $this->update([
                    'stock_deducted_at' => now(),
                    'stock_deducted_quantity' => $this->quantity,
                ]);

                Log::info('Stock deducted for order item', [
                    'order_item_id' => $this->id,
                    'product_id' => $product->id,
                    'quantity' => $this->quantity,
                ]);

                return true;
            });
        } catch (\Exception $e) {
            Log::error('Failed to deduct stock for order item', [
                'order_item_id' => $this->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Deduct recipe ingredient stock
     */
    private function deductRecipeStock()
    {
        $product = $this->product;
        $recipeIngredients = $this->getRecipeIngredients($product->id);

        foreach ($recipeIngredients as $ingredient) {
            $requiredQuantity = $ingredient->quantity * $this->quantity;
            
            $stock = ProductStock::where('product_id', $ingredient->ingredient_product_id)
                ->where('store_id', $this->order->store_id)
                ->lockForUpdate()
                ->first();

            if (!$stock || $stock->reserved_quantity < $requiredQuantity) {
                throw new \Exception("Insufficient reserved ingredient stock: {$ingredient->ingredient->name}");
            }

            $stock->quantity -= $requiredQuantity;
            $stock->reserved_quantity -= $requiredQuantity;
            $stock->available_quantity = $stock->quantity - $stock->reserved_quantity;
            $stock->save();
        }

        $this->update([
            'stock_deducted_at' => now(),
            'stock_deducted_quantity' => $this->quantity,
        ]);

        return true;
    }

    /**
     * Release reserved stock for cancelled/modified items
     */
    public function releaseReservedStock($reason = 'Order cancelled')
    {
        if (!$this->stock_reserved_at || $this->stock_deducted_at) {
            return true; // No reserved stock or already deducted
        }

        try {
            return DB::transaction(function() use ($reason) {
                $product = $this->product;
                
                if (!$product || !$product->track_inventory) {
                    return true;
                }

                // Handle recipe stock release
                if ($product->is_recipe) {
                    return $this->releaseRecipeStock($reason);
                }

                // Release simple product stock
                $stock = ProductStock::where('product_id', $product->id)
                    ->where('store_id', $this->order->store_id)
                    ->lockForUpdate()
                    ->first();

                if ($stock) {
                    $stock->reserved_quantity -= $this->stock_reserved_quantity;
                    $stock->available_quantity = $stock->quantity - $stock->reserved_quantity;
                    $stock->save();
                }

                Log::info('Reserved stock released for order item', [
                    'order_item_id' => $this->id,
                    'product_id' => $product->id,
                    'quantity' => $this->stock_reserved_quantity,
                    'reason' => $reason,
                ]);

                return true;
            });
        } catch (\Exception $e) {
            Log::error('Failed to release reserved stock for order item', [
                'order_item_id' => $this->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Release recipe ingredient stock
     */
    private function releaseRecipeStock($reason)
    {
        $product = $this->product;
        $recipeIngredients = $this->getRecipeIngredients($product->id);

        foreach ($recipeIngredients as $ingredient) {
            $requiredQuantity = $ingredient->quantity * $this->stock_reserved_quantity;
            
            $stock = ProductStock::where('product_id', $ingredient->ingredient_product_id)
                ->where('store_id', $this->order->store_id)
                ->lockForUpdate()
                ->first();

            if ($stock) {
                $stock->reserved_quantity -= $requiredQuantity;
                $stock->available_quantity = $stock->quantity - $stock->reserved_quantity;
                $stock->save();
            }
        }

        return true;
    }

    /**
     * Record waste for this item
     */
    public function recordWaste($wasteQuantity, $wasteReason = 'Preparation waste')
    {
        try {
            return DB::transaction(function() use ($wasteQuantity, $wasteReason) {
                $product = $this->product;
                
                if (!$product || !$product->track_inventory) {
                    $this->update([
                        'waste_recorded' => true,
                        'waste_quantity' => $wasteQuantity,
                        'waste_reason' => $wasteReason,
                    ]);
                    return true;
                }

                // Deduct waste from stock
                $stock = ProductStock::where('product_id', $product->id)
                    ->where('store_id', $this->order->store_id)
                    ->lockForUpdate()
                    ->first();

                if ($stock && $stock->quantity >= $wasteQuantity) {
                    $stock->quantity -= $wasteQuantity;
                    $stock->available_quantity = $stock->quantity - $stock->reserved_quantity;
                    $stock->save();
                }

                $this->update([
                    'waste_recorded' => true,
                    'waste_quantity' => $wasteQuantity,
                    'waste_reason' => $wasteReason,
                ]);

                Log::info('Waste recorded for order item', [
                    'order_item_id' => $this->id,
                    'product_id' => $product->id,
                    'waste_quantity' => $wasteQuantity,
                    'waste_reason' => $wasteReason,
                ]);

                return true;
            });
        } catch (\Exception $e) {
            Log::error('Failed to record waste for order item', [
                'order_item_id' => $this->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Record variance between expected and actual usage
     */
    public function recordVariance($varianceQuantity, $varianceReason = 'Usage variance')
    {
        $this->update([
            'variance_quantity' => $varianceQuantity,
            'variance_reason' => $varianceReason,
        ]);

        Log::info('Variance recorded for order item', [
            'order_item_id' => $this->id,
            'variance_quantity' => $varianceQuantity,
            'variance_reason' => $varianceReason,
        ]);

        return true;
    }

    /**
     * Get recipe ingredients for a product
     */
    private function getRecipeIngredients($productId)
    {
        // This would query a recipe_ingredients table
        // For now, return empty collection as placeholder
        return collect([]);
    }

    /**
     * Select optimal batch for this item (FIFO)
     */
    private function selectOptimalBatch($productId, $storeId, $quantity)
    {
        return ProductBatch::where('product_id', $productId)
            ->whereHas('productStock', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->where('quantity', '>', 0)
            ->orderBy('expiry_date', 'asc')
            ->orderBy('created_at', 'asc')
            ->first();
    }

    /**
     * Get inventory summary for this item
     */
    public function getInventorySummary()
    {
        return [
            'item_id' => $this->id,
            'product_name' => $this->product->name,
            'quantity_ordered' => $this->quantity,
            'stock_reserved' => $this->stock_reserved_quantity,
            'stock_reserved_at' => $this->stock_reserved_at,
            'stock_deducted' => $this->stock_deducted_quantity,
            'stock_deducted_at' => $this->stock_deducted_at,
            'waste_quantity' => $this->waste_quantity,
            'waste_reason' => $this->waste_reason,
            'variance_quantity' => $this->variance_quantity,
            'variance_reason' => $this->variance_reason,
            'batch_used' => $this->batchUsed ? [
                'id' => $this->batchUsed->id,
                'batch_number' => $this->batchUsed->batch_number,
                'expiry_date' => $this->batchUsed->expiry_date,
            ] : null,
            'ingredient_cost_calculated' => $this->ingredient_cost_calculated,
            'total_ingredient_cost' => $this->total_ingredient_cost,
            'actual_cost' => $this->calculateActualCost(),
            'food_cost_percentage' => $this->getFoodCostPercentage(),
            'profit_margin' => $this->getProfitMargin(),
        ];
    }

    /**
     * Check if item has inventory issues
     */
    public function hasInventoryIssues()
    {
        return $this->waste_quantity > 0 || 
               $this->variance_quantity != 0 || 
               ($this->stock_reserved_quantity != $this->stock_deducted_quantity);
    }

    /**
     * Get inventory efficiency metrics
     */
    public function getInventoryEfficiency()
    {
        $expectedQuantity = $this->quantity;
        $actualQuantity = $this->stock_deducted_quantity ?? 0;
        $wasteQuantity = $this->waste_quantity ?? 0;
        $varianceQuantity = $this->variance_quantity ?? 0;

        return [
            'efficiency_rate' => $expectedQuantity > 0 ? (($expectedQuantity - $wasteQuantity) / $expectedQuantity) * 100 : 100,
            'waste_rate' => $expectedQuantity > 0 ? ($wasteQuantity / $expectedQuantity) * 100 : 0,
            'variance_rate' => $expectedQuantity > 0 ? (abs($varianceQuantity) / $expectedQuantity) * 100 : 0,
            'accuracy_rate' => $expectedQuantity > 0 ? (($expectedQuantity - abs($varianceQuantity)) / $expectedQuantity) * 100 : 100,
        ];
    }
}