<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use App\Traits\Userstamps;
use App\Models\User;

class OrderModification extends Model
{
    use Userstamps;

    protected $table = 'order_modifications';

    protected $fillable = [
        'order_id',
        'order_item_id',
        'modification_type',
        'old_values',
        'new_values',
        'reason',
        'user_id',
        'store_id',
        'modification_time',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'json',
        'new_values' => 'json',
        'modification_time' => 'datetime',
    ];

    // Relationships
    public function order()
    {
        return $this->belongsTo(RestaurantOrder::class, 'order_id');
    }

    public function orderItem()
    {
        return $this->belongsTo(RestaurantOrderItem::class, 'order_item_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Scopes
    public function byOrder($query, $orderId)
    {
        return $query->where('order_id', $orderId);
    }

    public function byOrderItem($query, $orderItemId)
    {
        return $query->where('order_item_id', $orderItemId);
    }

    public function byType($query, $modificationType)
    {
        return $query->where('modification_type', $modificationType);
    }

    public function byUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function forStore($query, $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    public function inPeriod($query, $startDate, $endDate)
    {
        return $query->whereBetween('modification_time', [$startDate, $endDate]);
    }

    /**
     * Record a new modification
     */
    public static function recordModification($orderId, $modificationType, $oldValues = [], $newValues = [], $reason = '', $orderItemId = null, $userId = null, $storeId = null)
    {
        return self::create([
            'order_id' => $orderId,
            'order_item_id' => $orderItemId,
            'modification_type' => $modificationType,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'reason' => $reason,
            'user_id' => $userId ?? auth()->id(),
            'store_id' => $storeId ?? session('store_id'),
            'modification_time' => now(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    /**
     * Get formatted modification details
     */
    public function getFormattedDetails()
    {
        $details = [
            'id' => $this->id,
            'modification_type' => $this->modification_type,
            'modification_time' => $this->modification_time->toISOString(),
            'reason' => $this->reason,
            'user' => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ] : null,
            'ip_address' => $this->ip_address,
        ];

        // Add specific details based on modification type
        switch ($this->modification_type) {
            case 'item_added':
                $details['details'] = $this->getItemAddedDetails();
                break;

            case 'item_removed':
                $details['details'] = $this->getItemRemovedDetails();
                break;

            case 'quantity_updated':
                $details['details'] = $this->getQuantityUpdatedDetails();
                break;

            case 'modifiers_updated':
                $details['details'] = $this->getModifiersUpdatedDetails();
                break;

            case 'order_cancelled':
                $details['details'] = $this->getOrderCancelledDetails();
                break;

            case 'priority_updated':
                $details['details'] = $this->getPriorityUpdatedDetails();
                break;

            case 'status_updated':
                $details['details'] = $this->getStatusUpdatedDetails();
                break;

            default:
                $details['details'] = [
                    'old_values' => $this->old_values,
                    'new_values' => $this->new_values,
                ];
        }

        return $details;
    }

    /**
     * Get details for item added modification
     */
    private function getItemAddedDetails()
    {
        $newValues = $this->new_values;
        
        return [
            'product_name' => $newValues['product_name'] ?? 'Unknown',
            'quantity' => $newValues['quantity'] ?? 0,
            'unit_price' => $newValues['unit_price'] ?? 0,
            'modifiers' => $newValues['modifiers'] ?? [],
        ];
    }

    /**
     * Get details for item removed modification
     */
    private function getItemRemovedDetails()
    {
        $oldValues = $this->old_values;
        
        return [
            'product_name' => $oldValues['product_name'] ?? 'Unknown',
            'quantity' => $oldValues['quantity'] ?? 0,
            'unit_price' => $oldValues['unit_price'] ?? 0,
            'reason' => $this->reason,
        ];
    }

    /**
     * Get details for quantity updated modification
     */
    private function getQuantityUpdatedDetails()
    {
        $oldValues = $this->old_values;
        $newValues = $this->new_values;
        
        return [
            'product_name' => $newValues['product_name'] ?? $oldValues['product_name'] ?? 'Unknown',
            'old_quantity' => $oldValues['quantity'] ?? 0,
            'new_quantity' => $newValues['quantity'] ?? 0,
            'difference' => ($newValues['quantity'] ?? 0) - ($oldValues['quantity'] ?? 0),
        ];
    }

    /**
     * Get details for modifiers updated modification
     */
    private function getModifiersUpdatedDetails()
    {
        $oldValues = $this->old_values;
        $newValues = $this->new_values;
        
        return [
            'product_name' => $newValues['product_name'] ?? $oldValues['product_name'] ?? 'Unknown',
            'old_modifiers' => $oldValues['modifiers'] ?? [],
            'new_modifiers' => $newValues['modifiers'] ?? [],
        ];
    }

    /**
     * Get details for order cancelled modification
     */
    private function getOrderCancelledDetails()
    {
        $oldValues = $this->old_values;
        
        return [
            'cancellation_reason' => $this->reason,
            'total_amount' => $oldValues['total_amount'] ?? 0,
            'items_count' => $oldValues['items_count'] ?? 0,
        ];
    }

    /**
     * Get details for priority updated modification
     */
    private function getPriorityUpdatedDetails()
    {
        $oldValues = $this->old_values;
        $newValues = $this->new_values;
        
        return [
            'old_priority' => $oldValues['priority'] ?? 'normal',
            'new_priority' => $newValues['priority'] ?? 'normal',
        ];
    }

    /**
     * Get details for status updated modification
     */
    private function getStatusUpdatedDetails()
    {
        $oldValues = $this->old_values;
        $newValues = $this->new_values;
        
        return [
            'old_status' => $oldValues['status'] ?? 'unknown',
            'new_status' => $newValues['status'] ?? 'unknown',
        ];
    }

    /**
     * Get modification summary for reporting
     */
    public function getSummary()
    {
        return [
            'id' => $this->id,
            'modification_type' => $this->modification_type,
            'modification_time' => $this->modification_time->format('Y-m-d H:i:s'),
            'user_name' => $this->user ? $this->user->name : 'Unknown',
            'reason' => $this->reason,
            'has_order_item' => !is_null($this->order_item_id),
        ];
    }

    /**
     * Scope for recent modifications
     */
    public function recent($query, $hours = 24)
    {
        return $query->where('modification_time', '>=', now()->subHours($hours));
    }

    /**
     * Scope for today's modifications
     */
    public function today($query)
    {
        return $query->whereDate('modification_time', today());
    }

    /**
     * Get modification statistics for a period
     */
    public static function getStatistics($storeId, $startDate, $endDate)
    {
        $modifications = self::forStore($storeId)
            ->inPeriod($startDate, $endDate)
            ->get();

        return [
            'total_modifications' => $modifications->count(),
            'modifications_by_type' => $modifications->groupBy('modification_type')->map(function($group) {
                return $group->count();
            }),
            'modifications_by_user' => $modifications->groupBy('user_id')->map(function($group) {
                $user = $group->first()->user;
                return [
                    'user_name' => $user ? $user->name : 'Unknown',
                    'count' => $group->count(),
                ];
            }),
            'modifications_by_hour' => $modifications->groupBy(function($modification) {
                return $modification->modification_time->format('H:00');
            })->map(function($group) {
                return $group->count();
            }),
            'most_common_reasons' => $modifications->where('reason', '!=', '')
                ->groupBy('reason')
                ->map(function($group) {
                    return $group->count();
                })
                ->sortDesc()
                ->take(5),
        ];
    }

    /**
     * Get modification timeline for an order
     */
    public static function getOrderTimeline($orderId)
    {
        return self::byOrder($orderId)
            ->with(['user', 'orderItem.product'])
            ->orderBy('modification_time', 'asc')
            ->get()
            ->map(function($modification) {
                return $modification->getFormattedDetails();
            });
    }

    /**
     * Get modification timeline for an order item
     */
    public static function getItemTimeline($orderItemId)
    {
        return self::byOrderItem($orderItemId)
            ->with(['user', 'orderItem.product'])
            ->orderBy('modification_time', 'asc')
            ->get()
            ->map(function($modification) {
                return $modification->getFormattedDetails();
            });
    }
}