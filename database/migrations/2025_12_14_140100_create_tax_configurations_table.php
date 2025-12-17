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
        Schema::create('tax_configurations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->onDelete('cascade');
            $table->string('tax_code', 20);
            $table->string('tax_name', 100);
            $table->decimal('rate', 8, 4); // Tax rate as decimal (e.g., 0.0800 for 8%)
            $table->string('tax_type', 20); // vat, service_tax, sales_tax, etc.
            $table->boolean('is_compound')->default(false); // Whether this tax is applied on top of other taxes
            $table->json('compound_tax_codes')->nullable(); // Tax codes this tax compounds with
            $table->boolean('is_active')->default(true);
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            
            // Tax applicability rules
            $table->json('applicable_categories')->nullable(); // Product category IDs this tax applies to
            $table->json('exempt_categories')->nullable(); // Product category IDs exempt from this tax
            $table->json('applicable_products')->nullable(); // Specific product IDs this tax applies to
            $table->json('exempt_products')->nullable(); // Specific product IDs exempt from this tax
            
            // Location-based rules
            $table->json('applicable_locations')->nullable(); // Location codes where this tax applies
            $table->boolean('is_default')->default(false); // Whether this is the default tax for the store
            
            // Reporting and compliance
            $table->string('reporting_category', 50)->nullable(); // For tax reporting purposes
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->unique(['store_id', 'tax_code', 'effective_from']);
            $table->index(['store_id', 'tax_type']);
            $table->index(['store_id', 'is_active']);
            $table->index(['effective_from', 'effective_to']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('tax_configurations');
    }
};