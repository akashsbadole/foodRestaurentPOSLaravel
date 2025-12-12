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
        Schema::create('kitchen_order_queue', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_item_id');
            $table->unsignedBigInteger('station_id');
            $table->enum('status', ['queued', 'in_progress', 'ready', 'completed', 'cancelled'])->default('queued');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal');
            $table->integer('estimated_time')->nullable()->comment('Estimated completion time in minutes');
            $table->datetime('started_at')->nullable();
            $table->datetime('completed_at')->nullable();
            $table->unsignedBigInteger('completed_by')->nullable()->comment('Kitchen staff who completed');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->index('station_id');
            $table->index('status');
            $table->index('priority');
            $table->foreign('order_item_id')->references('id')->on('restaurant_order_items')->onDelete('cascade');
            $table->foreign('station_id')->references('id')->on('kitchen_stations')->onDelete('cascade');
            $table->foreign('completed_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kitchen_order_queue');
    }
};