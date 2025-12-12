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
        Schema::create('menu_modifier_group_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('modifier_group_id');
            $table->unsignedBigInteger('modifier_id');
            $table->decimal('price_adjustment', 10, 2)->default(0)->comment('Override default modifier price for this group');
            $table->integer('display_order')->default(0);
            $table->timestamps();
            
            $table->index('modifier_group_id');
            $table->index('modifier_id');
            $table->foreign('modifier_group_id')->references('id')->on('menu_modifier_groups')->onDelete('cascade');
            $table->foreign('modifier_id')->references('id')->on('menu_modifiers')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menu_modifier_group_items');
    }
};