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
        Schema::create('restaurant_tables', function (Blueprint $table) {
            $table->id();
            $table->string('table_number')->unique();
            $table->string('name');
            $table->integer('capacity')->default(4);
            $table->unsignedBigInteger('section_id')->nullable();
            $table->enum('shape', ['rectangle', 'circle', 'square', 'oval'])->default('rectangle');
            $table->decimal('position_x', 8, 2)->default(0)->comment('X position for floor plan');
            $table->decimal('position_y', 8, 2)->default(0)->comment('Y position for floor plan');
            $table->decimal('width', 8, 2)->default(100)->comment('Width for floor plan');
            $table->decimal('height', 8, 2)->default(100)->comment('Height for floor plan');
            $table->enum('status', ['available', 'occupied', 'reserved', 'cleaning', 'maintenance'])->default('available');
            $table->unsignedBigInteger('current_order_id')->nullable()->comment('Currently active order');
            $table->datetime('reserved_until')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('store_id');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('status');
            $table->index('section_id');
            $table->index('store_id');
            $table->foreign('section_id')->references('id')->on('table_sections')->onDelete('set null');
            $table->foreign('store_id')->references('id')->on('stores')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('restaurant_tables');
    }
};