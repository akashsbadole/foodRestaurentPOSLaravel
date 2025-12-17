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

class RestaurantOrderItem extends Model
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
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'unit_cost' => 'decimal:2',
        'discount' => 'decimal:2',
        'kitchen_printed_at' => 'datetime',
        'served_at' => 'datetime',
        'is_complimentary' => 'boolean',
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
        return $this->belongsTo(ProductBatch::class);
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
     * Calculate modifier pricing for this item
     */
    public function calculateModifierPricing()
    {
        $modifierTotal = 0;
        
        foreach ($this->modifiers as $modifier) {
            $modifierTotal += $modifier->price_adjustment * $modifier->quantity;
        }
        
        return $modifierTotal;
    }

    /**
     * Validate item data before creation
     */
    public static function validateItemData($data, $storeId)
    {
        $errors = [];
        
        // Validate product exists and is active
        $product = Product::find($data['product_id']);
        if (!$product) {
            $errors['product'] = 'Product not found';
        } elseif (!$product->is_active) {
            $errors['product'] = 'Product is not available';
        }
        
        // Validate stock if product manages stock
        if ($product && $product->is_stock_managed) {
            $stock = ProductStock::where('product_id', $data['product_id'])
                ->where('store_id', $storeId)
                ->sum('quantity');
            
            if ($stock < $data['quantity']) {
                $errors['stock'] = "Insufficient stock. Available: {$stock}, Requested: {$data['quantity']}";
            }
        }
        
        // Validate modifiers if any
        if (isset($data['modifiers']) && !empty($data['modifiers'])) {
            $modifierIds = collect($data['modifiers'])->pluck('modifier_id');
            $modifiers = MenuModifier::whereIn('id', $modifierIds)->active()->get();
            
            if ($modifiers->count() !== $modifierIds->count()) {
                $errors['modifiers'] = 'One or more selected modifiers are not available';
            }
        }
        
        return $errors;
    }

    /**
     * Reserve stock for this item
     */
    public function reserveStock($storeId, $quantity)
    {
        $product = Product::find($this->product_id);
        
        if (!$product || !$product->is_stock_managed) {
            return true;
        }
        
        return DB::transaction(function() use ($storeId, $quantity) {
            // Get current stock with lock
            $stock = ProductStock::where('product_id', $this->product_id)
                ->where('store_id', $storeId)
                ->lockForUpdate()
                ->first();
            
            if (!$stock || $stock->quantity < $quantity) {
                throw new \Exception('Insufficient stock for reservation');
            }
            
            // Reserve stock by reducing available quantity
            $stock->quantity -= $quantity;
            $stock->save();
            
            return true;
        });
    }

    /**
     * Release reserved stock for this item
     */
    public function releaseStock($storeId, $quantity)
    {
        $product = Product::find($this->product_id);
        
        if (!$product || !$product->is_stock_managed) {
            return true;
        }
        
        return DB::transaction(function() use ($storeId, $quantity) {
            // Get current stock with lock
            $stock = ProductStock::where('product_id', $this->product_id)
                ->where('store_id', $storeId)
                ->lockForUpdate()
                ->first();
            
            if (!$stock) {
                // Create stock record if it doesn't exist
                $stock = ProductStock::create([
                    'product_id' => $this->product_id,
                    'store_id' => $storeId,
                    'quantity' => $quantity,
                ]);
            } else {
                // Release stock by increasing available quantity
                $stock->quantity += $quantity;
                $stock->save();
            }
            
            return true;
        });
    }

    /**
     * Consume stock when item is prepared/served
     */
    public function consumeStock($storeId, $quantity)
    {
        $product = Product::find($this->product_id);
        
        if (!$product || !$product->is_stock_managed) {
            return true;
        }
        
        return DB::transaction(function() use ($storeId, $quantity) {
            // Stock was already reserved during order creation
            // This method finalizes the stock consumption
            return true;
        });
    }

    /**
     * Add modifier to this item with validation
     */
    public function addModifier($modifierId, $quantity, $priceAdjustment)
    {
        $modifier = MenuModifier::find($modifierId);
        
        if (!$modifier || !$modifier->is_active) {
            throw new \Exception('Modifier not available');
        }
        
        return RestaurantOrderItemModifier::create([
            'order_item_id' => $this->id,
            'modifier_id' => $modifierId,
            'quantity' => $quantity,
            'price_adjustment' => $priceAdjustment,
        ]);
    }

    /**
     * Update item quantity with stock validation
     */
    public function updateQuantity($newQuantity, $storeId)
    {
        $product = Product::find($this->product_id);
        
        if ($product && $product->is_stock_managed) {
            return DB::transaction(function() use ($newQuantity, $storeId) {
                $currentQuantity = $this->quantity;
                $difference = $newQuantity - $currentQuantity;
                
                if ($difference > 0) {
                    // Need to reserve more stock
                    $this->reserveStock($storeId, $difference);
                } elseif ($difference < 0) {
                    // Need to release some stock
                    $this->releaseStock($storeId, abs($difference));
                }
                
                $this->quantity = $newQuantity;
                $this->save();
                
                return true;
            });
        } else {
            $this->quantity = $newQuantity;
            $this->save();
            return true;
        }
    }

    public function addToKitchenQueue($stationId)
    {
        return KitchenOrderQueue::create([
            'order_item_id' => $this->id,
            'station_id' => $stationId,
            'status' => 'queued',
            'priority' => $this->order->priority,
        ]);
    }

    public function markAsServed($servedBy = null)
    {
        $this->status = 'served';
        $this->served_by = $servedBy;
        $this->served_at = now();
        $this->save();
        
        // Consume stock for products with stock management
        if ($this->product && $this->product->is_stock_managed) {
            $this->consumeStock($this->order->store_id, $this->quantity);
        }
    }

    public function voidItem($reason)
    {
        $this->status = 'cancelled';
        $this->void_reason = $reason;
        $this->save();
        
        // Release reserved stock
        if ($this->product && $this->product->is_stock_managed) {
            $this->releaseStock($this->order->store_id, $this->quantity);
        }
    }

    /**
     * Get detailed item information for API responses
     */
    public function toDetailedArray()
    {
        return [
            'id' => $this->id,
            'product' => [
                'id' => $this->product->id,
                'name' => $this->product->name,
                'description' => $this->product->description,
                'sku' => $this->product->sku,
                'is_stock_managed' => $this->product->is_stock_managed,
            ],
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'unit_cost' => $this->unit_cost,
            'discount' => $this->discount,
            'status' => $this->status,
            'special_instructions' => $this->special_instructions,
            'preparation_notes' => $this->preparation_notes,
            'course_number' => $this->course_number,
            'is_complimentary' => $this->is_complimentary,
            'void_reason' => $this->void_reason,
            'kitchen_printed' => $this->kitchen_printed,
            'kitchen_printed_at' => $this->kitchen_printed_at,
            'served_by' => $this->served_by,
            'served_at' => $this->served_at,
            'subtotal' => $this->calculateSubtotal(),
            'modifier_total' => $this->calculateModifierPricing(),
            'modifiers' => $this->modifiers->map(function($modifier) {
                return [
                    'id' => $modifier->id,
                    'modifier' => [
                        'id' => $modifier->modifier->id,
                        'name' => $modifier->modifier->name,
                        'description' => $modifier->modifier->description,
                        'modifier_type' => $modifier->modifier->modifier_type,
                    ],
                    'quantity' => $modifier->quantity,
                    'price_adjustment' => $modifier->price_adjustment,
                    'total_adjustment' => $modifier->price_adjustment * $modifier->quantity,
                ];
            }),
        ];
    }

    /**
     * Generate KOT for this item
     */
    public function generateKOT()
    {
        if ($this->status !== 'pending') {
            throw new \Exception('Cannot generate KOT for item in ' . $this->status . ' status');
        }

        try {
            $kotService = new KOTGenerationService();
            $result = $kotService->generateKOTForOrder($this->order);
            
            // Find the KOT for this specific item
            $kot = \App\Models\Restaurant\KitchenOrderQueue::where('order_item_id', $this->id)->first();
            
            return [
                'success' => $kot !== null,
                'kot' => $kot,
                'message' => $kot ? 'KOT generated successfully' : 'KOT generation failed'
            ];
        } catch (\Exception $e) {
            Log::error('KOT generation failed for item', [
                'order_item_id' => $this->id,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => 'KOT generation failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Regenerate KOT for this item
     */
    public function regenerateKOT()
    {
        try {
            $kotService = new KOTGenerationService();
            $result = $kotService->regenerateKOTForItem($this);
            
            return $result;
        } catch (\Exception $e) {
            Log::error('KOT regeneration failed for item', [
                'order_item_id' => $this->id,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => 'KOT regeneration failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get KOT for this item
     */
    public function getKOT()
    {
        return $this->kitchenQueue()->with(['station', 'completedBy'])->first();
    }

    /**
     * Check if item has KOT
     */
    public function hasKOT()
    {
        return $this->kitchenQueue()->exists();
    }

    /**
     * Get KOT status for this item
     */
    public function getKOTStatus()
    {
        $kot = $this->getKOT();
        return $kot ? $kot->status : null;
    }

    /**
     * Get KOT preparation time
     */
    public function getKOTPreparationTime()
    {
        $kot = $this->getKOT();
        return $kot ? $kot->getPreparationTime() : null;
    }

    /**
     * Check if KOT is overdue
     */
    public function isKOTOverdue()
    {
        $kot = $this->getKOT();
        return $kot ? $kot->isOverdue() : false;
    }

    /**
     * Get KOT overdue time
     */
    public function getKOTOverdueTime()
    {
        $kot = $this->getKOT();
        return $kot ? $kot->getOverdueTime() : 0;
    }

    /**
     * Update KOT status
     */
    public function updateKOTStatus($newStatus, $updatedBy = null)
    {
        $kot = $this->getKOT();
        
        if (!$kot) {
            throw new \Exception('No KOT found for this item');
        }

        $kot->updateStatus($newStatus, $updatedBy);
        
        return $kot;
    }

    /**
     * Mark KOT as started
     */
    public function startKOTPreparation($startedBy = null)
    {
        return $this->updateKOTStatus('in_progress', $startedBy);
    }

    /**
     * Mark KOT as ready
     */
    public function markKOTAsReady()
    {
        return $this->updateKOTStatus('ready');
    }

    /**
     * Complete KOT
     */
    public function completeKOT($completedBy = null)
    {
        $result = $this->updateKOTStatus('completed', $completedBy);
        
        // Update item status to ready
        $this->status = 'ready';
        $this->save();
        
        return $result;
    }

    /**
     * Cancel KOT
     */
    public function cancelKOT($reason = 'Cancelled')
    {
        $kot = $this->getKOT();
        
        if (!$kot) {
            return false;
        }

        $kot->status = 'cancelled';
        $kot->notes = ($kot->notes ?? '') . ' | Cancelled: ' . $reason;
        $kot->save();
        
        // Update item status
        $this->status = 'cancelled';
        $this->void_reason = $reason;
        $this->save();
        
        // Release reserved stock
        if ($this->product && $this->product->is_stock_managed) {
            $this->releaseStock($this->order->store_id, $this->quantity);
        }
        
        return true;
    }

    /**
     * Get KOT summary for this item
     */
    public function getKOTSummary()
    {
        $kot = $this->getKOT();
        
        if (!$kot) {
            return null;
        }

        return [
            'kot_id' => $kot->id,
            'kot_number' => $kot->kot_number,
            'status' => $kot->status,
            'priority' => $kot->priority,
            'estimated_time' => $kot->estimated_time,
            'elapsed_time' => $kot->created_at->diffInMinutes(now()),
            'is_overdue' => $kot->isOverdue(),
            'overdue_time' => $kot->getOverdueTime(),
            'station' => [
                'id' => $kot->station->id,
                'name' => $kot->station->name,
                'printer_name' => $kot->station->printer_name
            ],
            'item_info' => [
                'product_name' => $this->product->name,
                'quantity' => $this->quantity,
                'special_instructions' => $this->special_instructions,
                'preparation_notes' => $this->preparation_notes,
                'course_number' => $this->course_number,
            ],
            'timing' => [
                'created_at' => $kot->created_at,
                'started_at' => $kot->started_at,
                'completed_at' => $kot->completed_at,
                'preparation_time' => $kot->getPreparationTime(),
                'printed_at' => $kot->printed_at,
            ],
            'stock_info' => [
                'verified' => $kot->stock_verified,
                'verified_at' => $kot->stock_verified_at,
                'verified_by' => $kot->stock_verified_by,
            ]
        ];
    }

    /**
     * Get preparation progress percentage
     */
    public function getPreparationProgress()
    {
        $kot = $this->getKOT();
        
        if (!$kot || !$kot->estimated_time) {
            return 0;
        }

        $elapsedTime = $kot->created_at->diffInMinutes(now());
        
        if ($kot->status === 'completed') {
            return 100;
        }
        
        $progress = min(($elapsedTime / $kot->estimated_time) * 100, 100);
        
        // Don't show progress beyond 90% if not started
        if ($kot->status === 'queued' && $progress > 90) {
            $progress = 90;
        }
        
        return round($progress);
    }

    /**
     * Get estimated completion time
     */
    public function getEstimatedCompletionTime()
    {
        $kot = $this->getKOT();
        
        if (!$kot || !$kot->estimated_time) {
            return null;
        }

        if ($kot->started_at) {
            return $kot->started_at->addMinutes($kot->estimated_time);
        }
        
        return $kot->created_at->addMinutes($kot->estimated_time);
    }

    /**
     * Check if item can be modified based on KOT status
     */
    public function canBeModifiedBasedOnKOT()
    {
        $kot = $this->getKOT();
        
        if (!$kot) {
            return $this->canBeModified();
        }
        
        return $kot->canBeModified();
    }

    /**
     * Check if item can be modified based on business rules
     */
    public function canBeModified()
    {
        // Check if order can be modified
        if (!$this->order->canBeModified()) {
            return false;
        }

        // Check if item has already been served
        if ($this->status === 'served') {
            return false;
        }

        // Check if item has been cancelled
        if ($this->status === 'cancelled') {
            return false;
        }

        // Check if item is already being prepared
        $kot = $this->getKOT();
        if ($kot && !in_array($kot->status, ['queued'])) {
            return false;
        }

        return true;
    }

    /**
     * Check if item quantity can be modified
     */
    public function canQuantityBeModified()
    {
        if (!$this->canBeModified()) {
            return false;
        }

        // Additional check for quantity modifications
        $kot = $this->getKOT();
        if ($kot && $kot->status === 'queued') {
            // Allow quantity modification if KOT is still queued
            return true;
        }

        return $kot === null; // Only allow if no KOT has been generated
    }

    /**
     * Check if item modifiers can be modified
     */
    public function canModifiersBeModified()
    {
        if (!$this->canBeModified()) {
            return false;
        }

        // Additional check for modifier modifications
        $kot = $this->getKOT();
        if ($kot && $kot->status === 'queued') {
            // Allow modifier modification if KOT is still queued
            return true;
        }

        return $kot === null; // Only allow if no KOT has been generated
    }

    /**
     * Check if item can be removed from order
     */
    public function canBeRemoved()
    {
        if (!$this->canBeModified()) {
            return false;
        }

        // Check if this is the only item in the order
        if ($this->order->items()->count() <= 1) {
            return false; // Should cancel order instead
        }

        return true;
    }

    /**
     * Get modification restrictions for this item
     */
    public function getModificationRestrictions()
    {
        $restrictions = [];

        // Order-level restrictions
        if (!$this->order->canBeModified()) {
            $restrictions = array_merge($restrictions, $this->order->getModificationRestrictions());
        }

        // Item-level restrictions
        if ($this->status === 'served') {
            $restrictions[] = 'Item has already been served';
        }

        if ($this->status === 'cancelled') {
            $restrictions[] = 'Item has been cancelled';
        }

        // KOT-based restrictions
        $kot = $this->getKOT();
        if ($kot) {
            switch ($kot->status) {
                case 'in_progress':
                    $restrictions[] = 'Item is currently being prepared';
                    break;
                case 'ready':
                    $restrictions[] = 'Item is ready for serving';
                    break;
                case 'completed':
                    $restrictions[] = 'Item preparation is complete';
                    break;
            }
        }

        return $restrictions;
    }

    /**
     * Validate item modification based on business rules
     */
    public function validateModification($modificationType, $newData = [])
    {
        $errors = [];

        // Check basic modification permission
        if (!$this->canBeModified()) {
            $errors['permission'] = 'Item cannot be modified: ' . implode(', ', $this->getModificationRestrictions());
        }

        // Specific validation based on modification type
        switch ($modificationType) {
            case 'quantity':
                if (!$this->canQuantityBeModified()) {
                    $errors['quantity'] = 'Item quantity cannot be modified at this time';
                }
                
                if (isset($newData['quantity'])) {
                    $newQuantity = $newData['quantity'];
                    if ($newQuantity <= 0) {
                        $errors['quantity'] = 'Quantity must be greater than 0';
                    }
                    
                    // Check stock availability if increasing quantity
                    if ($newQuantity > $this->quantity) {
                        $difference = $newQuantity - $this->quantity;
                        $stockCheck = $this->checkStockAvailability($difference);
                        if (!$stockCheck['available']) {
                            $errors['stock'] = $stockCheck['message'];
                        }
                    }
                }
                break;

            case 'modifiers':
                if (!$this->canModifiersBeModified()) {
                    $errors['modifiers'] = 'Item modifiers cannot be changed at this time';
                }
                
                if (isset($newData['modifiers'])) {
                    $modifierValidation = $this->validateModifiers($newData['modifiers']);
                    if (!$modifierValidation['valid']) {
                        $errors['modifiers'] = $modifierValidation['message'];
                    }
                }
                break;

            case 'remove':
                if (!$this->canBeRemoved()) {
                    $errors['removal'] = 'Item cannot be removed at this time';
                }
                break;
        }

        return $errors;
    }

    /**
     * Check stock availability for quantity increase
     */
    private function checkStockAvailability($additionalQuantity)
    {
        if (!$this->product->is_stock_managed) {
            return ['available' => true];
        }

        $storeId = $this->order->store_id;
        $availableStock = ProductStock::where('product_id', $this->product_id)
            ->where('store_id', $storeId)
            ->sum('quantity');

        if ($availableStock < $additionalQuantity) {
            return [
                'available' => false,
                'message' => "Insufficient stock for '{$this->product->name}'. Available: {$availableStock}, Additional Required: {$additionalQuantity}"
            ];
        }

        return ['available' => true];
    }

    /**
     * Validate modifiers for this item
     */
    private function validateModifiers($modifiers)
    {
        if (empty($modifiers)) {
            return ['valid' => true];
        }

        $modifierIds = collect($modifiers)->pluck('modifier_id');
        $availableModifiers = MenuModifier::whereIn('id', $modifierIds)->active()->get();
        
        if ($availableModifiers->count() !== $modifierIds->count()) {
            return ['valid' => false, 'message' => 'One or more modifiers are not available'];
        }

        // Check modifier stock if applicable
        $storeId = $this->order->store_id;
        foreach ($availableModifiers as $modifier) {
            if ($modifier->is_stock_managed) {
                $modifierData = collect($modifiers)->firstWhere('modifier_id', $modifier->id);
                $requiredQuantity = $modifierData['quantity'] * $this->quantity;
                
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
     * Update item quantity with comprehensive validation
     */
    public function updateQuantityWithValidation($newQuantity, $userId = null)
    {
        $validation = $this->validateModification('quantity', ['quantity' => $newQuantity]);
        if (!empty($validation)) {
            return [
                'success' => false,
                'errors' => $validation
            ];
        }

        try {
            $oldQuantity = $this->quantity;
            $result = $this->updateQuantity($newQuantity, $this->order->store_id);
            
            if ($result) {
                // Record modification
                $this->recordModification('quantity_updated', [
                    'old_quantity' => $oldQuantity,
                    'new_quantity' => $newQuantity,
                    'difference' => $newQuantity - $oldQuantity
                ], $userId);

                return [
                    'success' => true,
                    'message' => 'Quantity updated successfully',
                    'old_quantity' => $oldQuantity,
                    'new_quantity' => $newQuantity
                ];
            }

            return [
                'success' => false,
                'message' => 'Failed to update quantity'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to update quantity: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update item modifiers with comprehensive validation
     */
    public function updateModifiersWithValidation($newModifiers, $userId = null)
    {
        $validation = $this->validateModification('modifiers', ['modifiers' => $newModifiers]);
        if (!empty($validation)) {
            return [
                'success' => false,
                'errors' => $validation
            ];
        }

        try {
            $oldModifiers = $this->modifiers->keyBy('modifier_id');
            
            DB::transaction(function() use ($newModifiers, $oldModifiers, $userId) {
                // Remove modifiers that are no longer needed
                foreach ($oldModifiers as $modifierId => $oldModifier) {
                    if (!collect($newModifiers)->pluck('modifier_id')->contains($modifierId)) {
                        $oldModifier->delete();
                    }
                }

                // Add or update modifiers
                foreach ($newModifiers as $modifierData) {
                    $modifierId = $modifierData['modifier_id'];
                    
                    if (isset($oldModifiers[$modifierId])) {
                        // Update existing modifier
                        $oldModifier = $oldModifiers[$modifierId];
                        $oldModifier->quantity = $modifierData['quantity'];
                        $oldModifier->price_adjustment = $modifierData['price_adjustment'];
                        $oldModifier->save();
                    } else {
                        // Add new modifier
                        RestaurantOrderItemModifier::create([
                            'order_item_id' => $this->id,
                            'modifier_id' => $modifierId,
                            'quantity' => $modifierData['quantity'],
                            'price_adjustment' => $modifierData['price_adjustment'],
                        ]);
                    }
                }

                // Record modification
                $this->recordModification('modifiers_updated', [
                    'old_modifiers' => $oldModifiers->pluck('modifier.name')->toArray(),
                    'new_modifiers' => collect($newModifiers)->pluck('modifier_id')->map(function($id) {
                        return MenuModifier::find($id)->name;
                    })->toArray()
                ], $userId);
            });

            return [
                'success' => true,
                'message' => 'Modifiers updated successfully'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to update modifiers: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Remove item with comprehensive validation
     */
    public function removeWithValidation($reason = '', $userId = null)
    {
        $validation = $this->validateModification('remove');
        if (!empty($validation)) {
            return [
                'success' => false,
                'errors' => $validation
            ];
        }

        try {
            $productName = $this->product->name;
            $quantity = $this->quantity;
            
            // Cancel KOT if exists
            $this->cancelKOT('Item removed from order: ' . $reason);

            // Release stock
            if ($this->product && $this->product->is_stock_managed) {
                $this->releaseStock($this->order->store_id, $this->quantity);
            }

            // Release modifier stock
            foreach ($this->modifiers as $modifier) {
                if ($modifier->modifier && $modifier->modifier->is_stock_managed) {
                    $modifierQuantity = $modifier->quantity * $this->quantity;
                    // This would need a method to release modifier stock
                }
            }

            // Record modification
            $this->recordModification('item_removed', [
                'product_name' => $productName,
                'quantity' => $quantity,
                'reason' => $reason
            ], $userId);

            // Delete modifiers first
            $this->modifiers()->delete();
            
            // Delete the item
            $this->delete();

            return [
                'success' => true,
                'message' => 'Item removed successfully'
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to remove item: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Record modification in item history
     */
    public function recordModification($action, $data = [], $userId = null)
    {
        // This would typically save to a modifications history table
        // For now, we'll log it and update the item's updated_at timestamp
        $this->touch();
        
        Log::info('Order item modification recorded', [
            'order_item_id' => $this->id,
            'order_id' => $this->order_id,
            'product_name' => $this->product->name,
            'action' => $action,
            'data' => $data,
            'user_id' => $userId ?? auth()->id(),
            'timestamp' => now()
        ]);
    }

    /**
     * Get modification history for this item
     */
    public function getModificationHistory()
    {
        // This would typically query a modifications history table
        // For now, we'll return an empty array
        return [];
    }

    /**
     * Get real-time modification status for frontend
     */
    public function getModificationStatus()
    {
        return [
            'can_modify' => $this->canBeModified(),
            'can_modify_quantity' => $this->canQuantityBeModified(),
            'can_modify_modifiers' => $this->canModifiersBeModified(),
            'can_be_removed' => $this->canBeRemoved(),
            'restrictions' => $this->getModificationRestrictions(),
            'kot_status' => $this->getKOTStatus(),
            'stock_managed' => $this->product ? $this->product->is_stock_managed : false,
        ];
    }

    /**
     * Get station for this item's KOT
     */
    public function getKOTStation()
    {
        $kot = $this->getKOT();
        return $kot ? $kot->station : null;
    }

    /**
     * Get priority for KOT based on item characteristics
     */
    public function getKOTPriority()
    {
        $basePriority = $this->order->priority ?? 'normal';
        
        // Adjust based on item complexity
        if ($this->modifiers->count() > 3) {
            $basePriority = 'high';
        }
        
        // Adjust based on preparation notes
        if ($this->preparation_notes && str_contains(strtolower($this->preparation_notes), 'urgent')) {
            $basePriority = 'urgent';
        }
        
        // Adjust based on course (earlier courses get higher priority)
        if ($this->course_number === 1) {
            $basePriority = 'high';
        }
        
        return $basePriority;
    }
}