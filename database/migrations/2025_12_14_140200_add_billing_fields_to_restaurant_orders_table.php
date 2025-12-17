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
        Schema::table('restaurant_orders', function (Blueprint $table) {
            // Customer information
            $table->foreignId('customer_id')->nullable()->after('waiter_id')->constrained('contacts')->onDelete('set null');
            
            // Billing status and breakdowns
            $table->string('billing_status', 20)->default('pending')->after('status');
            $table->json('tax_breakdown')->nullable()->after('tax_amount');
            $table->json('discount_breakdown')->nullable()->after('discount_amount');
            $table->json('service_charge_breakdown')->nullable()->after('service_charge');
            
            // Final billing amounts
            $table->decimal('final_total', 10, 2)->default(0)->after('total_amount');
            $table->decimal('rounding_adjustment', 10, 2)->default(0)->after('final_total');
            
            // Payment status
            $table->string('payment_status', 20)->default('pending')->after('billing_status');
            
            // Additional billing information
            $table->text('billing_notes')->nullable()->after('special_instructions');
            
            // Indexes
            $table->index(['billing_status']);
            $table->index(['payment_status']);
            $table->index(['customer_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('restaurant_orders', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->dropColumn([
                'customer_id',
                'billing_status',
                'tax_breakdown',
                'discount_breakdown',
                'service_charge_breakdown',
                'final_total',
                'rounding_adjustment',
                'payment_status',
                'billing_notes',
            ]);
        });
    }
};