<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Services\Restaurant\KOTGenerationService;
use App\Services\Restaurant\KOTPrintService;
use Illuminate\Support\Facades\Log;

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
        'kot_number',
        'printed_at',
        'stock_verified',
        'stock_verified_at',
        'stock_verified_by',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'printed_at' => 'datetime',
        'stock_verified_at' => 'datetime',
        'stock_verified' => 'boolean',
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

    /**
     * Generate unique KOT number
     */
    public static function generateKOTNumber()
    {
        $prefix = 'KOT';
        $date = now()->format('Ymd');
        
        $lastKOT = self::whereDate('created_at', today())
            ->orderBy('created_at', 'desc')
            ->first();

        $sequence = $lastKOT ? intval(substr($lastKOT->kot_number ?? 'KOT' . $date . '0000', -4)) + 1 : 1;
        
        return $prefix . $date . str_pad($sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Mark KOT as stock verified
     */
    public function markStockVerified($verifiedBy = null)
    {
        $this->stock_verified = true;
        $this->stock_verified_at = now();
        $this->stock_verified_by = $verifiedBy;
        $this->save();
    }

    /**
     * Print KOT
     */
    public function printKOT()
    {
        try {
            $printService = new KOTPrintService();
            $result = $printService->printKOT($this);
            
            if ($result['success']) {
                $this->printed_at = now();
                $this->save();
            }
            
            return $result;
        } catch (\Exception $e) {
            Log::error('KOT printing failed', [
                'kot_id' => $this->id,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => 'KOT printing failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Export KOT as text
     */
    public function exportAsText()
    {
        $printService = new KOTPrintService();
        return $printService->exportKOTAsText($this);
    }

    /**
     * Export KOT as JSON
     */
    public function exportAsJSON()
    {
        $printService = new KOTPrintService();
        return $printService->exportKOTAsJSON($this);
    }

    /**
     * Check if KOT can be modified
     */
    public function canBeModified()
    {
        return in_array($this->status, ['queued', 'in_progress']);
    }

    /**
     * Check if KOT is overdue
     */
    public function isOverdue()
    {
        if (!$this->estimated_time || $this->status === 'completed') {
            return false;
        }

        $elapsedTime = $this->created_at->diffInMinutes(now());
        return $elapsedTime > $this->estimated_time;
    }

    /**
     * Get overdue time in minutes
     */
    public function getOverdueTime()
    {
        if (!$this->isOverdue()) {
            return 0;
        }

        $elapsedTime = $this->created_at->diffInMinutes(now());
        return $elapsedTime - $this->estimated_time;
    }

    /**
     * Get KOT priority score for sorting
     */
    public function getPriorityScore()
    {
        $priorityScores = [
            'urgent' => 1000,
            'high' => 750,
            'normal' => 500,
            'low' => 250
        ];

        $baseScore = $priorityScores[$this->priority] ?? 500;
        
        // Add urgency based on wait time
        $waitTime = $this->created_at->diffInMinutes(now());
        $urgencyBonus = min($waitTime * 2, 200); // Max 200 points for wait time
        
        // Add overdue penalty
        $overduePenalty = $this->isOverdue() ? $this->getOverdueTime() * 5 : 0;
        
        return $baseScore + $urgencyBonus + $overduePenalty;
    }

    /**
     * Update KOT status with validation
     */
    public function updateStatus($newStatus, $updatedBy = null)
    {
        if (!$this->isValidStatusTransition($this->status, $newStatus)) {
            throw new \Exception("Invalid status transition from {$this->status} to {$newStatus}");
        }

        $this->status = $newStatus;
        
        // Set timestamps based on status
        switch ($newStatus) {
            case 'in_progress':
                $this->started_at = now();
                break;
            case 'completed':
                $this->completed_at = now();
                $this->completed_by = $updatedBy;
                break;
        }
        
        $this->save();
        
        // Update related order item status
        $this->updateOrderItemStatus();
    }

    /**
     * Validate status transitions
     */
    private function isValidStatusTransition($currentStatus, $newStatus)
    {
        $validTransitions = [
            'queued' => ['in_progress', 'cancelled'],
            'in_progress' => ['ready', 'cancelled'],
            'ready' => ['completed', 'cancelled'],
            'completed' => [],
            'cancelled' => []
        ];

        return in_array($newStatus, $validTransitions[$currentStatus] ?? []);
    }

    /**
     * Update related order item status based on KOT status
     */
    private function updateOrderItemStatus()
    {
        $orderItem = $this->orderItem;
        
        if (!$orderItem) {
            return;
        }

        $statusMapping = [
            'queued' => 'confirmed',
            'in_progress' => 'preparing',
            'ready' => 'ready',
            'completed' => 'ready',
            'cancelled' => 'cancelled'
        ];

        $newItemStatus = $statusMapping[$this->status] ?? null;
        
        if ($newItemStatus && $orderItem->status !== $newItemStatus) {
            $orderItem->status = $newItemStatus;
            $orderItem->save();
            
            // Check if all items in the order are ready
            $this->checkOrderReadiness();
        }
    }

    /**
     * Check if all items in the order are ready
     */
    private function checkOrderReadiness()
    {
        $order = $this->orderItem->order;
        
        if (!$order) {
            return;
        }

        $allItemsReady = $order->items()->whereNotIn('status', ['ready', 'served', 'cancelled'])->count() === 0;
        
        if ($allItemsReady && $order->status !== 'ready') {
            $order->status = 'ready';
            $order->save();
        }
    }

    /**
     * Get KOT summary for display
     */
    public function getSummary()
    {
        return [
            'id' => $this->id,
            'kot_number' => $this->kot_number,
            'order_item_id' => $this->order_item_id,
            'station_id' => $this->station_id,
            'station_name' => $this->station->name ?? null,
            'status' => $this->status,
            'priority' => $this->priority,
            'priority_score' => $this->getPriorityScore(),
            'estimated_time' => $this->estimated_time,
            'elapsed_time' => $this->created_at->diffInMinutes(now()),
            'is_overdue' => $this->isOverdue(),
            'overdue_time' => $this->getOverdueTime(),
            'stock_verified' => $this->stock_verified,
            'printed_at' => $this->printed_at,
            'notes' => $this->notes,
            'order_info' => [
                'order_number' => $this->orderItem->order->order_number ?? null,
                'table_number' => $this->orderItem->order->table->table_number ?? null,
                'order_type' => $this->orderItem->order->order_type ?? null,
            ],
            'item_info' => [
                'product_name' => $this->orderItem->product->name ?? null,
                'quantity' => $this->orderItem->quantity ?? null,
                'special_instructions' => $this->orderItem->special_instructions,
            ]
        ];
    }

    /**
     * Scope for KOTs by priority score
     */
    public function scopeByPriorityScore($query)
    {
        return $query->orderByRaw('(
            CASE priority
                WHEN "urgent" THEN 1000
                WHEN "high" THEN 750
                WHEN "normal" THEN 500
                WHEN "low" THEN 250
                ELSE 500
            END +
            LEAST(EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 * 2, 200) +
            CASE
                WHEN estimated_time IS NOT NULL AND EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 > estimated_time
                THEN (EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 - estimated_time) * 5
                ELSE 0
            END
        ) DESC');
    }

    /**
     * Scope for overdue KOTs
     */
    public function scopeOverdue($query)
    {
        return $query->whereRaw('estimated_time IS NOT NULL AND EXTRACT(EPOCH FROM (NOW() - created_at)) / 60 > estimated_time')
                    ->whereNotIn('status', ['completed', 'cancelled']);
    }

    /**
     * Scope for stock verified KOTs
     */
    public function scopeStockVerified($query)
    {
        return $query->where('stock_verified', true);
    }

    /**
     * Scope for pending stock verification
     */
    public function scopePendingStockVerification($query)
    {
        return $query->where('stock_verified', false);
    }

    /**
     * Handle KOT modification for order item changes
     */
    public function handleModification($modificationType, $data = [])
    {
        switch ($modificationType) {
            case 'quantity_updated':
                $this->handleQuantityUpdate($data['old_quantity'], $data['new_quantity']);
                break;

            case 'modifiers_updated':
                $this->handleModifiersUpdate($data['old_modifiers'], $data['new_modifiers']);
                break;

            case 'item_cancelled':
                $this->handleItemCancellation($data['reason'] ?? 'Item cancelled');
                break;

            case 'priority_updated':
                $this->handlePriorityUpdate($data['old_priority'], $data['new_priority']);
                break;

            case 'station_reassigned':
                $this->handleStationReassignment($data['old_station_id'], $data['new_station_id']);
                break;
        }

        // Update notes with modification information
        $modificationNote = $this->generateModificationNote($modificationType, $data);
        if ($modificationNote) {
            $this->notes = ($this->notes ?? '') . ' | ' . $modificationNote;
            $this->save();
        }
    }

    /**
     * Handle quantity update for KOT
     */
    private function handleQuantityUpdate($oldQuantity, $newQuantity)
    {
        if ($this->status === 'completed' || $this->status === 'cancelled') {
            throw new \Exception('Cannot modify quantity for completed or cancelled KOT');
        }

        // Update estimated preparation time based on new quantity
        $orderItem = $this->orderItem;
        $station = $this->station;
        
        if ($orderItem && $station) {
            $baseTime = $station->products()
                ->where('product_id', $orderItem->product_id)
                ->first()
                ?->pivot->preparation_time ?? 15;

            $quantityMultiplier = max(1, $newQuantity / 2);
            $modifierTime = 0;

            foreach ($orderItem->modifiers as $modifier) {
                if ($modifier->modifier->modifier_type === 'preparation_heavy') {
                    $modifierTime += 5;
                }
            }

            $stationLoad = $station->getActiveQueueCount();
            $loadMultiplier = 1 + ($stationLoad * 0.1);

            $this->estimated_time = (int) round(($baseTime + $modifierTime) * $quantityMultiplier * $loadMultiplier);
            $this->save();
        }
    }

    /**
     * Handle modifiers update for KOT
     */
    private function handleModifiersUpdate($oldModifiers, $newModifiers)
    {
        if ($this->status === 'completed' || $this->status === 'cancelled') {
            throw new \Exception('Cannot modify modifiers for completed or cancelled KOT');
        }

        // Update estimated preparation time based on modifier changes
        $orderItem = $this->orderItem;
        $station = $this->station;
        
        if ($orderItem && $station) {
            $baseTime = $station->products()
                ->where('product_id', $orderItem->product_id)
                ->first()
                ?->pivot->preparation_time ?? 15;

            $quantityMultiplier = max(1, $orderItem->quantity / 2);
            $modifierTime = 0;

            foreach ($orderItem->modifiers as $modifier) {
                if ($modifier->modifier->modifier_type === 'preparation_heavy') {
                    $modifierTime += 5;
                }
            }

            $stationLoad = $station->getActiveQueueCount();
            $loadMultiplier = 1 + ($stationLoad * 0.1);

            $this->estimated_time = (int) round(($baseTime + $modifierTime) * $quantityMultiplier * $loadMultiplier);
            $this->save();
        }
    }

    /**
     * Handle item cancellation for KOT
     */
    private function handleItemCancellation($reason)
    {
        if (in_array($this->status, ['completed', 'cancelled'])) {
            return; // Already handled
        }

        $this->status = 'cancelled';
        $this->notes = ($this->notes ?? '') . ' | Cancelled: ' . $reason;
        $this->save();

        // Update related order item status
        $orderItem = $this->orderItem;
        if ($orderItem) {
            $orderItem->status = 'cancelled';
            $orderItem->void_reason = $reason;
            $orderItem->save();
        }

        // Check if all items in the order are ready
        $this->checkOrderReadiness();
    }

    /**
     * Handle priority update for KOT
     */
    private function handlePriorityUpdate($oldPriority, $newPriority)
    {
        if (in_array($this->status, ['completed', 'cancelled'])) {
            throw new \Exception('Cannot modify priority for completed or cancelled KOT');
        }

        $this->priority = $newPriority;
        $this->save();

        // Reorder queue if necessary
        $this->reorderQueue();
    }

    /**
     * Handle station reassignment for KOT
     */
    private function handleStationReassignment($oldStationId, $newStationId)
    {
        if (in_array($this->status, ['completed', 'cancelled'])) {
            throw new \Exception('Cannot reassign station for completed or cancelled KOT');
        }

        // Update station
        $this->station_id = $newStationId;
        $this->save();

        // Recalculate estimated time for new station
        $orderItem = $this->orderItem;
        $newStation = \App\Models\Restaurant\KitchenStation::find($newStationId);
        
        if ($orderItem && $newStation) {
            $baseTime = $newStation->products()
                ->where('product_id', $orderItem->product_id)
                ->first()
                ?->pivot->preparation_time ?? 15;

            $quantityMultiplier = max(1, $orderItem->quantity / 2);
            $modifierTime = 0;

            foreach ($orderItem->modifiers as $modifier) {
                if ($modifier->modifier->modifier_type === 'preparation_heavy') {
                    $modifierTime += 5;
                }
            }

            $stationLoad = $newStation->getActiveQueueCount();
            $loadMultiplier = 1 + ($stationLoad * 0.1);

            $this->estimated_time = (int) round(($baseTime + $modifierTime) * $quantityMultiplier * $loadMultiplier);
            $this->save();
        }
    }

    /**
     * Generate modification note for KOT
     */
    private function generateModificationNote($modificationType, $data)
    {
        $timestamp = now()->format('H:i');
        
        switch ($modificationType) {
            case 'quantity_updated':
                return "[$timestamp] Quantity changed from {$data['old_quantity']} to {$data['new_quantity']}";
                
            case 'modifiers_updated':
                return "[$timestamp] Modifiers updated";
                
            case 'item_cancelled':
                return "[$timestamp] Item cancelled: {$data['reason']}";
                
            case 'priority_updated':
                return "[$timestamp] Priority changed from {$data['old_priority']} to {$data['new_priority']}";
                
            case 'station_reassigned':
                $oldStation = \App\Models\Restaurant\KitchenStation::find($data['old_station_id']);
                $newStation = \App\Models\Restaurant\KitchenStation::find($data['new_station_id']);
                return "[$timestamp] Station reassigned from {$oldStation->name} to {$newStation->name}";
                
            default:
                return "[$timestamp] Modified: $modificationType";
        }
    }

    /**
     * Reorder queue based on priority scores
     */
    private function reorderQueue()
    {
        // This would typically trigger a queue reordering process
        // For now, we'll just log the action
        Log::info('KOT queue reordered due to priority change', [
            'kot_id' => $this->id,
            'new_priority' => $this->priority
        ]);
    }

    /**
     * Get modification history for this KOT
     */
    public function getModificationHistory()
    {
        // Parse notes to extract modification history
        $history = [];
        $notes = $this->notes ?? '';

        // Look for modification patterns in notes
        $pattern = '/\[(\d{2}:\d{2})\] (Modified|Quantity changed|Modifiers updated|Item cancelled|Priority changed|Station reassigned): (.+?)(?= \[\d{2}:\d{2}\]|$)/';
        
        if (preg_match_all($pattern, $notes, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $history[] = [
                    'timestamp' => $match[1],
                    'type' => $match[2],
                    'details' => $match[3]
                ];
            }
        }

        return $history;
    }

    /**
     * Check if KOT can be modified based on current status
     */
    public function canBeModified()
    {
        return in_array($this->status, ['queued', 'in_progress']);
    }

    /**
     * Check if KOT can be cancelled
     */
    public function canBeCancelled()
    {
        return in_array($this->status, ['queued', 'in_progress']);
    }

    /**
     * Check if KOT can be reassigned to different station
     */
    public function canBeReassigned()
    {
        return in_array($this->status, ['queued']);
    }

    /**
     * Get real-time status for kitchen display
     */
    public function getRealTimeStatus()
    {
        $orderItem = $this->orderItem;
        $order = $orderItem ? $orderItem->order : null;

        return [
            'kot_id' => $this->id,
            'kot_number' => $this->kot_number,
            'status' => $this->status,
            'priority' => $this->priority,
            'priority_score' => $this->getPriorityScore(),
            'estimated_time' => $this->estimated_time,
            'elapsed_time' => $this->created_at->diffInMinutes(now()),
            'is_overdue' => $this->isOverdue(),
            'overdue_time' => $this->getOverdueTime(),
            'station' => [
                'id' => $this->station->id,
                'name' => $this->station->name,
                'printer_name' => $this->station->printer_name
            ],
            'order_info' => [
                'order_number' => $order ? $order->order_number : null,
                'table_number' => $order && $order->table ? $order->table->table_number : null,
                'order_type' => $order ? $order->order_type : null,
                'customer_count' => $order ? $order->customer_count : null,
            ],
            'item_info' => [
                'product_name' => $orderItem ? $orderItem->product->name : null,
                'quantity' => $orderItem ? $orderItem->quantity : null,
                'special_instructions' => $orderItem ? $orderItem->special_instructions : null,
                'preparation_notes' => $orderItem ? $orderItem->preparation_notes : null,
                'modifiers' => $orderItem ? $orderItem->modifiers->map(function($modifier) {
                    return [
                        'name' => $modifier->modifier->name,
                        'quantity' => $modifier->quantity
                    ];
                })->toArray() : [],
            ],
            'timing' => [
                'created_at' => $this->created_at,
                'started_at' => $this->started_at,
                'completed_at' => $this->completed_at,
                'preparation_time' => $this->getPreparationTime(),
                'printed_at' => $this->printed_at,
            ],
            'stock_info' => [
                'verified' => $this->stock_verified,
                'verified_at' => $this->stock_verified_at,
                'verified_by' => $this->stock_verified_by,
            ],
            'modification_info' => [
                'can_be_modified' => $this->canBeModified(),
                'can_be_cancelled' => $this->canBeCancelled(),
                'can_be_reassigned' => $this->canBeReassigned(),
                'modification_history' => $this->getModificationHistory(),
            ]
        ];
    }

    /**
     * Broadcast KOT status update to kitchen displays
     */
    public function broadcastStatusUpdate()
    {
        // This would typically broadcast via WebSocket or similar real-time technology
        $statusData = $this->getRealTimeStatus();
        
        Log::info('KOT status update broadcasted', [
            'kot_id' => $this->id,
            'status' => $this->status,
            'timestamp' => now()
        ]);

        return $statusData;
    }
}