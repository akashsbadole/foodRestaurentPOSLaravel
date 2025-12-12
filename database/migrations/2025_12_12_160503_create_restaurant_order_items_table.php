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
        Schema::create('restaurant_order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('batch_id')->nullable();
            $table->decimal('quantity', 10, 2)->default(1);
            $table->decimal('unit_price', 10, 2);
            $table->decimal('unit_cost', 10, 2)->nullable();
            $table->decimal('discount', 10, 2)->default(0);
            $table->enum('status', ['pending', 'confirmed', 'preparing', 'ready', 'served', 'cancelled'])->default('pending');
            $table->text('special_instructions')->nullable();
            $table->text('preparation_notes')->nullable()->comment('Notes for kitchen staff');
            $table->integer('course_number')->default(1)->comment('Course sequence for multi-course meals');
            $table->boolean('is_complimentary')->default(false);
            $table->text('void_reason')->nullable();
            $table->boolean('kitchen_printed')->default(false);
            $table->datetime('kitchen_printed_at')->nullable();
            $table->unsignedBigInteger('served_by')->nullable()->comment('Staff who served this item');
            $table->datetime('served_at')->nullable();
            $table->timestamps();
            
            $table->index('order_id');
            $table->index('product_id');
            $table->index('status');
            $table->foreign('order_id')->references('id')->on('restaurant_orders')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->foreign('batch_id')->references('id')->on('product_batches')->onDelete('set null');
            $table->foreign('served_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('restaurant_order_items');
    }
};