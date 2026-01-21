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
        Schema::create('currency_rates', function (Blueprint $table) {
            $table->id();
            $table->string('from_currency', 3); // e.g., USD
            $table->string('to_currency', 3); // e.g., NGN
            $table->decimal('rate', 15, 6); // Exchange rate with high precision
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->timestamps();

            // Unique constraint to prevent duplicate currency pairs
            $table->unique(['from_currency', 'to_currency']);

            // Indexes for faster lookups
            $table->index(['from_currency', 'to_currency', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('currency_rates');
    }
};
