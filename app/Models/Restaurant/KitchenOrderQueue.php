<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class KitchenOrderQueue extends Model
{
    protected $table = 'kitchen_order_queue';

    protected $fillable = [
        'order_item_id',
        'station_id',
        'status',
        'priority',
        'estimated_time',
        'started_at',
        'completed_at',
        'completed_by',
        'notes',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    // Relationships
    public function orderItem()
    {
        return $this->belongsTo(RestaurantOrderItem::class, 'order_item_id');
    }

    public function station()
    {
        return $this->belongsTo(KitchenStation::class, 'station_id');
    }

    public function completedBy()
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }

    public function scopeForStation($query, $stationId)
    {
        return $query->where('station_id', $stationId);
    }

    // Methods
    public function startPreparation()
    {
        $this->status = 'in_progress';
        $this->started_at = now();
        $this->save();
    }

    public function markAsReady()
    {
        $this->status = 'ready';
        $this->save();
    }

    public function complete($completedBy)
    {
        $this->status = 'completed';
        $this->completed_at = now();
        $this->completed_by = $completedBy;
        $this->save();
    }

    public function getPreparationTime()
    {
        if ($this->started_at && $this->completed_at) {
            return $this->started_at->diffInMinutes($this->completed_at);
        }
        return null;
    }
}