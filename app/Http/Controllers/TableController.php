<?php

namespace App\Http\Controllers;

use App\Models\Restaurant\RestaurantTable;
use App\Models\Restaurant\TableSection;
use App\Models\Restaurant\TableReservation;
use App\Models\Restaurant\RestaurantOrder;
use App\Models\Store;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;

class TableController extends Controller
{
    /**
     * Display tables management page
     */
    public function index()
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $currentStore = Store::find($storeId);

        if (!$currentStore) {
            return redirect()->route('store');
        }

        $tables = RestaurantTable::with(['section', 'currentOrder'])
            ->forStore($storeId)
            ->orderBy('section_id')
            ->orderBy('table_number')
            ->get();

        $sections = TableSection::forStore($storeId)
            ->orderBy('name')
            ->get();

        return Inertia::render('Restaurant/Tables/Index', [
            'currentStore' => $currentStore,
            'tables' => $tables,
            'sections' => $sections,
        ]);
    }

    /**
     * Display table creation form
     */
    public function create()
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $currentStore = Store::find($storeId);

        if (!$currentStore) {
            return redirect()->route('store');
        }

        $sections = TableSection::forStore($storeId)
            ->orderBy('name')
            ->get();

        return Inertia::render('Restaurant/Tables/Create', [
            'currentStore' => $currentStore,
            'sections' => $sections,
        ]);
    }

    /**
     * Store a new table
     */
    public function store(Request $request)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $validator = Validator::make($request->all(), [
            'table_number' => 'required|string|max:50',
            'name' => 'nullable|string|max:100',
            'capacity' => 'required|integer|min:1|max:50',
            'section_id' => 'nullable|exists:table_sections,id',
            'shape' => 'nullable|in:round,square,rectangle',
            'position_x' => 'nullable|numeric|min:0',
            'position_y' => 'nullable|numeric|min:0',
            'width' => 'nullable|numeric|min:1',
            'height' => 'nullable|numeric|min:1',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }

        try {
            $table = RestaurantTable::create([
                'table_number' => $request->input('table_number'),
                'name' => $request->input('name'),
                'capacity' => $request->input('capacity'),
                'section_id' => $request->input('section_id'),
                'shape' => $request->input('shape', 'square'),
                'position_x' => $request->input('position_x', 0),
                'position_y' => $request->input('position_y', 0),
                'width' => $request->input('width', 100),
                'height' => $request->input('height', 100),
                'status' => 'available',
                'notes' => $request->input('notes'),
                'store_id' => $storeId,
                'created_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Table created successfully',
                'table' => $table->load('section')
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create table', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'message' => 'Failed to create table',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display table editing form
     */
    public function edit($id)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $currentStore = Store::find($storeId);

        if (!$currentStore) {
            return redirect()->route('store');
        }

        $table = RestaurantTable::with(['section'])
            ->forStore($storeId)
            ->findOrFail($id);

        $sections = TableSection::forStore($storeId)
            ->orderBy('name')
            ->get();

        return Inertia::render('Restaurant/Tables/Edit', [
            'currentStore' => $currentStore,
            'table' => $table,
            'sections' => $sections,
        ]);
    }

    /**
     * Update table
     */
    public function update(Request $request, $id)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $table = RestaurantTable::forStore($storeId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'table_number' => 'required|string|max:50',
            'name' => 'nullable|string|max:100',
            'capacity' => 'required|integer|min:1|max:50',
            'section_id' => 'nullable|exists:table_sections,id',
            'shape' => 'nullable|in:round,square,rectangle',
            'position_x' => 'nullable|numeric|min:0',
            'position_y' => 'nullable|numeric|min:0',
            'width' => 'nullable|numeric|min:1',
            'height' => 'nullable|numeric|min:1',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }

        try {
            $table->update([
                'table_number' => $request->input('table_number'),
                'name' => $request->input('name'),
                'capacity' => $request->input('capacity'),
                'section_id' => $request->input('section_id'),
                'shape' => $request->input('shape', 'square'),
                'position_x' => $request->input('position_x', 0),
                'position_y' => $request->input('position_y', 0),
                'width' => $request->input('width', 100),
                'height' => $request->input('height', 100),
                'notes' => $request->input('notes'),
            ]);

            return response()->json([
                'message' => 'Table updated successfully',
                'table' => $table->load('section')
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update table', [
                'error' => $e->getMessage(),
                'table_id' => $id,
                'request' => $request->all()
            ]);

            return response()->json([
                'message' => 'Failed to update table',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete table
     */
    public function destroy($id)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $table = RestaurantTable::forStore($storeId)->findOrFail($id);

        // Check if table has active orders
        if ($table->currentOrder) {
            return response()->json([
                'message' => 'Cannot delete table with active orders',
                'error' => 'Table has active orders'
            ], 422);
        }

        // Check if table has upcoming reservations
        $hasReservations = TableReservation::where('table_id', $id)
            ->where('reservation_date', '>=', today())
            ->whereIn('status', ['confirmed', 'seated'])
            ->exists();

        if ($hasReservations) {
            return response()->json([
                'message' => 'Cannot delete table with upcoming reservations',
                'error' => 'Table has upcoming reservations'
            ], 422);
        }

        try {
            $table->delete();

            return response()->json([
                'message' => 'Table deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete table', [
                'error' => $e->getMessage(),
                'table_id' => $id
            ]);

            return response()->json([
                'message' => 'Failed to delete table',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update table status
     */
    public function updateStatus(Request $request, $id)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $table = RestaurantTable::forStore($storeId)->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:available,occupied,reserved,cleaning,maintenance',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }

        try {
            $newStatus = $request->input('status');

            // Validate status transitions
            if (!$this->isValidStatusTransition($table->status, $newStatus)) {
                return response()->json([
                    'message' => 'Invalid status transition',
                    'error' => "Cannot change status from {$table->status} to {$newStatus}"
                ], 422);
            }

            // Handle specific status changes
            if ($newStatus === 'available') {
                $table->markAsAvailable();
            } elseif ($newStatus === 'occupied') {
                $orderId = $request->input('order_id');
                $table->markAsOccupied($orderId);
            } elseif ($newStatus === 'reserved') {
                $reservedUntil = $request->input('reserved_until');
                if ($reservedUntil) {
                    $table->markAsReserved(Carbon::parse($reservedUntil));
                } else {
                    $table->status = $newStatus;
                    $table->save();
                }
            } else {
                $table->status = $newStatus;
                $table->save();
            }

            if ($request->has('notes')) {
                $table->notes = $request->input('notes');
                $table->save();
            }

            return response()->json([
                'message' => 'Table status updated successfully',
                'table' => $table->load('section')
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update table status', [
                'error' => $e->getMessage(),
                'table_id' => $id,
                'request' => $request->all()
            ]);

            return response()->json([
                'message' => 'Failed to update table status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available tables for seating
     */
    public function getAvailableTables(Request $request)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $partySize = $request->input('party_size', 1);
        $sectionId = $request->input('section_id');
        $reservationTime = $request->input('reservation_time');

        $query = RestaurantTable::forStore($storeId)
            ->with(['section']);

        // Filter by capacity
        $query->where('capacity', '>=', $partySize);

        // Filter by section if specified
        if ($sectionId) {
            $query->where('section_id', $sectionId);
        }

        // Get tables that are available
        $tables = $query->get()->filter(function($table) use ($reservationTime) {
            if (!$table->isAvailable()) {
                return false;
            }

            // Check if table is reserved at the requested time
            if ($reservationTime) {
                $reservationTime = Carbon::parse($reservationTime);
                $hasConflict = TableReservation::where('table_id', $table->id)
                    ->where('reservation_date', $reservationTime->toDateString())
                    ->whereIn('status', ['confirmed', 'seated'])
                    ->where(function($query) use ($reservationTime) {
                        $query->where('reservation_time', '<=', $reservationTime)
                              ->whereRaw('DATE_ADD(reservation_time, INTERVAL duration_minutes MINUTE) > ?', [$reservationTime]);
                    })
                    ->exists();

                return !$hasConflict;
            }

            return true;
        })->values();

        return response()->json([
            'tables' => $tables,
            'party_size' => $partySize,
        ]);
    }

    /**
     * Get table details with current order
     */
    public function getTableDetails($id)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $table = RestaurantTable::with([
            'section',
            'currentOrder' => function($query) {
                $query->with(['items', 'waiter']);
            },
            'reservations' => function($query) {
                $query->whereDate('reservation_date', '>=', today())
                      ->whereIn('status', ['confirmed', 'seated'])
                      ->orderBy('reservation_date')
                      ->orderBy('reservation_time');
            }
        ])
        ->forStore($storeId)
        ->findOrFail($id);

        return response()->json($table);
    }

    /**
     * Bulk update table positions for floor plan
     */
    public function updatePositions(Request $request)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        
        $validator = Validator::make($request->all(), [
            'tables' => 'required|array',
            'tables.*.id' => 'required|exists:restaurant_tables,id',
            'tables.*.position_x' => 'required|numeric',
            'tables.*.position_y' => 'required|numeric',
            'tables.*.width' => 'nullable|numeric|min:1',
            'tables.*.height' => 'nullable|numeric|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }

        try {
            DB::transaction(function() use ($request, $storeId) {
                foreach ($request->input('tables') as $tableData) {
                    $table = RestaurantTable::forStore($storeId)
                        ->findOrFail($tableData['id']);

                    $table->update([
                        'position_x' => $tableData['position_x'],
                        'position_y' => $tableData['position_y'],
                        'width' => $tableData['width'] ?? $table->width,
                        'height' => $tableData['height'] ?? $table->height,
                    ]);
                }
            });

            return response()->json([
                'message' => 'Table positions updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update table positions', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'message' => 'Failed to update table positions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get table statistics
     */
    public function getStatistics(Request $request)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $period = $request->input('period', 'today');
        
        // Calculate date range
        $startDate = $this->getStartDate($period);
        $endDate = now();

        // Get table usage statistics
        $tableStats = DB::table('restaurant_tables as t')
            ->leftJoin('restaurant_orders as o', function($join) use ($startDate, $endDate) {
                $join->on('t.id', '=', 'o.table_id')
                     ->whereBetween('o.order_date', [$startDate->toDateString(), $endDate->toDateString()]);
            })
            ->where('t.store_id', $storeId)
            ->selectRaw('
                t.id,
                t.table_number,
                t.name,
                t.capacity,
                COUNT(o.id) as total_orders,
                SUM(CASE WHEN o.status = "paid" THEN o.total_amount ELSE 0 END) as total_revenue,
                AVG(CASE WHEN o.status = "completed" THEN TIMESTAMPDIFF(MINUTE, o.order_time, o.completed_at) ELSE NULL END) as avg_turnover_time
            ')
            ->groupBy('t.id', 't.table_number', 't.name', 't.capacity')
            ->orderBy('total_orders', 'desc')
            ->get();

        // Get occupancy rates by hour
        $occupancyByHour = [];
        if (in_array($period, ['today', 'week'])) {
            $occupancyByHour = DB::table('restaurant_orders as o')
                ->join('restaurant_tables as t', 'o.table_id', '=', 't.id')
                ->where('o.store_id', $storeId)
                ->whereBetween('o.order_date', [$startDate->toDateString(), $endDate->toDateString()])
                ->where('o.status', '!=', 'cancelled')
                ->selectRaw('
                    HOUR(o.order_time) as hour,
                    COUNT(DISTINCT o.table_id) as occupied_tables,
                    (SELECT COUNT(*) FROM restaurant_tables WHERE store_id = ?) as total_tables
                ', [$storeId])
                ->groupBy('hour')
                ->orderBy('hour')
                ->get()
                ->map(function($item) {
                    return [
                        'hour' => $item->hour,
                        'occupied' => $item->occupied_tables,
                        'total' => $item->total_tables,
                        'occupancy_rate' => $item->total_tables > 0 ? ($item->occupied_tables / $item->total_tables) * 100 : 0,
                    ];
                });
        }

        return response()->json([
            'period' => $period,
            'startDate' => $startDate->toDateString(),
            'endDate' => $endDate->toDateString(),
            'tableStats' => $tableStats,
            'occupancyByHour' => $occupancyByHour,
        ]);
    }

    /**
     * Validate status transitions
     */
    private function isValidStatusTransition($currentStatus, $newStatus)
    {
        $validTransitions = [
            'available' => ['occupied', 'reserved', 'cleaning', 'maintenance'],
            'occupied' => ['available', 'cleaning'],
            'reserved' => ['available', 'occupied'],
            'cleaning' => ['available'],
            'maintenance' => ['available'],
        ];

        return in_array($newStatus, $validTransitions[$currentStatus] ?? []);
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