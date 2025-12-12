<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Userstamps;

class Product extends Model
{
    use HasFactory;
    use SoftDeletes;
    use Userstamps;
    
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
    ];

    protected $casts = [
        'meta_data' => 'array', // Ensure the meta_data column is treated as an array
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
}
