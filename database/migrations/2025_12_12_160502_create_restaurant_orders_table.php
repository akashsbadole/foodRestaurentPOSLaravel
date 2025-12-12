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
        Schema::create('restaurant_orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('sale_id')->nullable()->comment('Link to sales table when order is paid');
            $table->unsignedBigInteger('table_id');
            $table->string('order_number')->unique();
            $table->enum('order_type', ['dine_in', 'takeaway', 'delivery'])->default('dine_in');
            $table->integer('customer_count')->default(1);
            $table->unsignedBigInteger('waiter_id')->nullable()->comment('Assigned waiter/staff');
            $table->enum('status', ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'])->default('pending');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->text('special_instructions')->nullable();
            $table->integer('estimated_time')->nullable()->comment('Estimated preparation time in minutes');
            $table->integer('actual_time')->nullable()->comment('Actual preparation time in minutes');
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('service_charge', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->date('order_date');
            $table->time('order_time');
            $table->datetime('completed_at')->nullable();
            $table->unsignedBigInteger('store_id');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('table_id');
            $table->index('status');
            $table->index('order_type');
            $table->index('order_date');
            $table->index('store_id');
            $table->foreign('sale_id')->references('id')->on('sales')->onDelete('set null');
            $table->foreign('table_id')->references('id')->on('restaurant_tables')->onDelete('cascade');
            $table->foreign('waiter_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('store_id')->references('id')->on('stores')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('restaurant_orders');
    }
};