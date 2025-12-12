<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use App\Models\Store;
use App\Models\Product;

class MenuModifierGroup extends Model
{
    protected $table = 'menu_modifier_groups';

    protected $fillable = [
        'name',
        'description',
        'selection_type',
        'min_selections',
        'max_selections',
        'display_order',
        'is_active',
        'store_id',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Relationships
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function modifiers()
    {
        return $this->belongsToMany(MenuModifier::class, 'menu_modifier_group_items')
                    ->withPivot('price_adjustment', 'display_order')
                    ->withTimestamps()
                    ->orderBy('menu_modifier_group_items.display_order');
    }

    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_modifier_groups')
                    ->withPivot('is_required', 'display_order')
                    ->withTimestamps();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForStore($query, $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    // Methods
    public function isValidSelection($selectedModifiers)
    {
        $count = count($selectedModifiers);
        
        if ($this->selection_type === 'single' && $count !== 1) {
            return false;
        }
        
        if ($count < $this->min_selections || $count > $this->max_selections) {
            return false;
        }
        
        return true;
    }
}