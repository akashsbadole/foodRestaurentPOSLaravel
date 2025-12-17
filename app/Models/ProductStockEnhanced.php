<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Userstamps;

class ProductStockEnhanced extends Model
{
    use HasFactory;
    use SoftDeletes;
    use Userstamps;

    protected $table = 'product_stocks';

    protected $fillable = [
        'store_id',
        'batch_id',
        'product_id',
        'quantity',
        'reserved_quantity',
        'available_quantity',
        'minimum_level',
        'maximum_level',
        'reorder_point',
        'safety_stock',
        'last_count_date',
        'last_count_quantity',
        'variance_amount',
        'variance_percentage',
        'location',
        'bin_location',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'reserved_quantity' => 'decimal:2',
        'available_quantity' => 'decimal:2',
        'minimum_level' => 'decimal:2',
        'maximum_level' => 'decimal:2',
        'reorder_point' => 'decimal:2',
        'safety_stock' => 'decimal:2',
        'last_count_date' => 'datetime',
        'last_count_quantity' => 'decimal:2',
        'variance_amount' => 'decimal:2',
        'variance_percentage' => 'decimal:2',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function batch()
    {
        return $this->belongsTo(ProductBatch::class, 'batch_id');
    }

    public function store()
    {
        return $this->belongsTo(Store::class, 'store_id');
    }

    public function transactions()
    {
        return $this->hasMany(InventoryTransactionItem::class, 'product_id', 'product_id')
                    ->whereHas('transaction', function($query) {
                        $query->where('store_id', $this->store_id);
                    });
    }

    // Scopes
    public function scopeLowStock($query)
    {
        return $query->where('available_quantity', '<=', DB::raw('reorder_point'));
    }

    public function scopeOutOfStock($query)
    {
        return $query->where('available_quantity', '<=', 0);
    }

    public function scopeOverstock($query)
    {
        return $query->where('available_quantity', '>', DB::raw('maximum_level'));
    }

    public function scopeNeedsReorder($query)
    {
        return $query->where('available_quantity', '<=', DB::raw('reorder_point'));
    }

    public function scopeHasVariance($query, $threshold = 5.0)
    {
        return $query->where('variance_percentage', '>', $threshold)
                    ->orWhere('variance_percentage', '<', -$threshold);
    }

    // Methods
    public function getStockStatus()
    {
        if ($this->available_quantity <= 0) {
            return 'out_of_stock';
        } elseif ($this->available_quantity <= $this->reorder_point) {
            return 'reorder_needed';
        } elseif ($this->available_quantity <= $this->minimum_level) {
            return 'low_stock';
        } elseif ($this->available_quantity >= $this->maximum_level) {
            return 'overstock';
        } else {
            return 'adequate';
        }
    }

    public function getStockLevelPercentage()
    {
        if ($this->maximum_level <= 0) {
            return 100;
        }

        return min(100, ($this->available_quantity / $this->maximum_level) * 100);
    }

    public function isLowStock()
    {
        return $this->available_quantity <= $this->reorder_point;
    }

    public function isOutOfStock()
    {
        return $this->available_quantity <= 0;
    }

    public function isOverstock()
    {
        return $this->available_quantity > $this->maximum_level;
    }

    public function needsReorder()
    {
        return $this->available_quantity <= $this->reorder_point;
    }

    public function getDaysOfStock()
    {
        $dailyUsage = $this->getDailyUsage();
        if ($dailyUsage <= 0) {
            return 999;
        }

        return floor($this->available_quantity / $dailyUsage);
    }

    public function getDailyUsage($days = 30)
    {
        return $this->transactions()
            ->whereHas('transaction', function($query) use ($days) {
                $query->where('transaction_type', 'sale')
                      ->where('created_at', '>=', now()->subDays($days));
            })
            ->sum('quantity') / $days;
    }

    public function getWeeklyUsage($weeks = 4)
    {
        return $this->getDailyUsage($weeks * 7) * 7;
    }

    public function getMonthlyUsage($months = 3)
    {
        return $this->getDailyUsage($months * 30) * 30;
    }

    public function getStockTurnover($period = 30)
    {
        $usage = $this->getDailyUsage($period) * $period;
        $averageStock = ($this->quantity + $this->available_quantity) / 2;
        
        return $averageStock > 0 ? $usage / $averageStock : 0;
    }

    public function getStockValue()
    {
        $cost = $this->product->cost_price ?? 0;
        return $this->available_quantity * $cost;
    }

    public function getTotalStockValue()
    {
        $cost = $this->product->cost_price ?? 0;
        return $this->quantity * $cost;
    }

    public function getReservedStockValue()
    {
        $cost = $this->product->cost_price ?? 0;
        return $this->reserved_quantity * $cost;
    }

    public function reserveStock($quantity)
    {
        if ($this->available_quantity < $quantity) {
            return false;
        }

        $this->reserved_quantity += $quantity;
        $this->available_quantity = $this->quantity - $this->reserved_quantity;
        $this->save();

        return true;
    }

    public function releaseReservedStock($quantity)
    {
        if ($this->reserved_quantity < $quantity) {
            return false;
        }

        $this->reserved_quantity -= $quantity;
        $this->available_quantity = $this->quantity - $this->reserved_quantity;
        $this->save();

        return true;
    }

    public function deductStock($quantity)
    {
        if ($this->quantity < $quantity) {
            return false;
        }

        $this->quantity -= $quantity;
        $this->reserved_quantity = min($this->reserved_quantity, $this->quantity);
        $this->available_quantity = $this->quantity - $this->reserved_quantity;
        $this->save();

        return true;
    }

    public function addStock($quantity)
    {
        $this->quantity += $quantity;
        $this->available_quantity = $this->quantity - $this->reserved_quantity;
        $this->save();

        return true;
    }

    public function adjustStock($newQuantity, $reason = 'Stock adjustment')
    {
        $oldQuantity = $this->quantity;
        $adjustment = $newQuantity - $oldQuantity;

        $this->quantity = $newQuantity;
        $this->available_quantity = $newQuantity - $this->reserved_quantity;
        $this->save();

        // Create adjustment transaction
        $transaction = InventoryTransaction::create([
            'store_id' => $this->store_id,
            'transaction_type' => 'adjustment',
            'notes' => $reason,
            'created_by' => auth()->id(),
        ]);

        InventoryTransactionItem::create([
            'inventory_transaction_id' => $transaction->id,
            'product_id' => $this->product_id,
            'quantity' => $adjustment,
            'unit_cost' => $this->product->cost_price ?? 0,
            'total_cost' => ($this->product->cost_price ?? 0) * abs($adjustment),
        ]);

        return $adjustment;
    }

    public function performStockCount($countedQuantity, $countedBy = null)
    {
        $oldQuantity = $this->quantity;
        $variance = $countedQuantity - $oldQuantity;
        $variancePercentage = $oldQuantity != 0 ? ($variance / $oldQuantity) * 100 : 0;

        $this->quantity = $countedQuantity;
        $this->available_quantity = $countedQuantity - $this->reserved_quantity;
        $this->last_count_date = now();
        $this->last_count_quantity = $countedQuantity;
        $this->variance_amount = $variance;
        $this->variance_percentage = $variancePercentage;
        $this->save();

        // Create stock count transaction
        $transaction = InventoryTransaction::create([
            'store_id' => $this->store_id,
            'transaction_type' => 'stock_count',
            'notes' => "Stock count: {$countedQuantity} (Variance: {$variance})",
            'created_by' => $countedBy ?? auth()->id(),
        ]);

        InventoryTransactionItem::create([
            'inventory_transaction_id' => $transaction->id,
            'product_id' => $this->product_id,
            'quantity' => $variance,
            'unit_cost' => $this->product->cost_price ?? 0,
            'total_cost' => ($this->product->cost_price ?? 0) * abs($variance),
        ]);

        return [
            'variance' => $variance,
            'variance_percentage' => $variancePercentage,
            'transaction_id' => $transaction->id,
        ];
    }

    public function calculateReorderPoint($leadTimeDays = 7, $serviceLevel = 0.95)
    {
        $dailyUsage = $this->getDailyUsage();
        $standardDeviation = $this->getUsageStandardDeviation();
        
        // Safety stock based on service level
        $zScore = $this->getZScoreForServiceLevel($serviceLevel);
        $safetyStock = $standardDeviation * $zScore;
        
        $reorderPoint = ($dailyUsage * $leadTimeDays) + $safetyStock;
        
        $this->reorder_point = $reorderPoint;
        $this->safety_stock = $safetyStock;
        $this->save();
        
        return $reorderPoint;
    }

    public function getUsageStandardDeviation($days = 30)
    {
        $usage = $this->transactions()
            ->whereHas('transaction', function($query) use ($days) {
                $query->where('transaction_type', 'sale')
                      ->where('created_at', '>=', now()->subDays($days));
            })
            ->selectRaw('DATE(created_at) as date, SUM(quantity) as daily_usage')
            ->groupBy('date')
            ->pluck('daily_usage');

        if ($usage->count() < 2) {
            return 0;
        }

        $mean = $usage->avg();
        $variance = $usage->sum(function($value) use ($mean) {
            return pow($value - $mean, 2);
        }) / ($usage->count() - 1);

        return sqrt($variance);
    }

    private function getZScoreForServiceLevel($serviceLevel)
    {
        // Simplified Z-score lookup for common service levels
        $zScores = [
            0.90 => 1.28,
            0.95 => 1.65,
            0.98 => 2.05,
            0.99 => 2.33,
        ];

        return $zScores[$serviceLevel] ?? 1.65; // Default to 95%
    }

    public function getOptimalStockLevel($leadTimeDays = 7, $reviewPeriodDays = 30)
    {
        $dailyUsage = $this->getDailyUsage($reviewPeriodDays);
        $reorderPoint = $this->calculateReorderPoint($leadTimeDays);
        
        // Optimal stock level = Reorder point + (Daily usage * Review period)
        return $reorderPoint + ($dailyUsage * $reviewPeriodDays);
    }

    public function getStockRecommendation()
    {
        $status = $this->getStockStatus();
        $recommendation = [];

        switch ($status) {
            case 'out_of_stock':
                $recommendation = [
                    'action' => 'urgent_order',
                    'priority' => 'critical',
                    'message' => 'Item is out of stock. Immediate order required.',
                    'suggested_quantity' => $this->getOptimalStockLevel(),
                ];
                break;

            case 'reorder_needed':
                $recommendation = [
                    'action' => 'order',
                    'priority' => 'high',
                    'message' => 'Stock has reached reorder point. Order recommended.',
                    'suggested_quantity' => $this->getOptimalStockLevel() - $this->available_quantity,
                ];
                break;

            case 'low_stock':
                $recommendation = [
                    'action' => 'monitor',
                    'priority' => 'medium',
                    'message' => 'Stock is running low. Monitor closely.',
                    'suggested_quantity' => 0,
                ];
                break;

            case 'overstock':
                $recommendation = [
                    'action' => 'reduce',
                    'priority' => 'low',
                    'message' => 'Stock level is too high. Consider promotion or transfer.',
                    'suggested_quantity' => $this->available_quantity - $this->maximum_level,
                ];
                break;

            default:
                $recommendation = [
                    'action' => 'maintain',
                    'priority' => 'normal',
                    'message' => 'Stock level is adequate.',
                    'suggested_quantity' => 0,
                ];
        }

        return array_merge($recommendation, [
            'current_stock' => $this->available_quantity,
            'reorder_point' => $this->reorder_point,
            'maximum_level' => $this->maximum_level,
            'days_of_stock' => $this->getDaysOfStock(),
            'stock_turnover' => $this->getStockTurnover(),
        ]);
    }

    public function getMovementHistory($days = 30)
    {
        return $this->transactions()
            ->whereHas('transaction', function($query) use ($days) {
                $query->where('created_at', '>=', now()->subDays($days));
            })
            ->with('transaction')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->transaction->created_at,
                    'type' => $item->transaction->transaction_type,
                    'quantity' => $item->quantity,
                    'reference' => $item->transaction->reference_type,
                    'notes' => $item->transaction->notes,
                    'running_balance' => $this->getBalanceAtDate($item->transaction->created_at),
                ];
            });
    }

    private function getBalanceAtDate($date)
    {
        return $this->transactions()
            ->whereHas('transaction', function($query) use ($date) {
                $query->where('created_at', '<=', $date);
            })
            ->sum('quantity');
    }
}