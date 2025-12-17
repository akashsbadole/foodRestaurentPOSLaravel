<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Userstamps;

class ProductEnhanced extends Model
{
    use HasFactory;
    use SoftDeletes;
    use Userstamps;
    
    protected $table = 'products';
    
    protected $fillable = [
        'name',
        'description',
        'sku',
        'barcode',
        'image_url',
        'unit',
        'quantity',
        'alert_quantity',
        'is_stock_managed',
        'is_active',
        'brand_id',
        'category_id',
        'discount',
        'is_featured',
        'product_type',
        'meta_data',
        'attachment_id',
        // Restaurant-specific inventory fields
        'is_recipe',
        'track_inventory',
        'cost_price',
        'selling_price',
        'popularity_score',
        'order_count',
        'total_sold',
        'last_sold_at',
        'is_perishable',
        'shelf_life_days',
        'storage_requirements',
        'allergen_info',
        'nutritional_info',
        'preparation_time',
        'is_kitchen_item',
        'is_available',
        'is_delivery_available',
        'is_takeaway_available',
        'product_category',
    ];

    protected $casts = [
        'meta_data' => 'array',
        'allergen_info' => 'array',
        'nutritional_info' => 'array',
        'storage_requirements' => 'array',
        'is_stock_managed' => 'boolean',
        'is_recipe' => 'boolean',
        'track_inventory' => 'boolean',
        'is_perishable' => 'boolean',
        'is_kitchen_item' => 'boolean',
        'is_available' => 'boolean',
        'is_delivery_available' => 'boolean',
        'is_takeaway_available' => 'boolean',
        'last_sold_at' => 'datetime',
    ];

    public function batches()
    {
        return $this->hasMany(ProductBatch::class, 'product_id');
    }

    public function stocks()
    {
        return $this->hasMany(ProductStock::class, 'product_id');
    }

    public function collections()
    {
        return $this->belongsToMany(Collection::class, 'collection_product');
    }

    // Restaurant-specific relationships
    public function modifierGroups()
    {
        return $this->belongsToMany(\App\Models\Restaurant\MenuModifierGroup::class, 'product_modifier_groups')
                    ->withPivot('is_required', 'display_order')
                    ->withTimestamps();
    }

    public function kitchenStations()
    {
        return $this->belongsToMany(\App\Models\Restaurant\KitchenStation::class, 'kitchen_station_items')
                    ->withPivot('preparation_time', 'display_order')
                    ->withTimestamps();
    }

    public function restaurantOrderItems()
    {
        return $this->hasMany(\App\Models\Restaurant\RestaurantOrderItem::class);
    }

    // Recipe ingredients relationship
    public function recipeIngredients()
    {
        return $this->hasMany(RecipeIngredient::class, 'recipe_product_id');
    }

    public function ingredientRecipes()
    {
        return $this->hasMany(RecipeIngredient::class, 'ingredient_product_id');
    }

    // Restaurant-specific scopes
    public function scopeFood($query)
    {
        return $query->where('product_category', 'food');
    }

    public function scopeBeverage($query)
    {
        return $query->where('product_category', 'beverage');
    }

