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
        Schema::create('order_split_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('split_id');
            $table->unsignedBigInteger('order_item_id');
            $table->decimal('quantity', 10, 2);
            $table->timestamps();
            
            $table->index('split_id');
            $table->index('order_item_id');
            $table->foreign('split_id')->references('id')->on('order_splits')->onDelete('cascade');
            $table->foreign('order_item_id')->references('id')->on('restaurant_order_items')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_split_items');
    }
};