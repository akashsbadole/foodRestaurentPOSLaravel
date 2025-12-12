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
        Schema::table('sale_items', function (Blueprint $table) {
            $table->unsignedBigInteger('restaurant_order_item_id')->nullable()->comment('Link to restaurant_order_items table')->after('id');
            $table->integer('course_number')->default(1)->after('quantity');
            $table->text('special_instructions')->nullable()->after('description');
            $table->text('preparation_notes')->nullable()->after('special_instructions');
            $table->unsignedBigInteger('served_by')->nullable()->after('created_by');
            $table->datetime('served_at')->nullable()->after('served_by');
            
            $table->index('restaurant_order_item_id');
            $table->foreign('restaurant_order_item_id')->references('id')->on('restaurant_order_items')->onDelete('set null');
            $table->foreign('served_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropForeign(['restaurant_order_item_id']);
            $table->dropForeign(['served_by']);
            $table->dropIndex(['restaurant_order_item_id']);
            $table->dropColumn(['restaurant_order_item_id', 'course_number', 'special_instructions', 'preparation_notes', 'served_by', 'served_at']);
        });
    }
};