    public function scopeKitchenItems($query)
    {
        return $query->where('is_kitchen_item', true);
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    public function scopeStockManaged($query)
    {
        return $query->where('track_inventory', true);
    }

    public function scopePerishable($query)
    {
        return $query->where('is_perishable', true);
    }

    public function scopeRecipe($query)
    {
        return $query->where('is_recipe', true);
    }

    // Restaurant-specific methods
    public function isAvailableForRestaurant()
    {
        return $this->is_active && $this->is_available;
    }

    public function getPreparationTime()
    {
        return $this->preparation_time ?? 0;
    }

    public function getAllergenInfo()
    {
        return $this->allergen_info ?? [];
    }

    public function getNutritionalInfo()
    {
        return $this->nutritional_info ?? [];
    }

    public function getStorageRequirements()
    {
        return $this->storage_requirements ?? [];
    }

    public function isExpiringSoon($days = 7)
    {
        if (!$this->is_perishable) {
            return false;
        }

        return $this->batches()
            ->where('expiry_date', '<=', now()->addDays($days))
            ->where('expiry_date', '>', now())
            ->exists();
    }

    public function getExpiringBatches($days = 7)
    {
        if (!$this->is_perishable) {
            return collect([]);
        }

        return $this->batches()
            ->where('expiry_date', '<=', now()->addDays($days))
            ->where('expiry_date', '>', now())
            ->orderBy('expiry_date', 'asc')
            ->get();
    }

    public function getCurrentStock($storeId = null)
    {
        $query = $this->stocks();
        
        if ($storeId) {
            $query->where('store_id', $storeId);
        }

        return $query->sum('quantity');
    }

    public function getAvailableStock($storeId = null)
    {
        $query = $this->stocks();
        
        if ($storeId) {
            $query->where('store_id', $storeId);
        }

        return $query->sum('available_quantity');
    }

    public function getReservedStock($storeId = null)
    {
        $query = $this->stocks();
        
        if ($storeId) {
            $query->where('store_id', $storeId);
        }

        return $query->sum('reserved_quantity');
    }

    public function isLowStock($storeId = null)
    {
        $availableStock = $this->getAvailableStock($storeId);
        return $availableStock <= $this->alert_quantity;
    }

    public function isOutOfStock($storeId = null)
    {
        $availableStock = $this->getAvailableStock($storeId);
        return $availableStock <= 0;
    }

    public function getStockStatus($storeId = null)
    {
        $availableStock = $this->getAvailableStock($storeId);
        
        if ($availableStock <= 0) {
            return 'out_of_stock';
        } elseif ($availableStock <= $this->alert_quantity) {
            return 'low_stock';
        } else {
            return 'in_stock';
        }
    }

    public function getFoodCostPercentage()
    {
        if (!$this->selling_price || $this->selling_price <= 0) {
            return 0;
        }

        return ($this->cost_price / $this->selling_price) * 100;
    }

    public function getProfitMargin()
    {
        if (!$this->selling_price || $this->selling_price <= 0) {
            return 0;
        }

        return (($this->selling_price - $this->cost_price) / $this->selling_price) * 100;
    }

    public function getPopularityScore()
    {
        return $this->popularity_score ?? 0;
    }

    public function incrementPopularity($amount = 1)
    {
        $this->increment('popularity_score', $amount);
        $this->increment('order_count');
        $this->touch();
    }

    public function recordSale($quantity, $storeId = null)
    {
        $this->increment('total_sold', $quantity);
        $this->increment('order_count');
        $this->last_sold_at = now();
        $this->save();

        // Update stock if stock is managed
        if ($this->track_inventory && $storeId) {
            $stock = $this->stocks()->where('store_id', $storeId)->first();
            if ($stock) {
                $stock->decrement('quantity', $quantity);
                $stock->decrement('available_quantity', $quantity);
            }
        }
    }

    public function canBeSold($storeId = null, $quantity = 1)
    {
        if (!$this->isAvailableForRestaurant()) {
            return false;
        }

        if ($this->track_inventory) {
            $availableStock = $this->getAvailableStock($storeId);
            return $availableStock >= $quantity;
        }

        return true;
    }

    public function getRecipeIngredientsList()
    {
        if (!$this->is_recipe) {
            return collect([]);
        }

        return $this->recipeIngredients()
            ->with('ingredient')
            ->get()
            ->map(function ($ingredient) {
                return [
                    'ingredient_id' => $ingredient->ingredient_product_id,
                    'ingredient_name' => $ingredient->ingredient->name,
                    'quantity' => $ingredient->quantity,
                    'unit' => $ingredient->unit,
                    'cost' => $ingredient->ingredient->cost_price ?? 0,
                    'total_cost' => ($ingredient->ingredient->cost_price ?? 0) * $ingredient->quantity,
                ];
            });
    }

    public function calculateRecipeCost()
    {
        if (!$this->is_recipe) {
            return $this->cost_price ?? 0;
        }

        return $this->recipeIngredients()
            ->with('ingredient')
            ->get()
            ->sum(function ($ingredient) {
                return ($ingredient->ingredient->cost_price ?? 0) * $ingredient->quantity;
            });
    }

    public function updateRecipeCost()
    {
        if ($this->is_recipe) {
            $this->cost_price = $this->calculateRecipeCost();
            $this->save();
        }
    }

    public function getDailyUsage($storeId = null, $days = 30)
    {
        $query = \App\Models\InventoryTransactionItem::join('inventory_transactions', 'inventory_transaction_items.inventory_transaction_id', '=', 'inventory_transactions.id')
            ->where('inventory_transaction_items.product_id', $this->id)
            ->where('inventory_transactions.transaction_type', 'sale')
            ->where('inventory_transactions.created_at', '>=', now()->subDays($days));

        if ($storeId) {
            $query->where('inventory_transactions.store_id', $storeId);
        }

        $totalUsage = $query->sum('inventory_transaction_items.quantity');
        return abs($totalUsage) / $days;
    }

    public function getDaysOfStock($storeId = null)
    {
        if (!$this->track_inventory) {
            return 999; // Infinite for non-stock items
        }

        $dailyUsage = $this->getDailyUsage($storeId);
        if ($dailyUsage <= 0) {
            return 999;
        }

        $currentStock = $this->getAvailableStock($storeId);
        return floor($currentStock / $dailyUsage);
    }

    public function getReorderPoint($storeId = null)
    {
        $dailyUsage = $this->getDailyUsage($storeId);
        $leadTime = 7; // Default 7 days lead time
        $safetyStock = $dailyUsage * 3; // 3 days safety stock
        
        return ($dailyUsage * $leadTime) + $safetyStock;
    }

    public function shouldReorder($storeId = null)
    {
        if (!$this->track_inventory) {
            return false;
        }

        $currentStock = $this->getAvailableStock($storeId);
        $reorderPoint = $this->getReorderPoint($storeId);
        
        return $currentStock <= $reorderPoint;
    }

    public function getSuggestedOrderQuantity($storeId = null)
    {
        if (!$this->track_inventory) {
            return 0;
        }

        $currentStock = $this->getAvailableStock($storeId);
        $reorderPoint = $this->getReorderPoint($storeId);
        
        if ($currentStock > $reorderPoint) {
            return 0;
        }

        $maxStock = $reorderPoint * 2; // Order up to 2x reorder point
        return max(0, $maxStock - $currentStock);
    }
}