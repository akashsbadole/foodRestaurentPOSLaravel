<?php

namespace App\Http\Controllers;

use App\Models\Restaurant\KitchenOrderQueue;
use App\Models\Restaurant\KitchenStation;
use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantOrderItem;
use App\Models\Store;
use App\Models\User;
use App\Services\Restaurant\KOTGenerationService;
use App\Services\Restaurant\KOTPrintService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;

class KitchenController extends Controller
{
    /**
     * Display kitchen dashboard
     */
    public function dashboard()
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $currentStore = Store::find($storeId);

        if (!$currentStore) {
            return redirect()->route('store');
        }

        // Get kitchen stations
        $stations = KitchenStation::with(['queueItems' => function($query) {
                $query->with(['orderItem' => function($q) {
                    $q->with(['order' => function($order) {
                        $order->select('id', 'order_number', 'table_id', 'order_type', 'customer_count');
                    }, 'product']);
                }])
                ->whereIn('status', ['queued', 'in_progress'])
                ->orderBy('priority', 'desc')
                ->orderBy('created_at', 'asc');
            }])
            ->forStore($storeId)
            ->active()
            ->orderBy('display_order')
            ->get();

        // Get ready items
        $readyItems = KitchenOrderQueue::with(['orderItem' => function($query) {
                $query->with(['order' => function($order) {
                    $order->select('id', 'order_number', 'table_id', 'order_type');
                }, 'product']);
            }])
            ->whereHas('orderItem.order', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->where('status', 'ready')
            ->orderBy('completed_at', 'desc')
            ->limit(50)
            ->get();

        // Get today's statistics
        $today = now()->toDateString();
        $stats = $this->getKitchenStats($storeId, $today);

        return Inertia::render('Kitchen/Dashboard', [
            'currentStore' => $currentStore,
            'stations' => $stations,
            'readyItems' => $readyItems,
            'stats' => $stats,
        ]);
    }

    /**
     * Display station-specific view
     */
    public function station($stationId)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $currentStore = Store::find($storeId);

        if (!$currentStore) {
            return redirect()->route('store');
        }

        $station = KitchenStation::with([
                'queueItems' => function($query) {
                    $query->with(['orderItem' => function($q) {
                        $q->with(['order' => function($order) {
                            $order->select('id', 'order_number', 'table_id', 'order_type', 'customer_count', 'special_instructions');
                        }, 'product']);
                    }])
                    ->whereIn('status', ['queued', 'in_progress'])
                    ->orderBy('priority', 'desc')
                    ->orderBy('created_at', 'asc');
                },
                'products'
            ])
            ->forStore($storeId)
            ->findOrFail($stationId);

        // Get ready items for this station
        $readyItems = KitchenOrderQueue::with(['orderItem' => function($query) {
                $query->with(['order' => function($order) {
                    $order->select('id', 'order_number', 'table_id', 'order_type');
                }, 'product']);
            }])
            ->where('station_id', $stationId)
            ->where('status', 'ready')
            ->orderBy('completed_at', 'desc')
            ->limit(20)
            ->get();

