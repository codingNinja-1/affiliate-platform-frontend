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
    Schema::create('products', function (Blueprint $table) {
        $table->id();
        $table->uuid('uuid')->unique();
        $table->string('product_id')->unique();
        $table->foreignId('vendor_id')->constrained('vendors')->onDelete('cascade');
        $table->string('name');
        $table->string('slug')->unique();
        $table->text('description')->nullable();
        $table->longText('full_description')->nullable();
        $table->decimal('price', 15, 2);
        $table->decimal('commission_rate', 5, 2);
        $table->decimal('commission_amount', 15, 2);
        $table->string('currency')->default('NGN');
        $table->enum('type', ['digital', 'physical', 'service'])->default('digital');
        $table->string('sales_page_url')->nullable();
        $table->string('access_url')->nullable();
        $table->string('support_url')->nullable();
        $table->string('promo_materials_url')->nullable();
        $table->json('images')->nullable();
        $table->json('categories')->nullable();
        $table->json('tags')->nullable();
        $table->integer('stock_quantity')->nullable();
        $table->enum('stock_status', ['in_stock', 'out_of_stock', 'pre_order'])->default('in_stock');
        $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('pending');
        $table->text('rejection_reason')->nullable();
        $table->timestamp('approved_at')->nullable();
        $table->foreignId('approved_by')->nullable()->constrained('users');
        $table->integer('total_sales')->default(0);
        $table->decimal('total_revenue', 15, 2)->default(0);
        $table->integer('total_affiliates')->default(0);
        $table->boolean('is_featured')->default(false);
        $table->boolean('is_active')->default(true);
        $table->json('meta')->nullable();
        $table->timestamps();
        $table->softDeletes();

        $table->index(['vendor_id', 'approval_status']);
        $table->index('slug');
        $table->index('is_active');
    });
}

public function down(): void
{
    Schema::dropIfExists('products');
}
};
