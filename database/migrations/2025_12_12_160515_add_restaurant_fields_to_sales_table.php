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
        Schema::table('sales', function (Blueprint $table) {
            $table->unsignedBigInteger('restaurant_order_id')->nullable()->comment('Link to restaurant_orders table')->after('id');
            $table->enum('order_type', ['retail', 'restaurant'])->default('retail')->after('sale_type');
            $table->decimal('tip_amount', 10, 2)->default(0)->after('total_amount');
            $table->enum('tip_method', ['cash', 'card', 'split'])->nullable()->after('tip_amount');
            $table->decimal('service_charge_amount', 10, 2)->default(0)->after('tip_amount');
            
            $table->index('restaurant_order_id');
            $table->index('order_type');
            $table->foreign('restaurant_order_id')->references('id')->on('restaurant_orders')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['restaurant_order_id']);
            $table->dropIndex(['restaurant_order_id']);
            $table->dropIndex(['order_type']);
            $table->dropColumn(['restaurant_order_id', 'order_type', 'tip_amount', 'tip_method', 'service_charge_amount']);
        });
    }
};