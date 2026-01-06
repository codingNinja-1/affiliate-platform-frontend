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
            // Vendor sales and delivery configuration
            $table->string('delivery_link')->nullable()->after('sales_page_url');
            $table->json('buy_now_config')->nullable()->after('delivery_link'); // Stores button text, color, redirect, etc.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['delivery_link', 'buy_now_config']);
        });
    }
};
