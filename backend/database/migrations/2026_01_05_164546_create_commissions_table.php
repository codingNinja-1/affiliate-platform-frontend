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
    Schema::create('commissions', function (Blueprint $table) {
        $table->id();
        $table->uuid('uuid')->unique();
        $table->foreignId('transaction_id')->constrained()->onDelete('cascade');
        $table->foreignId('product_id')->constrained();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->enum('user_type', ['vendor', 'affiliate']);
        $table->decimal('amount', 15, 2);
        $table->decimal('rate', 5, 2);
        $table->string('currency')->default('NGN');
        $table->enum('status', ['pending', 'approved', 'paid', 'cancelled'])->default('pending');
        $table->timestamp('approved_at')->nullable();
        $table->timestamp('paid_at')->nullable();
        $table->foreignId('withdrawal_id')->nullable()->constrained();
        $table->text('notes')->nullable();
        $table->timestamps();

        $table->index(['user_id', 'status']);
        $table->index(['transaction_id', 'user_type']);
        $table->index('status');
    });
}

public function down(): void
{
    Schema::dropIfExists('commissions');
}
};
