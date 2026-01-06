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
    Schema::create('withdrawals', function (Blueprint $table) {
        $table->id();
        $table->uuid('uuid')->unique();
        $table->string('withdrawal_ref')->unique();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->enum('user_type', ['vendor', 'affiliate']);
        $table->decimal('amount', 15, 2);
        $table->string('currency')->default('NGN');
        $table->string('bank_name');
        $table->string('account_name');
        $table->string('account_number');
        $table->string('bank_code')->nullable();
        $table->enum('status', ['pending', 'processing', 'approved', 'rejected', 'paid'])->default('pending');
        $table->text('rejection_reason')->nullable();
        $table->timestamp('approved_at')->nullable();
        $table->foreignId('approved_by')->nullable()->constrained('users');
        $table->timestamp('paid_at')->nullable();
        $table->string('payment_reference')->nullable();
        $table->json('payment_meta')->nullable();
        $table->text('notes')->nullable();
        $table->timestamps();

        $table->index(['user_id', 'status']);
        $table->index('status');
        $table->index('withdrawal_ref');
    });
}

public function down(): void
{
    Schema::dropIfExists('withdrawals');
}

};
