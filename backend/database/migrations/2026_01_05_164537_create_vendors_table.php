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
    Schema::create('vendors', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->string('business_name');
        $table->text('business_description')->nullable();
        $table->string('business_address')->nullable();
        $table->string('bank_name')->nullable();
        $table->string('account_name')->nullable();
        $table->string('account_number')->nullable();
        $table->string('bank_code')->nullable();
        $table->decimal('balance', 15, 2)->default(0);
        $table->decimal('total_earnings', 15, 2)->default(0);
        $table->decimal('total_withdrawn', 15, 2)->default(0);
        $table->integer('total_products')->default(0);
        $table->integer('total_sales')->default(0);
        $table->foreignId('country_id')->nullable()->constrained();
        $table->json('settings')->nullable();
        $table->timestamps();

        $table->index('user_id');
    });
}

public function down(): void
{
    Schema::dropIfExists('vendors');
}

};
