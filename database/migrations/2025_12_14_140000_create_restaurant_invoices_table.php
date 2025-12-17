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
        Schema::create('restaurant_invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number', 50);
            $table->foreignId('order_id')->nullable()->constrained('restaurant_orders')->onDelete('cascade');
            $table->foreignId('sale_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('store_id')->constrained()->onDelete('cascade');
            $table->foreignId('customer_id')->nullable()->constrained('contacts')->onDelete('set null');
            
            $table->string('invoice_type', 20)->default('standard'); // standard, split, modified, cancelled
            $table->string('status', 20)->default('draft'); // draft, issued, paid, voided, refunded
            
            // Financial amounts
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->json('tax_breakdown')->nullable();
            $table->decimal('total_tax', 10, 2)->default(0);
            $table->json('service_charges')->nullable();
            $table->decimal('total_service_charges', 10, 2)->default(0);
            $table->json('discounts')->nullable();
            $table->decimal('total_discounts', 10, 2)->default(0);
            $table->decimal('rounding_adjustment', 10, 2)->default(0);
            $table->decimal('final_total', 10, 2)->default(0);
            $table->decimal('amount_paid', 10, 2)->default(0);
            $table->decimal('balance_due', 10, 2)->default(0);
            
            $table->string('currency', 3)->default('USD');
            $table->boolean('tax_inclusive')->default(false);
            
            // Dates
            $table->timestamp('issued_at')->nullable();
            $table->date('due_date')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('voided_at')->nullable();
            
            // Payment information
            $table->string('payment_method', 50)->nullable();
            $table->json('payment_details')->nullable();
            
            // Additional information
            $table->text('void_reason')->nullable();
            $table->json('billing_address')->nullable();
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index(['store_id', 'status']);
            $table->index(['order_id']);
            $table->index(['sale_id']);
            $table->index(['customer_id']);
            $table->index(['invoice_number']);
            $table->index(['issued_at']);
            $table->index(['due_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('restaurant_invoices');
    }
};