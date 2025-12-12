<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('employee_role', ['manager', 'waiter', 'kitchen', 'host', 'cashier', 'bartender'])->nullable()->after('user_role');
            $table->boolean('can_take_orders')->default(false)->after('is_active');
            $table->boolean('can_process_payments')->default(false)->after('can_take_orders');
            $table->boolean('can_manage_tables')->default(false)->after('can_process_payments');
            $table->unsignedBigInteger('kitchen_station_id')->nullable()->after('can_manage_tables');
            
            $table->index('employee_role');
            $table->foreign('kitchen_station_id')->references('id')->on('kitchen_stations')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['kitchen_station_id']);
            $table->dropIndex(['employee_role']);
            $table->dropColumn(['employee_role', 'can_take_orders', 'can_process_payments', 'can_manage_tables', 'kitchen_station_id']);
        });
    }
};