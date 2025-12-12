<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;
use Rappasoft\LaravelAuthenticationLog\Traits\AuthenticationLoggable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, AuthenticationLoggable, HasRoles;
    use SoftDeletes;
    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'user_name',
        'user_role',
        'is_active',
        'store_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    const ROLE_ADMIN = 'admin';
    const ROLE_USER = 'user';

    // Restaurant-specific relationships
    public function kitchenStation()
    {
        return $this->belongsTo(\App\Models\Restaurant\KitchenStation::class, 'kitchen_station_id');
    }

    public function waiterOrders()
    {
        return $this->hasMany(\App\Models\Restaurant\RestaurantOrder::class, 'waiter_id');
    }

    public function createdReservations()
    {
        return $this->hasMany(\App\Models\Restaurant\TableReservation::class, 'created_by');
    }

    public function servedItems()
    {
        return $this->hasMany(SaleItem::class, 'served_by');
    }

    // Restaurant-specific scopes
    public function scopeWaiters($query)
    {
        return $query->where('employee_role', 'waiter');
    }

    public function scopeKitchenStaff($query)
    {
        return $query->where('employee_role', 'kitchen');
    }

    public function scopeHosts($query)
    {
        return $query->where('employee_role', 'host');
    }

    // Restaurant-specific methods
    public function isWaiter()
    {
        return $this->employee_role === 'waiter';
    }

    public function isKitchenStaff()
    {
        return $this->employee_role === 'kitchen';
    }

    public function isHost()
    {
        return $this->employee_role === 'host';
    }

    public function canTakeOrders()
    {
        return $this->can_take_orders ?? false;
    }

    public function canProcessPayments()
    {
        return $this->can_process_payments ?? false;
    }

    public function canManageTables()
    {
        return $this->can_manage_tables ?? false;
    }
}
