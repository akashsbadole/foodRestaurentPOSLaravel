<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Restaurant\RestaurantOrder;
use App\Models\Restaurant\RestaurantTable;
use App\Models\Restaurant\TableReservation;
use App\Models\Store;
use App\Models\Contact;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;

class RestaurantController extends Controller
{
    /**
     * Get restaurant dashboard data
     */
    public function dashboard()
    {
        $storeId = $this->getStoreId();
        
        // Get today's statistics
        $today = now()->toDateString();
        
        $stats = [
            'todayOrders' => RestaurantOrder::forStore($storeId)
                ->whereDate('order_date', $today)
                ->count(),
            'todayRevenue' => RestaurantOrder::forStore($storeId)
                ->whereDate('order_date', $today)
                ->where('status', 'paid')
                ->sum('total_amount'),
            'activeOrders' => RestaurantOrder::forStore($storeId)
                ->active()
                ->count(),
            'occupiedTables' => RestaurantTable::forStore($storeId)
                ->occupied()
                ->count(),
            'availableTables' => RestaurantTable::forStore($storeId)
                ->available()
                ->count(),
            'todayReservations' => TableReservation::forDate($today)
                ->count(),
        ];

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

        return response()->json([
            'stats' => $stats,
            'recentOrders' => $recentOrders,
            'upcomingReservations' => $upcomingReservations,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Get tables with current status
     */
    public function tables()
    {
        $storeId = $this->getStoreId();
        
        $tables = RestaurantTable::with(['section', 'currentOrder'])
            ->forStore($storeId)
            ->orderBy('section_id')
            ->orderBy('table_number')
            ->get()
            ->map(function($table) {
                return [
                    'id' => $table->id,
                    'table_number' => $table->table_number,
                    'name' => $table->name,
                    'capacity' => $table->capacity,
                    'section' => $table->section ? [
                        'id' => $table->section->id,
                        'name' => $table->section->name,
                    ] : null,
                    'status' => $table->status,
                    'position_x' => $table->position_x,
                    'position_y' => $table->position_y,
                    'width' => $table->width,
                    'height' => $table->height,
                    'shape' => $table->shape,
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

        return response()->json($tables);
    }

    /**
     * Get available tables for seating
     */
    public function availableTables(Request $request)
    {
        $storeId = $this->getStoreId();
        
        $validator = Validator::make($request->all(), [
            'party_size' => 'required|integer|min:1',
            'section_id' => 'nullable|exists:table_sections,id',
            'reservation_time' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }

        $partySize = $request->input('party_size');
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

            // Check if table is reserved at requested time
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
     * Get active orders
     */
    public function activeOrders()
    {
        $storeId = $this->getStoreId();
        
        $orders = RestaurantOrder::with(['table', 'items.product', 'waiter'])
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
                    'special_instructions' => $order->special_instructions,
                    'items_count' => $order->items->count(),
                    'items' => $order->items->map(function($item) {
                        return [
                            'id' => $item->id,
                            'product' => [
                                'id' => $item->product->id,
                                'name' => $item->product->name,
                            ],
                            'quantity' => $item->quantity,
                            'unit_price' => $item->unit_price,
                            'status' => $item->status,
                            'special_instructions' => $item->special_instructions,
                        ];
                    }),
                ];
            });

        return response()->json($orders);
    }

    /**
     * Get today's reservations
     */
    public function todayReservations()
    {
        $storeId = $this->getStoreId();
        $today = now()->toDateString();
        
        $reservations = TableReservation::with(['table', 'contact'])
            ->whereHas('table', function($query) use ($storeId) {
                $query->where('store_id', $storeId);
            })
            ->forDate($today)
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
                    'duration_minutes' => $reservation->duration_minutes,
                    'status' => $reservation->status,
                    'special_requests' => $reservation->special_requests,
                ];
            });

        return response()->json($reservations);
    }

    /**
     * Get waiters
     */
    public function waiters()
    {
        $storeId = $this->getStoreId();
        
        $waiters = User::where('store_id', $storeId)
            ->where(function($query) {
                $query->where('role', 'waiter')
                      ->orWhere('role', 'staff');
            })
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return response()->json($waiters);
    }

    /**
     * Get customers
     */
    public function customers(Request $request)
    {
        $storeId = $this->getStoreId();
        $search = $request->input('search');
        
        $query = Contact::customers()
            ->orderBy('name');

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $customers = $query->limit(50)
            ->get(['id', 'name', 'phone', 'email'])
            ->map(function($customer) {
                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'email' => $customer->email,
                ];
            });

        return response()->json($customers);
    }

    /**
     * Get order statistics
     */
    public function statistics(Request $request)
    {
        $storeId = $this->getStoreId();
        $period = $request->input('period', 'today');
        
        // Calculate date range
        $startDate = $this->getStartDate($period);
        $endDate = now();

        // Get orders in period
        $orders = RestaurantOrder::forStore($storeId)
            ->whereBetween('order_date', [$startDate->toDateString(), $endDate->toDateString()])
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

        return response()->json([
            'period' => $period,
            'startDate' => $startDate->toDateString(),
            'endDate' => $endDate->toDateString(),
            'summary' => [
                'totalOrders' => $totalOrders,
                'totalRevenue' => $totalRevenue,
                'averageOrderValue' => $averageOrderValue,
            ],
            'ordersByType' => $ordersByType,
            'ordersByStatus' => $ordersByStatus,
        ]);
    }

    /**
     * Get store ID from request or authenticated user
     */
    private function getStoreId()
    {
        return request('store_id') 
            ?? session('store_id') 
            ?? (Auth::user() ? Auth::user()->store_id : 1);
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