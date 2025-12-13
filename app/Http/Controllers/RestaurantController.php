<?php

namespace App\Http\Controllers;

use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantTable;
use App\Models\Restaurant\TableReservation;
use App\Models\Restaurant\TableSection;
use App\Models\Store;
use App\Models\Contact;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

class RestaurantController extends Controller
{
    /**
     * Display restaurant dashboard
     */
    public function dashboard()
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $currentStore = Store::find($storeId);

        if (!$currentStore) {
            return redirect()->route('store');
        }

        // Get today's statistics
        $today = now()->toDateString();
        
        $todayOrders = RestaurantOrder::forStore($storeId)
            ->whereDate('order_date', $today)
            ->count();
            
        $todayRevenue = RestaurantOrder::forStore($storeId)
            ->whereDate('order_date', $today)
            ->where('status', 'paid')
            ->sum('total_amount');
            
        $activeOrders = RestaurantOrder::forStore($storeId)
            ->active()
            ->count();
            
        $occupiedTables = RestaurantTable::forStore($storeId)
            ->occupied()
            ->count();
            
        $availableTables = RestaurantTable::forStore($storeId)
            ->available()
            ->count();
            
        $todayReservations = TableReservation::forDate($today)
            ->count();
            
        $seatedReservations = TableReservation::forDate($today)
            ->where('status', 'seated')
            ->count();

        // Get recent orders
        $recentOrders = RestaurantOrder::with(['table', 'waiter'])
            ->forStore($storeId)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Get upcoming reservations
        $upcomingReservations = TableReservation::with(['table', 'contact'])
            ->whereDate('reservation_date', '>=', $today)
            ->whereIn('status', ['confirmed'])
            ->orderBy('reservation_date')
            ->orderBy('reservation_time')
            ->limit(10)
            ->get();

        // Get table sections with status
        $tableSections = TableSection::with(['tables' => function($query) use ($storeId) {
            $query->forStore($storeId);
        }])
        ->forStore($storeId)
        ->get();