        return Inertia::render('Kitchen/Station', [
            'currentStore' => $currentStore,
            'station' => $station,
            'readyItems' => $readyItems,
        ]);
    }

    /**
     * Start preparing an order item
     */
    public function startPreparation(Request $request, $queueId)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $queueItem = KitchenOrderQueue::with(['orderItem.order'])
            ->whereHas('orderItem.order', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->findOrFail($queueId);

        if ($queueItem->status !== 'queued') {
            return response()->json([
                'message' => 'Item is not in queued status',
                'error' => 'Invalid status transition'
            ], 422);
        }

        try {
            $queueItem->startPreparation();

            return response()->json([
                'message' => 'Preparation started',
                'queue_item' => $queueItem->load('orderItem.order')
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to start preparation', [
                'error' => $e->getMessage(),
                'queue_id' => $queueId
            ]);

            return response()->json([
                'message' => 'Failed to start preparation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark order item as ready
     */
    public function markAsReady(Request $request, $queueId)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $queueItem = KitchenOrderQueue::with(['orderItem.order'])
            ->whereHas('orderItem.order', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->findOrFail($queueId);

        if (!in_array($queueItem->status, ['queued', 'in_progress'])) {
            return response()->json([
                'message' => 'Item is not in preparation',
                'error' => 'Invalid status transition'
            ], 422);
        }

        try {
            $queueItem->markAsReady();

            return response()->json([
                'message' => 'Item marked as ready',
                'queue_item' => $queueItem->load('orderItem.order')
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to mark item as ready', [
                'error' => $e->getMessage(),
                'queue_id' => $queueId
            ]);

            return response()->json([
                'message' => 'Failed to mark item as ready',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Complete order item
     */
    public function complete(Request $request, $queueId)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $queueItem = KitchenOrderQueue::with(['orderItem.order'])
            ->whereHas('orderItem.order', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->findOrFail($queueId);

        if ($queueItem->status !== 'ready') {
            return response()->json([
                'message' => 'Item is not ready',
                'error' => 'Invalid status transition'
            ], 422);
        }

        try {
            $queueItem->complete(Auth::id());

            // Update order item status
            $orderItem = $queueItem->orderItem;
            $orderItem->status = 'ready';
            $orderItem->save();

            // Check if all items in the order are ready
            $this->checkOrderReadiness($orderItem->order_id);

            return response()->json([
                'message' => 'Item completed',
                'queue_item' => $queueItem->load('orderItem.order')
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to complete item', [
                'error' => $e->getMessage(),
                'queue_id' => $queueId
            ]);

            return response()->json([
                'message' => 'Failed to complete item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add order item to kitchen queue
     */
    public function addToQueue(Request $request)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $validator = Validator::make($request->all(), [
            'order_item_id' => 'required|exists:restaurant_order_items,id',
            'station_id' => 'required|exists:kitchen_stations,id',
            'priority' => 'nullable|in:low,normal,high,urgent',
            'estimated_time' => 'nullable|integer|min:1',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }

        try {
            // Verify order item belongs to store
            $orderItem = RestaurantOrderItem::whereHas('order', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })->findOrFail($request->input('order_item_id'));

            // Check if item is already in queue
            $existingQueue = KitchenOrderQueue::where('order_item_id', $orderItem->id)
                ->whereIn('status', ['queued', 'in_progress'])
                ->first();

            if ($existingQueue) {
                return response()->json([
                    'message' => 'Item is already in queue',
                    'error' => 'Duplicate queue item'
                ], 422);
            }

            $queueItem = KitchenOrderQueue::create([
                'order_item_id' => $orderItem->id,
                'station_id' => $request->input('station_id'),
                'status' => 'queued',
                'priority' => $request->input('priority', 'normal'),
                'estimated_time' => $request->input('estimated_time'),
                'notes' => $request->input('notes'),
            ]);

            // Update order item status
            $orderItem->status = 'confirmed';
            $orderItem->save();

            return response()->json([
                'message' => 'Item added to queue',
                'queue_item' => $queueItem->load('orderItem.order', 'station')
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to add item to queue', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'message' => 'Failed to add item to queue',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update queue item priority
     */
    public function updatePriority(Request $request, $queueId)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $queueItem = KitchenOrderQueue::with(['orderItem.order'])
            ->whereHas('orderItem.order', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->findOrFail($queueId);

        $validator = Validator::make($request->all(), [
            'priority' => 'required|in:low,normal,high,urgent',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }

        try {
            $queueItem->priority = $request->input('priority');
            $queueItem->save();

            return response()->json([
                'message' => 'Priority updated',
                'queue_item' => $queueItem
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update priority', [
                'error' => $e->getMessage(),
                'queue_id' => $queueId
            ]);

            return response()->json([
                'message' => 'Failed to update priority',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get kitchen statistics
     */
    public function getStatistics(Request $request)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $period = $request->input('period', 'today');
        $stationId = $request->input('station_id');

        // Calculate date range
        $startDate = $this->getStartDate($period);
        $endDate = now();

        $query = KitchenOrderQueue::whereHas('orderItem.order', function($query) use ($storeId) {
            $query->where('store_id', $storeId);
        });

        if ($stationId) {
            $query->where('station_id', $stationId);
        }

        // Get queue statistics
        $queueStats = $query->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('
                COUNT(*) as total_items,
                SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_items,
                AVG(CASE WHEN status = "completed" AND started_at IS NOT NULL AND completed_at IS NOT NULL 
                    THEN TIMESTAMPDIFF(MINUTE, started_at, completed_at) ELSE NULL END) as avg_preparation_time,
                SUM(CASE WHEN status = "completed" AND estimated_time IS NOT NULL 
                    THEN TIMESTAMPDIFF(MINUTE, started_at, completed_at) - estimated_time ELSE 0 END) as total_delay
            ')
            ->first();

        // Get items by status
        $itemsByStatus = $query->clone()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        // Get items by priority
        $itemsByPriority = $query->clone()
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('priority, COUNT(*) as count')
            ->groupBy('priority')
            ->pluck('count', 'priority');

        // Get station performance
        $stationPerformance = [];
        if (!$stationId) {
            $stationPerformance = DB::table('kitchen_order_queue as kq')
                ->join('kitchen_stations as ks', 'kq.station_id', '=', 'ks.id')
                ->where('ks.store_id', $storeId)
                ->whereBetween('kq.created_at', [$startDate, $endDate])
                ->selectRaw('
                    ks.id,
                    ks.name,
                    COUNT(*) as total_items,
                    SUM(CASE WHEN kq.status = "completed" THEN 1 ELSE 0 END) as completed_items,
                    AVG(CASE WHEN kq.status = "completed" AND kq.started_at IS NOT NULL AND kq.completed_at IS NOT NULL 
                        THEN TIMESTAMPDIFF(MINUTE, kq.started_at, kq.completed_at) ELSE NULL END) as avg_preparation_time
                ')
                ->groupBy('ks.id', 'ks.name')
                ->orderBy('completed_items', 'desc')
                ->get();
        }

        return response()->json([
            'period' => $period,
            'startDate' => $startDate->toDateString(),
            'endDate' => $endDate->toDateString(),
            'queueStats' => $queueStats,
            'itemsByStatus' => $itemsByStatus,
            'itemsByPriority' => $itemsByPriority,
            'stationPerformance' => $stationPerformance,
        ]);
    }

    /**
     * Get real-time queue status
     */
    public function getQueueStatus()
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $stations = KitchenStation::with(['queueItems' => function($query) {
                $query->with(['orderItem' => function($q) {
                    $q->with(['order' => function($order) {
                        $order->select('id', 'order_number', 'table_id', 'order_type');
                    }, 'product']);
                }])
                ->whereIn('status', ['queued', 'in_progress'])
                ->orderBy('priority', 'desc')
                ->orderBy('created_at', 'asc');
            }])
            ->forStore($storeId)
            ->active()
            ->orderBy('display_order')
            ->get();

        $readyItems = KitchenOrderQueue::with(['orderItem' => function($query) {
                $query->with(['order' => function($order) {
                    $order->select('id', 'order_number', 'table_id', 'order_type');
                }, 'product']);
            }])
            ->whereHas('orderItem.order', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->where('status', 'ready')
            ->orderBy('completed_at', 'desc')
            ->limit(30)
            ->get();

        return response()->json([
            'stations' => $stations,
            'readyItems' => $readyItems,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Get kitchen stations
     */
    public function getStations()
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $stations = KitchenStation::forStore($storeId)
            ->active()
            ->with(['products'])
            ->orderBy('display_order')
            ->get();

        return response()->json($stations);
    }

    /**
     * Check if all items in an order are ready
     */
    private function checkOrderReadiness($orderId)
    {
        $order = RestaurantOrder::with('items')->find($orderId);
        
        if (!$order) {
            return;
        }

        $allItemsReady = $order->items->every(function($item) {
            return in_array($item->status, ['ready', 'served', 'cancelled']);
        });

        if ($allItemsReady) {
            $order->status = 'ready';
            $order->save();
        }
    }

    /**
     * Get kitchen statistics for dashboard
     */
    private function getKitchenStats($storeId, $date)
    {
        $stats = DB::table('kitchen_order_queue as kq')
            ->join('restaurant_order_items as roi', 'kq.order_item_id', '=', 'roi.id')
            ->join('restaurant_orders as ro', 'roi.order_id', '=', 'ro.id')
            ->where('ro.store_id', $storeId)
            ->whereDate('ro.order_date', $date)
            ->selectRaw('
                COUNT(*) as total_items,
                SUM(CASE WHEN kq.status = "completed" THEN 1 ELSE 0 END) as completed_items,
                SUM(CASE WHEN kq.status = "queued" THEN 1 ELSE 0 END) as queued_items,
                SUM(CASE WHEN kq.status = "in_progress" THEN 1 ELSE 0 END) as in_progress_items,
                SUM(CASE WHEN kq.status = "ready" THEN 1 ELSE 0 END) as ready_items,
                AVG(CASE WHEN kq.status = "completed" AND kq.started_at IS NOT NULL AND kq.completed_at IS NOT NULL 
                    THEN TIMESTAMPDIFF(MINUTE, kq.started_at, kq.completed_at) ELSE NULL END) as avg_preparation_time
            ')
            ->first();

        return [
            'totalItems' => $stats->total_items ?? 0,
            'completedItems' => $stats->completed_items ?? 0,
            'queuedItems' => $stats->queued_items ?? 0,
            'inProgressItems' => $stats->in_progress_items ?? 0,
            'readyItems' => $stats->ready_items ?? 0,
            'avgPreparationTime' => round($stats->avg_preparation_time ?? 0, 1),
        ];
    }

    /**
     * Generate KOT for an order
     */
    public function generateKOT(Request $request, $orderId)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $order = RestaurantOrder::with(['items.product', 'items.modifiers.modifier'])
            ->forStore($storeId)
            ->findOrFail($orderId);

        if ($order->status !== 'confirmed') {
            return response()->json([
                'message' => 'Order must be confirmed to generate KOT',
                'error' => 'Invalid order status'
            ], 422);
        }

        try {
            $kotService = new KOTGenerationService();
            $result = $kotService->generateKOTForOrder($order);

            return response()->json($result, $result['success'] ? 200 : 422);
        } catch (\Exception $e) {
            Log::error('KOT generation failed', [
                'order_id' => $orderId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'KOT generation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Regenerate KOT for a specific item
     */
    public function regenerateKOT(Request $request, $orderItemId)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $orderItem = RestaurantOrderItem::whereHas('order', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->with(['order', 'product', 'modifiers.modifier'])
            ->findOrFail($orderItemId);

        try {
            $kotService = new KOTGenerationService();
            $result = $kotService->regenerateKOTForItem($orderItem);

            return response()->json($result, $result['success'] ? 200 : 422);
        } catch (\Exception $e) {
            Log::error('KOT regeneration failed', [
                'order_item_id' => $orderItemId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'KOT regeneration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Print KOT
     */
    public function printKOT(Request $request, $kotId)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $kot = KitchenOrderQueue::with(['orderItem.order', 'station'])
            ->whereHas('orderItem.order', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->findOrFail($kotId);

        try {
            $printService = new KOTPrintService();
            $result = $printService->printKOT($kot);

            return response()->json($result, $result['success'] ? 200 : 422);
        } catch (\Exception $e) {
            Log::error('KOT printing failed', [
                'kot_id' => $kotId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'KOT printing failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Print consolidated KOT for an order
     */
    public function printConsolidatedKOT(Request $request, $orderId)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $order = RestaurantOrder::forStore($storeId)->findOrFail($orderId);

        try {
            $printService = new KOTPrintService();
            $result = $printService->printConsolidatedKOT($order);

            return response()->json($result, $result['success'] ? 200 : 422);
        } catch (\Exception $e) {
            Log::error('Consolidated KOT printing failed', [
                'order_id' => $orderId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Consolidated KOT printing failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export KOT as text
     */
    public function exportKOTText(Request $request, $kotId)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $kot = KitchenOrderQueue::with(['orderItem.order', 'station'])
            ->whereHas('orderItem.order', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->findOrFail($kotId);

        try {
            $printService = new KOTPrintService();
            $content = $printService->exportKOTAsText($kot);

            return response($content)
                ->header('Content-Type', 'text/plain')
                ->header('Content-Disposition', 'attachment; filename="KOT_' . $kot->kot_number . '.txt"');
        } catch (\Exception $e) {
            Log::error('KOT export failed', [
                'kot_id' => $kotId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'KOT export failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export KOT as JSON
     */
    public function exportKOTJSON(Request $request, $kotId)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $kot = KitchenOrderQueue::with(['orderItem.order', 'station'])
            ->whereHas('orderItem.order', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->findOrFail($kotId);

        try {
            $printService = new KOTPrintService();
            $content = $printService->exportKOTAsJSON($kot);

            return response($content)
                ->header('Content-Type', 'application/json')
                ->header('Content-Disposition', 'attachment; filename="KOT_' . $kot->kot_number . '.json"');
        } catch (\Exception $e) {
            Log::error('KOT export failed', [
                'kot_id' => $kotId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'KOT export failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify stock for KOT
     */
    public function verifyKOTStock(Request $request, $kotId)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $kot = KitchenOrderQueue::with(['orderItem.product', 'orderItem.modifiers.modifier'])
            ->whereHas('orderItem.order', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->findOrFail($kotId);

        if ($kot->stock_verified) {
            return response()->json([
                'message' => 'Stock already verified for this KOT',
                'error' => 'Already verified'
            ], 422);
        }

        try {
            $kot->markStockVerified(Auth::id());

            return response()->json([
                'message' => 'Stock verified successfully',
                'kot' => $kot->load('orderItem.order')
            ]);
        } catch (\Exception $e) {
            Log::error('KOT stock verification failed', [
                'kot_id' => $kotId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Stock verification failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get KOT details
     */
    public function getKOTDetails(Request $request, $kotId)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $kot = KitchenOrderQueue::with([
                'orderItem' => function($query) {
                    $query->with(['product', 'modifiers.modifier']);
                },
                'orderItem.order' => function($query) {
                    $query->with(['table', 'waiter']);
                },
                'station',
                'completedBy'
            ])
            ->whereHas('orderItem.order', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->findOrFail($kotId);

        return response()->json([
            'kot' => $kot->getSummary()
        ]);
    }

    /**
     * Get KOT statistics
     */
    public function getKOTStatistics(Request $request)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $period = $request->input('period', 'today');

        try {
            $kotService = new KOTGenerationService();
            $statistics = $kotService->getKOTStatistics($storeId, $period);

            return response()->json($statistics);
        } catch (\Exception $e) {
            Log::error('KOT statistics retrieval failed', [
                'store_id' => $storeId,
                'period' => $period,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to retrieve KOT statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test printer connection
     */
    public function testPrinter(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'printer_name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }

        try {
            $printService = new KOTPrintService();
            $result = $printService->testPrinterConnection($request->input('printer_name'));

            return response()->json($result, $result['success'] ? 200 : 422);
        } catch (\Exception $e) {
            Log::error('Printer test failed', [
                'printer_name' => $request->input('printer_name'),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Printer test failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get start date based on period
     */
    private function getStartDate($period)
    {
        switch ($period) {
            case 'today':
                return now()->startOfDay();
            case 'week':
                return now()->startOfWeek();
            case 'month':
                return now()->startOfMonth();
            case 'year':
                return now()->startOfYear();
            default:
                return now()->startOfDay();
        }
    }
}