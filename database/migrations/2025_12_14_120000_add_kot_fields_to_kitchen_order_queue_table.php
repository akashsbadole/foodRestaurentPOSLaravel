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
        Schema::table('kitchen_order_queue', function (Blueprint $table) {
            $table->string('kot_number')->nullable()->after('id')->comment('Unique KOT identifier');
            $table->timestamp('printed_at')->nullable()->after('completed_at')->comment('When KOT was printed');
            $table->boolean('stock_verified')->default(false)->after('notes')->comment('Whether stock has been verified');
            $table->timestamp('stock_verified_at')->nullable()->after('stock_verified')->comment('When stock was verified');
            $table->unsignedBigInteger('stock_verified_by')->nullable()->after('stock_verified_at')->comment('Who verified the stock');
            
            $table->index('kot_number');
            $table->index('printed_at');
            $table->index('stock_verified');
            $table->foreign('stock_verified_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kitchen_order_queue', function (Blueprint $table) {
            $table->dropIndex(['kot_number']);
            $table->dropIndex(['printed_at']);
            $table->dropIndex(['stock_verified']);
            $table->dropForeign(['stock_verified_by']);
            
            $table->dropColumn([
                'kot_number',
                'printed_at',
                'stock_verified',
                'stock_verified_at',
                'stock_verified_by'
            ]);
        });
    }
};