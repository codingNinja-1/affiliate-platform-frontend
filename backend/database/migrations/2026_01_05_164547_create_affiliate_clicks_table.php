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
    Schema::create('affiliate_clicks', function (Blueprint $table) {
        $table->id();
        $table->foreignId('affiliate_id')->constrained()->onDelete('cascade');
        $table->foreignId('product_id')->constrained()->onDelete('cascade');
        $table->string('ip_address');
        $table->string('user_agent')->nullable();
        $table->string('referrer')->nullable();
        $table->string('device_type')->nullable();
        $table->string('browser')->nullable();
        $table->string('os')->nullable();
        $table->string('country')->nullable();
        $table->string('city')->nullable();
        $table->boolean('converted')->default(false);
        $table->foreignId('transaction_id')->nullable()->constrained();
        $table->timestamps();

        $table->index(['affiliate_id', 'product_id', 'created_at']);
        $table->index('ip_address');
    });
}

public function down(): void
{
    Schema::dropIfExists('affiliate_clicks');
}
};