        return Inertia::render('Restaurant/Dashboard', [
            'currentStore' => $currentStore,
            'todayStats' => [
                'orders' => $todayOrders,
                'revenue' => $todayRevenue,
                'active_orders' => $activeOrders,
                'available_tables' => $availableTables,
                'total_tables' => $occupiedTables + $availableTables,
            ],
            'recentOrders' => $recentOrders,
            'upcomingReservations' => $upcomingReservations,
            'tableSections' => $tableSections,
        ]);
    }

    /**
     * Display restaurant floor plan
     */
    public function floorPlan()
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $currentStore = Store::find($storeId);

        if (!$currentStore) {
            return redirect()->route('store');
        }

        $tableSections = TableSection::with(['tables' => function($query) use ($storeId) {
            $query->forStore($storeId)
                  ->with(['currentOrder', 'reservations' => function($q) {
                      $q->whereDate('reservation_date', today())
                        ->whereIn('status', ['confirmed', 'seated'])
                        ->orderBy('reservation_time');
                  }]);
        }])
        ->forStore($storeId)
        ->get();

        // Get active orders for today
        $activeOrders = RestaurantOrder::with(['table', 'items'])
            ->forStore($storeId)
            ->active()
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Restaurant/FloorPlan', [
            'currentStore' => $currentStore,
            'tableSections' => $tableSections,
            'activeOrders' => $activeOrders,
        ]);
    }

    /**
     * Get restaurant statistics
     */
    public function getStatistics(Request $request)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $period = $request->input('period', 'today'); // today, week, month, year
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        // Calculate date range based on period
        switch ($period) {
            case 'today':
                $startDate = now()->toDateString();
                $endDate = now()->toDateString();
                break;
            case 'week':
                $startDate = now()->startOfWeek()->toDateString();
                $endDate = now()->endOfWeek()->toDateString();
                break;
            case 'month':
                $startDate = now()->startOfMonth()->toDateString();
                $endDate = now()->endOfMonth()->toDateString();
                break;
            case 'year':
                $startDate = now()->startOfYear()->toDateString();
                $endDate = now()->endOfYear()->toDateString();
                break;
            case 'custom':
                if (!$startDate || !$endDate) {
                    return response()->json(['error' => 'Start date and end date are required for custom period'], 400);
                }
                break;
        }

        // Get orders in the period
        $orders = RestaurantOrder::forStore($storeId)
            ->whereBetween('order_date', [$startDate, $endDate])
            ->get();

        // Calculate statistics
        $totalOrders = $orders->count();
        $totalRevenue = $orders->where('status', 'paid')->sum('total_amount');
        $averageOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;
        
        // Orders by type
        $ordersByType = $orders->groupBy('order_type')->map(function($group) {
            return [
                'count' => $group->count(),
                'revenue' => $group->where('status', 'paid')->sum('total_amount'),
            ];
        });

        // Orders by status
        $ordersByStatus = $orders->groupBy('status')->map(function($group) {
            return $group->count();
        });

        // Peak hours (for today/week)
        $peakHours = [];
        if (in_array($period, ['today', 'week'])) {
            $peakHours = $orders->groupBy(function($order) {
                return Carbon::parse($order->order_time)->format('H:00');
            })->map(function($group) {
                return $group->count();
            })->sortDesc()->take(5);
        }

        // Top selling items
        $topItems = DB::table('restaurant_order_items')
            ->join('restaurant_orders', 'restaurant_order_items.order_id', '=', 'restaurant_orders.id')
            ->join('products', 'restaurant_order_items.product_id', '=', 'products.id')
            ->where('restaurant_orders.store_id', $storeId)
            ->whereBetween('restaurant_orders.order_date', [$startDate, $endDate])
            ->selectRaw('products.name, SUM(restaurant_order_items.quantity) as total_quantity, SUM(restaurant_order_items.quantity * restaurant_order_items.unit_price) as total_revenue')
            ->groupBy('products.id', 'products.name')
            ->orderBy('total_quantity', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'period' => $period,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'summary' => [
                'totalOrders' => $totalOrders,
                'totalRevenue' => $totalRevenue,
                'averageOrderValue' => $averageOrderValue,
            ],
            'ordersByType' => $ordersByType,
            'ordersByStatus' => $ordersByStatus,
            'peakHours' => $peakHours,
            'topItems' => $topItems,
        ]);
    }

    /**
     * Get real-time restaurant status
     */
    public function getLiveStatus()
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $today = now()->toDateString();

        // Get current table status
        $tables = RestaurantTable::with(['currentOrder'])
            ->forStore($storeId)
            ->get()
            ->map(function($table) {
                return [
                    'id' => $table->id,
                    'table_number' => $table->table_number,
                    'name' => $table->name,
                    'capacity' => $table->capacity,
                    'status' => $table->status,
                    'current_order_id' => $table->current_order_id,
                    'reserved_until' => $table->reserved_until,
                    'current_order' => $table->currentOrder ? [
                        'id' => $table->currentOrder->id,
                        'order_number' => $table->currentOrder->order_number,
                        'status' => $table->currentOrder->status,
                        'customer_count' => $table->currentOrder->customer_count,
                        'order_time' => $table->currentOrder->order_time,
                    ] : null,
                ];
            });

        // Get active orders
        $activeOrders = RestaurantOrder::with(['table', 'items', 'waiter'])
            ->forStore($storeId)
            ->active()
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'table' => $order->table ? [
                        'id' => $order->table->id,
                        'table_number' => $order->table->table_number,
                        'name' => $order->table->name,
                    ] : null,
                    'order_type' => $order->order_type,
                    'status' => $order->status,
                    'customer_count' => $order->customer_count,
                    'waiter' => $order->waiter ? [
                        'id' => $order->waiter->id,
                        'name' => $order->waiter->name,
                    ] : null,
                    'total_amount' => $order->total_amount,
                    'order_time' => $order->order_time,
                    'items_count' => $order->items->count(),
                ];
            });

        // Get today's reservations
        $reservations = TableReservation::with(['table', 'contact'])
            ->forDate($today)
            ->whereIn('status', ['confirmed', 'seated'])
            ->orderBy('reservation_time')
            ->get()
            ->map(function($reservation) {
                return [
                    'id' => $reservation->id,
                    'table' => $reservation->table ? [
                        'id' => $reservation->table->id,
                        'table_number' => $reservation->table->table_number,
                        'name' => $reservation->table->name,
                    ] : null,
                    'contact' => $reservation->contact ? [
                        'id' => $reservation->contact->id,
                        'name' => $reservation->contact->name,
                        'phone' => $reservation->contact->phone,
                    ] : [
                        'name' => $reservation->customer_name,
                        'phone' => $reservation->customer_phone,
                    ],
                    'party_size' => $reservation->party_size,
                    'reservation_time' => $reservation->reservation_time,
                    'status' => $reservation->status,
                ];
            });

        return response()->json([
            'tables' => $tables,
            'activeOrders' => $activeOrders,
            'reservations' => $reservations,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Get quick actions for restaurant operations
     */
    public function getQuickActions()
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $today = now()->toDateString();

        // Get available tables for quick seating
        $availableTables = RestaurantTable::forStore($storeId)
            ->available()
            ->orderBy('capacity')
            ->get()
            ->map(function($table) {
                return [
                    'id' => $table->id,
                    'table_number' => $table->table_number,
                    'name' => $table->name,
                    'capacity' => $table->capacity,
                    'section' => $table->section ? $table->section->name : null,
                ];
            });

        // Get waiters
        $waiters = User::where('store_id', $storeId)
            ->where('role', 'waiter')
            ->orWhere('role', 'staff')
            ->select('id', 'name')
            ->get();

        // Get recent customers
        $recentCustomers = Contact::customers()
            ->whereHas('restaurantOrders', function($query) use ($storeId) {
                $query->forStore($storeId)
                      ->whereDate('order_date', '>=', now()->subDays(30));
            })
            ->orderBy('updated_at', 'desc')
            ->limit(20)
            ->get(['id', 'name', 'phone']);

        // Get today's pending reservations
        $pendingReservations = TableReservation::with(['table', 'contact'])
            ->forDate($today)
            ->where('status', 'confirmed')
            ->where('reservation_time', '<=', now()->addMinutes(30))
            ->orderBy('reservation_time')
            ->get();

        return response()->json([
            'availableTables' => $availableTables,
            'waiters' => $waiters,
            'recentCustomers' => $recentCustomers,
            'pendingReservations' => $pendingReservations,
        ]);
    }

    /**
     * Shift management
     */
    public function shiftManagement()
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $currentStore = Store::find($storeId);

        if (!$currentStore) {
            return redirect()->route('store');
        }

        // Get current shift info
        $currentShift = $this->getCurrentShift($storeId);
        
        // Get today's shift summary
        $todayShifts = $this->getTodayShifts($storeId);

        return Inertia::render('Restaurant/ShiftManagement', [
            'currentStore' => $currentStore,
            'currentShift' => $currentShift,
            'todayShifts' => $todayShifts,
        ]);
    }

    /**
     * Get current shift information
     */
    private function getCurrentShift($storeId)
    {
        $now = now();
        
        // Define shift times (can be made configurable)
        $shifts = [
            'morning' => ['start' => '06:00', 'end' => '14:00'],
            'evening' => ['start' => '14:00', 'end' => '22:00'],
            'night' => ['start' => '22:00', 'end' => '06:00'],
        ];

        $currentShiftName = null;
        foreach ($shifts as $name => $times) {
            $startTime = Carbon::parse($times['start']);
            $endTime = Carbon::parse($times['end']);
            
            if ($name === 'night') {
                // Night shift spans midnight
                if ($now->format('H:i') >= $times['start'] || $now->format('H:i') < $times['end']) {
                    $currentShiftName = $name;
                    break;
                }
            } else {
                if ($now->format('H:i') >= $times['start'] && $now->format('H:i') < $times['end']) {
                    $currentShiftName = $name;
                    break;
                }
            }
        }

        if (!$currentShiftName) {
            return null;
        }

        // Get shift statistics
        $shiftStart = $now->copy()->setTimeFromTimeString($shifts[$currentShiftName]['start']);
        if ($currentShiftName === 'night' && $now->format('H:i') < $shifts[$currentShiftName]['end']) {
            $shiftStart = $now->copy()->subDay()->setTimeFromTimeString($shifts[$currentShiftName]['start']);
        }

        $shiftOrders = RestaurantOrder::forStore($storeId)
            ->where('created_at', '>=', $shiftStart)
            ->get();

        return [
            'name' => $currentShiftName,
            'startTime' => $shifts[$currentShiftName]['start'],
            'endTime' => $shifts[$currentShiftName]['end'],
            'startedAt' => $shiftStart,
            'ordersCount' => $shiftOrders->count(),
            'revenue' => $shiftOrders->where('status', 'paid')->sum('total_amount'),
        ];
    }

    /**
     * Get today's shifts
     */
    private function getTodayShifts($storeId)
    {
        $today = now()->toDateString();
        
        $shifts = [
            'morning' => ['start' => '06:00', 'end' => '14:00'],
            'evening' => ['start' => '14:00', 'end' => '22:00'],
            'night' => ['start' => '22:00', 'end' => '06:00'],
        ];

        $todayShifts = [];

        foreach ($shifts as $name => $times) {
            $shiftStart = Carbon::parse($today . ' ' . $times['start']);
            $shiftEnd = Carbon::parse($today . ' ' . $times['end']);
            
            if ($name === 'night') {
                $shiftEnd->addDay(); // Night shift goes to next day
            }

            $shiftOrders = RestaurantOrder::forStore($storeId)
                ->where('created_at', '>=', $shiftStart)
                ->where('created_at', '<', $shiftEnd)
                ->get();

            $todayShifts[] = [
                'name' => $name,
                'startTime' => $times['start'],
                'endTime' => $times['end'],
                'ordersCount' => $shiftOrders->count(),
                'revenue' => $shiftOrders->where('status', 'paid')->sum('total_amount'),
                'isCurrent' => $this->getCurrentShift($storeId)['name'] === $name,
            ];
        }

        return $todayShifts;
    }
}