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
        Schema::create('restaurant_order_item_modifiers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_item_id');
            $table->unsignedBigInteger('modifier_id');
            $table->decimal('quantity', 10, 2)->default(1);
            $table->decimal('price_adjustment', 10, 2)->default(0);
            $table->timestamps();
            
            $table->index('order_item_id');
            $table->index('modifier_id');
            $table->foreign('order_item_id')->references('id')->on('restaurant_order_items')->onDelete('cascade');
            $table->foreign('modifier_id')->references('id')->on('menu_modifiers')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('restaurant_order_item_modifiers');
    }
};