<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('order_modifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained('restaurant_orders')->onDelete('cascade');
            $table->foreignId('order_item_id')->nullable()->constrained('restaurant_order_items')->onDelete('cascade');
            $table->string('modification_type', 50);
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->text('reason')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('store_id')->nullable()->constrained('stores')->onDelete('set null');
            $table->timestamp('modification_time');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            
            $table->index(['order_id', 'modification_time']);
            $table->index(['order_item_id', 'modification_time']);
            $table->index(['modification_type', 'modification_time']);
            $table->index(['user_id', 'modification_time']);
            $table->index(['store_id', 'modification_time']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('order_modifications');
    }
};