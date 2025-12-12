<?php

namespace App\Models\Restaurant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\Userstamps;
use App\Models\Contact;
use App\Models\User;

class TableReservation extends Model
{
    use SoftDeletes, Userstamps;

    protected $table = 'table_reservations';

    protected $fillable = [
        'table_id',
        'contact_id',
        'customer_name',
        'customer_phone',
        'reservation_date',
        'reservation_time',
        'duration_minutes',
        'party_size',
        'status',
        'special_requests',
        'deposit_amount',
        'deposit_paid',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'reservation_date' => 'date',
        'reservation_time' => 'datetime',
        'deposit_amount' => 'decimal:2',
        'deposit_paid' => 'boolean',
    ];

    // Relationships
    public function table()
    {
        return $this->belongsTo(RestaurantTable::class, 'table_id');
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeForDate($query, $date)
    {
        return $query->whereDate('reservation_date', $date);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('reservation_date', '>=', today())
                    ->where('status', 'confirmed');
    }

    // Methods
    public function markAsSeated()
    {
        $this->status = 'seated';
        $this->save();
    }

    public function markAsCompleted()
    {
        $this->status = 'completed';
        $this->save();
    }

    public function markAsCancelled()
    {
        $this->status = 'cancelled';
        $this->save();
    }

    public function markAsNoShow()
    {
        $this->status = 'no_show';
        $this->save();
    }

    public function getEndTime()
    {
        return $this->reservation_time->copy()->addMinutes($this->duration_minutes);
    }

    public function conflictsWith($startTime, $duration)
    {
        $endTime = $startTime->copy()->addMinutes($duration);
        $reservationEnd = $this->getEndTime();

        return !($endTime <= $this->reservation_time || $startTime >= $reservationEnd);
    }
}