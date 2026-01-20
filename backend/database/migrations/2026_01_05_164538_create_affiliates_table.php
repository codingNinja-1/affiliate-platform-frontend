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
    Schema::create('affiliates', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->string('referral_code')->unique();
        $table->string('bank_name')->nullable();
        $table->string('account_name')->nullable();
        $table->string('account_number')->nullable();
        $table->string('bank_code')->nullable();
        $table->decimal('balance', 15, 2)->default(0);
        $table->decimal('total_earnings', 15, 2)->default(0);
        $table->decimal('total_withdrawn', 15, 2)->default(0);
        $table->integer('total_clicks')->default(0);
        $table->integer('total_sales')->default(0);
        $table->decimal('conversion_rate', 5, 2)->default(0);
        $table->enum('tier', ['bronze', 'silver', 'gold', 'platinum'])->default('bronze');
        $table->foreignId('referred_by')->nullable()->constrained('affiliates');
        $table->foreignId('country_id')->nullable()->constrained();
        $table->json('settings')->nullable();
        $table->timestamps();

        $table->index('user_id');
        $table->index('referral_code');
    });
}

public function down(): void
{
    Schema::dropIfExists('affiliates');
}
};
