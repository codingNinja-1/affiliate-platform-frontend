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
    Schema::create('transactions', function (Blueprint $table) {
        $table->id();
        $table->uuid('uuid')->unique();
        $table->string('transaction_ref')->unique();
        $table->foreignId('product_id')->constrained()->onDelete('cascade');
        $table->foreignId('customer_id')->constrained('users')->onDelete('cascade');
        $table->foreignId('affiliate_id')->nullable()->constrained('affiliates');
        $table->foreignId('vendor_id')->constrained('vendors');
        $table->decimal('amount', 15, 2);
        $table->decimal('commission_amount', 15, 2)->default(0);
        $table->decimal('vendor_amount', 15, 2)->default(0);
        $table->string('currency')->default('NGN');
        $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'refunded', 'settled'])->default('pending');
        $table->enum('payment_method', ['stripe', 'paystack', 'bank_transfer', 'wallet', 'credit_card', 'debit_card'])->nullable();
        $table->string('payment_reference')->nullable();
        $table->json('payment_meta')->nullable();
        $table->timestamp('paid_at')->nullable();
        $table->timestamp('settled_at')->nullable();
        $table->string('customer_email');
        $table->string('customer_phone')->nullable();
        $table->json('customer_meta')->nullable();
        $table->text('notes')->nullable();
        $table->timestamps();

        $table->index(['status', 'created_at']);
        $table->index(['affiliate_id', 'status']);
        $table->index(['vendor_id', 'status']);
        $table->index('transaction_ref');
    });
}

public function down(): void
{
    Schema::dropIfExists('transactions');
}
};
