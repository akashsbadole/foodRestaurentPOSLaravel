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
        Schema::create('restaurant_payments', function (Blueprint $table) {
            $table->id();
            
            // Payment reference
            $table->string('payment_number')->unique();
            $table->foreignId('restaurant_order_id')->constrained('restaurant_orders')->onDelete('cascade');
            $table->foreignId('sale_id')->nullable()->constrained('sales')->onDelete('set null');
            $table->foreignId('store_id')->constrained('stores')->onDelete('cascade');
            $table->foreignId('customer_id')->nullable()->constrained('contacts')->onDelete('set null');
            
            // Payment details
            $table->string('payment_method'); // cash, card, digital_wallet, etc.
            $table->string('payment_type')->default('full'); // full, partial, split
            $table->decimal('amount', 10, 2);
            $table->decimal('tip_amount', 10, 2)->default(0);
            $table->decimal('processing_fee', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2); // amount + tip + processing_fee
            
            // Payment method specific details
            $table->json('payment_details')->nullable(); // Card details, wallet info, etc.
            $table->string('gateway_transaction_id')->nullable(); // External gateway transaction ID
            $table->string('gateway_reference')->nullable(); // External gateway reference
            $table->string('authorization_code')->nullable(); // Card authorization code
            
            // Status and timestamps
            $table->string('status')->default('pending'); // pending, processing, completed, failed, refunded, voided
            $table->string('failure_reason')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamp('voided_at')->nullable();
            
            // Refund details
            $table->decimal('refunded_amount', 10, 2)->default(0);
            $table->string('refund_reason')->nullable();
            $table->string('refund_transaction_id')->nullable();
            
            // Split payment details
            $table->integer('split_number')->nullable();
            $table->integer('total_splits')->nullable();
            $table->json('split_allocation')->nullable(); // How this payment is allocated
            
            // Metadata
            $table->json('metadata')->nullable(); // Additional payment metadata
            $table->text('notes')->nullable();
            
            // User tracking
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('processed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('refunded_by')->nullable()->constrained('users')->onDelete('set null');
            
            // Timestamps
            $table->timestamps();
            
            // Indexes
            $table->index(['restaurant_order_id']);
            $table->index(['sale_id']);
            $table->index(['store_id']);
            $table->index(['payment_method']);
            $table->index(['status']);
            $table->index(['processed_at']);
            $table->index(['payment_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('restaurant_payments');
    }
};