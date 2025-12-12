<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use App\Models\Store;

class TableSection extends Model
{
    protected $table = 'table_sections';

    protected $fillable = [
        'name',
        'description',
        'store_id',
    ];

    // Relationships
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    public function tables()
    {
        return $this->hasMany(RestaurantTable::class, 'section_id');
    }

    // Scopes
    public function scopeForStore($query, $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    // Methods
    public function getAvailableTablesCount()
    {
        return $this->tables()->where('status', 'available')->count();
    }

    public function getOccupiedTablesCount()
    {
        return $this->tables()->where('status', 'occupied')->count();
    }

    public function getTotalCapacity()
    {
        return $this->tables()->sum('capacity');
    }
}