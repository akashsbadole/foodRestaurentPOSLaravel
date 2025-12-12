<?php

namespace App\Http\Controllers;

use App\Models\Restaurant\TableReservation;
use App\Models\Restaurant\RestaurantTable;
use App\Models\Contact;
use App\Models\Store;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;

class ReservationController extends Controller
{
    /**
     * Display reservations page
     */
    public function index()
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $currentStore = Store::find($storeId);

        if (!$currentStore) {
            return redirect()->route('store');
        }

        $date = request('date', now()->toDateString());
        
        $reservations = TableReservation::with(['table', 'contact'])
            ->forDate($date)
            ->orderBy('reservation_time')
            ->get();

        $tables = RestaurantTable::forStore($storeId)
            ->with(['section'])
            ->orderBy('table_number')
            ->get();

        return Inertia::render('Restaurant/Reservations/Index', [
            'currentStore' => $currentStore,
            'reservations' => $reservations,
            'tables' => $tables,
            'selectedDate' => $date,
        ]);
    }

    /**
     * Display reservation creation form
     */
    public function create()
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $currentStore = Store::find($storeId);

        if (!$currentStore) {
            return redirect()->route('store');
        }

        $tables = RestaurantTable::forStore($storeId)
            ->with(['section'])
            ->orderBy('table_number')
            ->get();

        $customers = Contact::customers()
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'email']);

        return Inertia::render('Restaurant/Reservations/Create', [
            'currentStore' => $currentStore,
            'tables' => $tables,
            'customers' => $customers,
        ]);
    }

    /**
     * Store a new reservation
     */
    public function store(Request $request)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $validator = Validator::make($request->all(), [
            'table_id' => 'required|exists:restaurant_tables,id',
            'contact_id' => 'nullable|exists:contacts,id',
            'customer_name' => 'required_without:contact_id|string|max:100',
            'customer_phone' => 'required_without:contact_id|string|max:20',
            'reservation_date' => 'required|date|after_or_equal:today',
            'reservation_time' => 'required|date_format:H:i',
            'duration_minutes' => 'required|integer|min:15|max:480',
            'party_size' => 'required|integer|min:1|max:50',
            'special_requests' => 'nullable|string|max:500',
            'deposit_amount' => 'nullable|numeric|min:0',
            'deposit_paid' => 'nullable|boolean',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }

        try {
            // Check if table exists and belongs to store
            $table = RestaurantTable::forStore($storeId)->findOrFail($request->input('table_id'));

            // Check if table can accommodate party size
            if ($table->capacity < $request->input('party_size')) {
                return response()->json([
                    'message' => 'Table capacity insufficient',
                    'error' => 'Party size exceeds table capacity'
                ], 422);
            }

            // Check for time conflicts
            $reservationDateTime = Carbon::parse($request->input('reservation_date') . ' ' . $request->input('reservation_time'));
            $duration = $request->input('duration_minutes');

            $conflicts = TableReservation::where('table_id', $table->id)
                ->whereDate('reservation_date', $request->input('reservation_date'))
                ->whereIn('status', ['confirmed', 'seated'])
                ->get()
                ->filter(function($reservation) use ($reservationDateTime, $duration) {
                    return $reservation->conflictsWith($reservationDateTime, $duration);
                });

            if ($conflicts->isNotEmpty()) {
                return response()->json([
                    'message' => 'Time slot not available',
                    'error' => 'Table is already reserved for this time'
                ], 422);
            }

            // Get customer information
            $customerName = $request->input('customer_name');
            $customerPhone = $request->input('customer_phone');
            
            if ($request->input('contact_id')) {
                $contact = Contact::find($request->input('contact_id'));
                if ($contact) {
                    $customerName = $contact->name;
                    $customerPhone = $contact->phone;
                }
            }

            $reservation = TableReservation::create([
                'table_id' => $table->id,
                'contact_id' => $request->input('contact_id'),
                'customer_name' => $customerName,
                'customer_phone' => $customerPhone,
                'reservation_date' => $request->input('reservation_date'),
                'reservation_time' => $reservationDateTime,
                'duration_minutes' => $duration,
                'party_size' => $request->input('party_size'),
                'status' => 'confirmed',
                'special_requests' => $request->input('special_requests'),
                'deposit_amount' => $request->input('deposit_amount', 0),
                'deposit_paid' => $request->input('deposit_paid', false),
                'notes' => $request->input('notes'),
                'created_by' => Auth::id(),
            ]);

            // Update table reservation status
            $table->reserved_until = $reservationDateTime->copy()->addMinutes($duration);
            $table->save();

            return response()->json([
                'message' => 'Reservation created successfully',
                'reservation' => $reservation->load('table', 'contact')
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to create reservation', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'message' => 'Failed to create reservation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display reservation editing form
     */
    public function edit($id)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $currentStore = Store::find($storeId);

        if (!$currentStore) {
            return redirect()->route('store');
        }

        $reservation = TableReservation::with(['table', 'contact'])
            ->findOrFail($id);

        $tables = RestaurantTable::forStore($storeId)
            ->with(['section'])
            ->orderBy('table_number')
            ->get();

        $customers = Contact::customers()
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'email']);

        return Inertia::render('Restaurant/Reservations/Edit', [
            'currentStore' => $currentStore,
            'reservation' => $reservation,
            'tables' => $tables,
            'customers' => $customers,
        ]);
    }

    /**
     * Update reservation
     */
    public function update(Request $request, $id)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);

        $reservation = TableReservation::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'table_id' => 'required|exists:restaurant_tables,id',
            'contact_id' => 'nullable|exists:contacts,id',
            'customer_name' => 'required_without:contact_id|string|max:100',
            'customer_phone' => 'required_without:contact_id|string|max:20',
            'reservation_date' => 'required|date|after_or_equal:today',
            'reservation_time' => 'required|date_format:H:i',
            'duration_minutes' => 'required|integer|min:15|max:480',
            'party_size' => 'required|integer|min:1|max:50',
            'special_requests' => 'nullable|string|max:500',
            'deposit_amount' => 'nullable|numeric|min:0',
            'deposit_paid' => 'nullable|boolean',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }

        try {
            // Check if table exists and belongs to store
            $table = RestaurantTable::forStore($storeId)->findOrFail($request->input('table_id'));

            // Check if table can accommodate party size
            if ($table->capacity < $request->input('party_size')) {
                return response()->json([
                    'message' => 'Table capacity insufficient',
                    'error' => 'Party size exceeds table capacity'
                ], 422);
            }

            // Check for time conflicts (excluding current reservation)
            $reservationDateTime = Carbon::parse($request->input('reservation_date') . ' ' . $request->input('reservation_time'));
            $duration = $request->input('duration_minutes');

            $conflicts = TableReservation::where('table_id', $table->id)
                ->where('id', '!=', $id)
                ->whereDate('reservation_date', $request->input('reservation_date'))
                ->whereIn('status', ['confirmed', 'seated'])
                ->get()
                ->filter(function($res) use ($reservationDateTime, $duration) {
                    return $res->conflictsWith($reservationDateTime, $duration);
                });

            if ($conflicts->isNotEmpty()) {
                return response()->json([
                    'message' => 'Time slot not available',
                    'error' => 'Table is already reserved for this time'
                ], 422);
            }

            // Get customer information
            $customerName = $request->input('customer_name');
            $customerPhone = $request->input('customer_phone');
            
            if ($request->input('contact_id')) {
                $contact = Contact::find($request->input('contact_id'));
                if ($contact) {
                    $customerName = $contact->name;
                    $customerPhone = $contact->phone;
                }
            }

            $reservation->update([
                'table_id' => $table->id,
                'contact_id' => $request->input('contact_id'),
                'customer_name' => $customerName,
                'customer_phone' => $customerPhone,
                'reservation_date' => $request->input('reservation_date'),
                'reservation_time' => $reservationDateTime,
                'duration_minutes' => $duration,
                'party_size' => $request->input('party_size'),
                'special_requests' => $request->input('special_requests'),
                'deposit_amount' => $request->input('deposit_amount', 0),
                'deposit_paid' => $request->input('deposit_paid', false),
                'notes' => $request->input('notes'),
            ]);

            // Update table reservation status
            $table->reserved_until = $reservationDateTime->copy()->addMinutes($duration);
            $table->save();

            return response()->json([
                'message' => 'Reservation updated successfully',
                'reservation' => $reservation->load('table', 'contact')
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update reservation', [
                'error' => $e->getMessage(),
                'reservation_id' => $id,
                'request' => $request->all()
            ]);

            return response()->json([
                'message' => 'Failed to update reservation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete reservation
     */
    public function destroy($id)
    {
        $reservation = TableReservation::findOrFail($id);

        try {
            $reservation->delete();

            return response()->json([
                'message' => 'Reservation deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete reservation', [
                'error' => $e->getMessage(),
                'reservation_id' => $id
            ]);

            return response()->json([
                'message' => 'Failed to delete reservation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update reservation status
     */
    public function updateStatus(Request $request, $id)
    {
        $reservation = TableReservation::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:confirmed,seated,completed,cancelled,no_show',
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
            if (!$this->isValidStatusTransition($reservation->status, $newStatus)) {
                return response()->json([
                    'message' => 'Invalid status transition',
                    'error' => "Cannot change status from {$reservation->status} to {$newStatus}"
                ], 422);
            }

            // Handle specific status changes
            switch ($newStatus) {
                case 'seated':
                    $reservation->markAsSeated();
                    break;
                case 'completed':
                    $reservation->markAsCompleted();
                    break;
                case 'cancelled':
                    $reservation->markAsCancelled();
                    break;
                case 'no_show':
                    $reservation->markAsNoShow();
                    break;
                default:
                    $reservation->status = $newStatus;
                    $reservation->save();
            }

            if ($request->has('notes')) {
                $reservation->notes = $request->input('notes');
                $reservation->save();
            }

            return response()->json([
                'message' => 'Reservation status updated successfully',
                'reservation' => $reservation->load('table', 'contact')
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update reservation status', [
                'error' => $e->getMessage(),
                'reservation_id' => $id,
                'request' => $request->all()
            ]);

            return response()->json([
                'message' => 'Failed to update reservation status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available time slots for a table
     */
    public function getAvailableSlots(Request $request)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        
        $validator = Validator::make($request->all(), [
            'table_id' => 'required|exists:restaurant_tables,id',
            'date' => 'required|date|after_or_equal:today',
            'duration' => 'nullable|integer|min:15|max:480',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
                'message' => 'Validation failed'
            ], 422);
        }

        try {
            $table = RestaurantTable::forStore($storeId)->findOrFail($request->input('table_id'));
            $date = $request->input('date');
            $duration = $request->input('duration', 120); // Default 2 hours

            // Get existing reservations for the table on the selected date
            $reservations = TableReservation::where('table_id', $table->id)
                ->whereDate('reservation_date', $date)
                ->whereIn('status', ['confirmed', 'seated'])
                ->orderBy('reservation_time')
                ->get();

            // Generate available time slots
            $availableSlots = $this->generateAvailableSlots($reservations, $date, $duration);

            return response()->json([
                'table' => $table,
                'date' => $date,
                'duration' => $duration,
                'available_slots' => $availableSlots,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get available slots', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'message' => 'Failed to get available slots',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get upcoming reservations
     */
    public function getUpcoming(Request $request)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $days = $request->input('days', 7); // Default next 7 days

        $reservations = TableReservation::with(['table', 'contact'])
            ->whereDate('reservation_date', '>=', today())
            ->whereDate('reservation_date', '<=', now()->addDays($days))
            ->whereIn('status', ['confirmed'])
            ->orderBy('reservation_date')
            ->orderBy('reservation_time')
            ->get()
            ->groupBy(function($reservation) {
                return $reservation->reservation_date->format('Y-m-d');
            });

        return response()->json($reservations);
    }

    /**
     * Get reservation statistics
     */
    public function getStatistics(Request $request)
    {
        $storeId = session('store_id', Auth::user()->store_id ?? 1);
        $period = $request->input('period', 'month');
        
        // Calculate date range
        $startDate = $this->getStartDate($period);
        $endDate = now();

        $reservations = TableReservation::whereHas('table', function($query) use ($storeId) {
            $query->where('store_id', $storeId);
        })
        ->whereBetween('reservation_date', [$startDate->toDateString(), $endDate->toDateString()])
        ->get();

        // Calculate statistics
        $totalReservations = $reservations->count();
        $confirmedReservations = $reservations->where('status', 'confirmed')->count();
        $seatedReservations = $reservations->where('status', 'seated')->count();
        $completedReservations = $reservations->where('status', 'completed')->count();
        $cancelledReservations = $reservations->where('status', 'cancelled')->count();
        $noShowReservations = $reservations->where('status', 'no_show')->count();
        $totalDepositAmount = $reservations->sum('deposit_amount');

        // Reservations by date
        $reservationsByDate = $reservations->groupBy(function($reservation) {
            return $reservation->reservation_date->format('Y-m-d');
        })->map(function($group) {
            return [
                'total' => $group->count(),
                'seated' => $group->where('status', 'seated')->count(),
                'cancelled' => $group->where('status', 'cancelled')->count(),
                'no_show' => $group->where('status', 'no_show')->count(),
            ];
        });

        // Reservations by table
        $reservationsByTable = $reservations->groupBy('table_id')->map(function($group) {
            $table = $group->first()->table;
            return [
                'table_id' => $table->id,
                'table_name' => $table->name ?: $table->table_number,
                'total_reservations' => $group->count(),
                'seated_reservations' => $group->where('status', 'seated')->count(),
                'occupancy_rate' => $group->count() > 0 ? ($group->where('status', 'seated')->count() / $group->count()) * 100 : 0,
            ];
        });

        // Peak hours
        $peakHours = $reservations->groupBy(function($reservation) {
            return $reservation->reservation_time->format('H:00');
        })->map(function($group) {
            return $group->count();
        })->sortDesc()->take(5);

        return response()->json([
            'period' => $period,
            'startDate' => $startDate->toDateString(),
            'endDate' => $endDate->toDateString(),
            'summary' => [
                'totalReservations' => $totalReservations,
                'confirmedReservations' => $confirmedReservations,
                'seatedReservations' => $seatedReservations,
                'completedReservations' => $completedReservations,
                'cancelledReservations' => $cancelledReservations,
                'noShowReservations' => $noShowReservations,
                'totalDepositAmount' => $totalDepositAmount,
                'showRate' => $totalReservations > 0 ? (($seatedReservations + $completedReservations) / $totalReservations) * 100 : 0,
                'cancellationRate' => $totalReservations > 0 ? ($cancelledReservations / $totalReservations) * 100 : 0,
            ],
            'reservationsByDate' => $reservationsByDate,
            'reservationsByTable' => $reservationsByTable,
            'peakHours' => $peakHours,
        ]);
    }

    /**
     * Validate status transitions
     */
    private function isValidStatusTransition($currentStatus, $newStatus)
    {
        $validTransitions = [
            'confirmed' => ['seated', 'cancelled', 'no_show'],
            'seated' => ['completed'],
            'completed' => [],
            'cancelled' => [],
            'no_show' => [],
        ];

        return in_array($newStatus, $validTransitions[$currentStatus] ?? []);
    }

    /**
     * Generate available time slots
     */
    private function generateAvailableSlots($reservations, $date, $duration)
    {
        $slots = [];
        $date = Carbon::parse($date);
        
        // Define operating hours (can be made configurable)
        $openingTime = $date->copy()->setTime(10, 0); // 10:00 AM
        $closingTime = $date->copy()->setTime(22, 0);  // 10:00 PM
        
        $currentTime = $openingTime->copy();
        
        while ($currentTime->copy()->addMinutes($duration) <= $closingTime) {
            $endTime = $currentTime->copy()->addMinutes($duration);
            $isAvailable = true;
            
            // Check against existing reservations
            foreach ($reservations as $reservation) {
                $reservationStart = $reservation->reservation_time;
                $reservationEnd = $reservation->getEndTime();
                
                if (!($endTime <= $reservationStart || $currentTime >= $reservationEnd)) {
                    $isAvailable = false;
                    break;
                }
            }
            
            if ($isAvailable) {
                $slots[] = [
                    'start_time' => $currentTime->format('H:i'),
                    'end_time' => $endTime->format('H:i'),
                    'available' => true,
                ];
            }
            
            // Move to next slot (30-minute intervals)
            $currentTime->addMinutes(30);
        }
        
        return $slots;
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
                return now()->startOfMonth();
        }
    }
}