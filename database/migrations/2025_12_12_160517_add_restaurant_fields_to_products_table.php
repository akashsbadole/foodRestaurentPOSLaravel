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
        Schema::table('products', function (Blueprint $table) {
            $table->enum('product_category', ['food', 'beverage', 'merchandise', 'service'])->default('food')->after('product_type');
            $table->integer('preparation_time')->default(0)->comment('Standard preparation time in minutes')->after('alert_quantity');
            $table->boolean('is_kitchen_item')->default(true)->comment('Whether this item requires kitchen preparation')->after('preparation_time');
            $table->json('allergen_info')->nullable()->comment('Allergen information')->after('meta_data');
            $table->json('nutritional_info')->nullable()->comment('Nutritional information')->after('allergen_info');
            $table->enum('spice_level', ['none', 'mild', 'medium', 'hot', 'extra_hot'])->default('none')->after('nutritional_info');
            $table->boolean('is_available')->default(true)->comment('Item availability for restaurant')->after('is_active');
            
            $table->index('product_category');
            $table->index('is_kitchen_item');
            $table->index('is_available');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['product_category']);
            $table->dropIndex(['is_kitchen_item']);
            $table->dropIndex(['is_available']);
            $table->dropColumn(['product_category', 'preparation_time', 'is_kitchen_item', 'allergen_info', 'nutritional_info', 'spice_level', 'is_available']);
        });
    }
};