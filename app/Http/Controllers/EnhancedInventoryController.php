<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\InventoryItemStore;
use App\Models\InventoryTransaction;
use App\Models\InventoryTransactionItem;
use App\Models\Product;
use App\Models\ProductStock;
use App\Models\Store;
use App\Models\Contact;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class EnhancedInventoryController extends Controller
{
    public function dashboard()
    {
        $stores = Store::select('id', 'name')->get();
        
        // Get inventory statistics
        $inventoryItems = InventoryItem::with(['stores' => function($query) {
            $query->select('inventory_item_id', 'quantity');
        }])->get();
        
        $totalValue = 0;
        $totalItems = $inventoryItems->count();
        $lowStockItems = [];
        $expiringItems = [];
        
        foreach ($inventoryItems as $item) {
            $currentStock = $item->stores->sum('quantity');
            $itemValue = $currentStock * ($item->cost ?? 0);
            $totalValue += $itemValue;
            
            if ($currentStock <= $item->alert_quantity) {
                $lowStockItems[] = [
                    'id' => $item->id,
                    'name' => $item->name,
                    'quantity' => $currentStock,
                    'alert_quantity' => $item->alert_quantity,
                    'unit_type' => $item->unit_type,
                    'cost' => $item->cost,
                ];
            }
        }
        
        // Get recent transactions
        $recentTransactions = InventoryTransactionItem::join('inventory_items', 'inventory_transaction_items.inventory_item_id', '=', 'inventory_items.id')
            ->join('inventory_transactions', 'inventory_transaction_items.inventory_transaction_id', '=', 'inventory_transactions.id')
            ->select('inventory_transaction_items.*', 'inventory_items.name', 'inventory_items.unit_type', 'inventory_transactions.reason')
            ->latest()
            ->take(10)
            ->get();
        
        return Inertia::render('Inventory/InventoryDashboard', [
            'inventoryItems' => $inventoryItems,
            'lowStockItems' => $lowStockItems,
            'expiringItems' => $expiringItems,
            'totalValue' => $totalValue,
            'totalItems' => $totalItems,
            'lowStockCount' => count($lowStockItems),
            'expiringCount' => count($expiringItems),
            'recentTransactions' => $recentTransactions,
            'stores' => $stores,
            'pageLabel' => 'Inventory Dashboard',
        ]);
    }

    public function adjustment()
    {
        $stores = Store::all();
        $inventoryItems = InventoryItem::all();
        
        // Get pending adjustments
        $pendingAdjustments = $this->getAdjustmentsByStatus('pending');
        $approvedAdjustments = $this->getAdjustmentsByStatus('approved');
        $rejectedAdjustments = $this->getAdjustmentsByStatus('rejected');
        
        return Inertia::render('Inventory/InventoryAdjustment', [
            'inventoryItems' => $inventoryItems,
            'pendingAdjustments' => $pendingAdjustments,
            'approvedAdjustments' => $approvedAdjustments,
            'rejectedAdjustments' => $rejectedAdjustments,
            'stores' => $stores,
            'pageLabel' => 'Inventory Adjustment',
        ]);
    }

    public function storeAdjustment(Request $request)
    {
        DB::beginTransaction();
        try {
            $adjustmentData = $request->all();
            
            // Create adjustment record
            $adjustment = InventoryTransaction::create([
                'store_id' => $adjustmentData['store_id'] ?? auth()->user()->store_id,
                'transaction_type' => 'adjustment',
                'reason' => $adjustmentData['reason'],
                'total' => 0,
                'transaction_date' => now(),
                'status' => 'pending',
                'priority' => $adjustmentData['priority'] ?? 'normal',
                'requested_by' => auth()->user()->id,
                'notes' => $adjustmentData['notes'] ?? '',
            ]);

            // Process each item adjustment
            foreach ($adjustmentData['items'] as $item) {
                $inventoryItem = InventoryItem::find($item['inventory_item_id']);
                
                if ($inventoryItem) {
                    // Update stock quantity
                    InventoryItemStore::where([
                        'inventory_item_id' => $item['inventory_item_id'],
                        'store_id' => $adjustmentData['store_id'] ?? auth()->user()->store_id,
                    ])->update([
                        'quantity' => DB::raw('COALESCE(quantity, 0) + ' . $item['adjustment_quantity']),
                    ]);

                    // Create transaction item record
                    InventoryTransactionItem::create([
                        'inventory_transaction_id' => $adjustment->id,
                        'inventory_item_id' => $item['inventory_item_id'],
                        'quantity' => $item['adjustment_quantity'],
                        'cost' => $inventoryItem->cost ?? 0,
                        'transaction_date' => now(),
                        'current_quantity' => $item['current_quantity'],
                        'new_quantity' => $item['new_quantity'],
                        'adjustment_type' => $item['adjustment_type'],
                        'reason' => $item['reason'] ?? $adjustmentData['reason'],
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Adjustment request submitted successfully',
                'adjustment_id' => $adjustment->id,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Error submitting adjustment request',
            ], 500);
        }
    }

    public function suppliers()
    {
        $suppliers = Contact::where('type', 'vendor')
            ->withCount('purchaseOrders')
            ->with(['purchaseOrders' => function($query) {
                $query->latest()->take(5);
            }])
            ->get();
        
        $purchaseOrders = $this->getPurchaseOrders();
        $products = Product::all();
        $stores = Store::all();
        
        return Inertia::render('Inventory/SupplierManagement', [
            'suppliers' => $suppliers,
            'purchaseOrders' => $purchaseOrders,
            'products' => $products,
            'stores' => $stores,
            'pageLabel' => 'Supplier Management',
        ]);
    }

    public function storeSupplier(Request $request)
    {
        DB::beginTransaction();
        try {
            $supplierData = $request->all();
            
            $supplier = Contact::create([
                'type' => 'vendor',
                'name' => $supplierData['name'],
                'contact_person' => $supplierData['contact_person'],
                'email' => $supplierData['email'],
                'phone' => $supplierData['phone'],
                'address' => $supplierData['address'],
                'city' => $supplierData['city'],
                'state' => $supplierData['state'],
                'country' => $supplierData['country'],
                'postal_code' => $supplierData['postal_code'],
                'tax_id' => $supplierData['tax_id'],
                'payment_terms' => $supplierData['payment_terms'],
                'rating' => $supplierData['rating'] ?? 5,
                'notes' => $supplierData['notes'] ?? '',
                'is_active' => $supplierData['is_active'] ?? true,
                'created_by' => auth()->user()->id,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Supplier added successfully',
                'supplier' => $supplier,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Error adding supplier',
            ], 500);
        }
    }

    public function reports()
    {
        // Get valuation data
        $valuationData = $this->getValuationData();
        
        // Get movement data
        $movementData = $this->getMovementData();
        
        // Get forecast data
        $forecastData = $this->getForecastData();
        
        // Get performance metrics
        $suppliers = Contact::where('type', 'vendor')
            ->withCount('purchaseOrders')
            ->get();
        
        $stores = Store::all();
        
        return Inertia::render('Inventory/InventoryReports', [
            'inventoryValue' => $valuationData['total_value'],
            'totalItems' => $valuationData['total_items'],
            'lowStockItems' => $this->getLowStockItems(),
            'expiringItems' => $this->getExpiringItems(),
            'fastMovingItems' => $this->getFastMovingItems(),
            'slowMovingItems' => $this->getSlowMovingItems(),
            'valuationData' => $valuationData['categories'],
            'movementData' => $movementData,
            'forecastData' => $forecastData,
            'suppliers' => $suppliers,
            'stores' => $stores,
            'pageLabel' => 'Inventory Reports',
        ]);
    }

    public function getLowStockItems()
    {
        $lowStockItems = InventoryItem::with(['stores' => function($query) {
            $query->select('inventory_item_id', 'quantity');
        }])->get()->filter(function ($item) {
            $currentStock = $item->stores->sum('quantity');
            return $currentStock <= $item->alert_quantity;
        })->map(function ($item) {
            $currentStock = $item->stores->sum('quantity');
            return [
                'id' => $item->id,
                'name' => $item->name,
                'quantity' => $currentStock,
                'alert_quantity' => $item->alert_quantity,
                'unit_type' => $item->unit_type,
                'cost' => $item->cost,
            ];
        });

        return response()->json($lowStockItems);
    }

    public function getExpiringItems()
    {
        // This would need to be implemented based on your batch/expiration tracking
        $expiringItems = [];
        
        return response()->json($expiringItems);
    }

    public function getFastMovingItems()
    {
        // Calculate fast moving items based on sales velocity
        $fastMovingItems = InventoryItem::with(['sales' => function($query) {
            $query->where('created_at', '>=', now()->subDays(30))
                ->selectRaw('inventory_item_id, COUNT(*) as sales_count, SUM(quantity) as total_sold')
                ->groupBy('inventory_item_id');
        }])->get()->sortByDesc(function ($item) {
            return $item->sales->first()->sales_count ?? 0;
        })->take(10)->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'turnover_rate' => $item->sales->first()->sales_count ?? 0,
                'movement_percentage' => 85.5, // Calculate based on historical data
            ];
        });

        return response()->json($fastMovingItems);
    }

    public function getSlowMovingItems()
    {
        // Calculate slow moving items
        $slowMovingItems = InventoryItem::with(['sales' => function($query) {
            $query->where('created_at', '>=', now()->subDays(30))
                ->selectRaw('inventory_item_id, COUNT(*) as sales_count, SUM(quantity) as total_sold')
                ->groupBy('inventory_item_id');
        }])->get()->sortBy(function ($item) {
            return $item->sales->first()->sales_count ?? 0;
        })->take(10)->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'days_in_stock' => 45, // Calculate based on last sale date
                'movement_percentage' => 15.2, // Calculate based on historical data
            ];
        });

        return response()->json($slowMovingItems);
    }

    public function getForecastData()
    {
        // Generate forecast data based on historical sales
        $forecastData = [];
        $inventoryItems = InventoryItem::with(['stores'])->get();
        
        foreach ($inventoryItems as $item) {
            $currentStock = $item->stores->sum('quantity');
            $avgDailyUsage = $this->calculateAverageDailyUsage($item->id);
            
            for ($i = 0; $i < 90; $i++) {
                $date = now()->addDays($i)->format('Y-m-d');
                $projectedStock = max(0, $currentStock - ($avgDailyUsage * $i));
                
                $forecastData[] = [
                    'id' => $item->id,
                    'name' => $item->name,
                    'date' => $date,
                    'projected' => $projectedStock,
                    'optimal' => $item->alert_quantity * 2,
                    'critical' => $item->alert_quantity,
                    'current' => $currentStock,
                    'recommended_action' => $projectedStock <= $item->alert_quantity ? 'Reorder' : 'Monitor',
                    'priority' => $projectedStock <= 0 ? 'urgent' : ($projectedStock <= $item->alert_quantity ? 'high' : 'normal'),
                ];
            }
        }
        
        return response()->json($forecastData);
    }

    public function getValuationData()
    {
        $categories = InventoryItem::selectRaw('
                CASE 
                    WHEN name LIKE "%Food%" THEN "Food & Beverages"
                    WHEN name LIKE "%Drink%" THEN "Food & Beverages"
                    WHEN name LIKE "%Cleaning%" THEN "Cleaning Supplies"
                    WHEN name LIKE "%Paper%" THEN "Paper Products"
                    ELSE "Other"
                END as category,
                COUNT(*) as count,
                SUM(cost * COALESCE((SELECT SUM(quantity) FROM inventory_item_stores WHERE inventory_item_stores.inventory_item_id = inventory_items.id), 0)) as value
            ')
            ->groupBy('category')
            ->get()
            ->map(function ($category) {
                return [
                    'name' => $category->category,
                    'value' => $category->value ?? 0,
                    'count' => $category->count ?? 0,
                ];
            });

        $totalValue = $categories->sum('value');
        $totalItems = $categories->sum('count');

        return response()->json([
            'categories' => $categories,
            'total_value' => $totalValue,
            'total_items' => $totalItems,
        ]);
    }

    public function getMovementData()
    {
        $movementData = InventoryTransactionItem::join('inventory_transactions', 'inventory_transaction_items.inventory_transaction_id', '=', 'inventory_transactions.id')
            ->selectRaw('
                DATE(inventory_transactions.transaction_date) as date,
                SUM(CASE WHEN inventory_transactions.transaction_type = "purchase" THEN inventory_transaction_items.quantity ELSE 0 END) as stock_in,
                SUM(CASE WHEN inventory_transactions.transaction_type = "sale" THEN inventory_transaction_items.quantity ELSE 0 END) as stock_out
            ')
            ->where('inventory_transactions.transaction_date', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($data) {
                return [
                    'date' => $data->date,
                    'in' => $data->stock_in ?? 0,
                    'out' => $data->stock_out ?? 0,
                ];
            });

        return response()->json($movementData);
    }

    public function dedectStock(Request $request)
    {
        DB::beginTransaction();
        try {
            $orderData = $request->all();
            
            foreach ($orderData['items'] as $item) {
                // Find the inventory item
                $inventoryItem = InventoryItem::where('name', 'like', '%' . $item['name'] . '%')->first();
                
                if ($inventoryItem) {
                    // Deduct stock
                    InventoryItemStore::where([
                        'inventory_item_id' => $inventoryItem->id,
                        'store_id' => $orderData['store_id'] ?? auth()->user()->store_id,
                    ])->decrement('quantity', $item['quantity']);
                    
                    // Create transaction record
                    InventoryTransaction::create([
                        'store_id' => $orderData['store_id'] ?? auth()->user()->store_id,
                        'transaction_type' => 'sale',
                        'reason' => 'POS Order #' . ($orderData['order_id'] ?? 'Unknown'),
                        'total' => 0,
                        'transaction_date' => now(),
                    ]);
                    
                    InventoryTransactionItem::create([
                        'inventory_transaction_id' => $transaction->id,
                        'inventory_item_id' => $inventoryItem->id,
                        'quantity' => -$item['quantity'],
                        'cost' => $inventoryItem->cost ?? 0,
                        'transaction_date' => now(),
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Stock deducted successfully',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Error deducting stock',
            ], 500);
        }
    }

    public function generateBarcode($id)
    {
        $item = InventoryItem::find($id);
        
        if (!$item) {
            return response()->json(['error' => 'Item not found'], 404);
        }

        // Generate barcode logic here
        $barcodeData = [
            'item' => $item,
            'barcode' => $this->generateBarcodeNumber($item),
            'generated_at' => now(),
        ];

        return response()->json($barcodeData);
    }

    public function getItemHistory($id)
    {
        $history = InventoryTransactionItem::join('inventory_transactions', 'inventory_transaction_items.inventory_transaction_id', '=', 'inventory_transactions.id')
            ->join('inventory_items', 'inventory_transaction_items.inventory_item_id', '=', 'inventory_items.id')
            ->where('inventory_transaction_items.inventory_item_id', $id)
            ->select('inventory_transaction_items.*', 'inventory_items.name', 'inventory_items.unit_type', 'inventory_transactions.reason', 'inventory_transactions.transaction_type')
            ->latest()
            ->get();

        return response()->json($history);
    }

    // Helper methods
    private function getAdjustmentsByStatus($status)
    {
        return InventoryTransaction::where('transaction_type', 'adjustment')
            ->where('status', $status)
            ->with(['items' => function($query) {
                $query->with('inventoryItem');
            }])
            ->latest()
            ->get();
    }

    private function getPurchaseOrders()
    {
        return []; // Implement based on your purchase order model
    }

    private function calculateAverageDailyUsage($itemId)
    {
        // Calculate average daily usage based on historical data
        $usage = InventoryTransactionItem::join('inventory_transactions', 'inventory_transaction_items.inventory_transaction_id', '=', 'inventory_transactions.id')
            ->where('inventory_transaction_items.inventory_item_id', $itemId)
            ->where('inventory_transactions.transaction_type', 'sale')
            ->where('inventory_transactions.transaction_date', '>=', now()->subDays(30))
            ->sum('inventory_transaction_items.quantity');

        return abs($usage) / 30; // Average daily usage
    }

    private function generateBarcodeNumber($item)
    {
        // Generate unique barcode number
        return 'INV-' . str_pad($item->id, 8, '0', STR_PAD_LEFT);
    }
}