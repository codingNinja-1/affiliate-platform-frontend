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
    Schema::create('users', function (Blueprint $table) {
        $table->id();
        $table->uuid('uuid')->unique();
        $table->string('user_id')->unique()->nullable();
        $table->enum('user_type', ['admin', 'vendor', 'affiliate', 'customer']);
        $table->string('first_name');
        $table->string('last_name');
        $table->string('email')->unique();
        $table->string('phone')->nullable();
        $table->timestamp('email_verified_at')->nullable();
        $table->string('password');
        $table->string('avatar')->nullable();
        $table->enum('status', ['active', 'inactive', 'suspended', 'pending'])->default('pending');
        $table->string('two_factor_secret')->nullable();
        $table->boolean('two_factor_enabled')->default(false);
        $table->timestamp('last_login_at')->nullable();
        $table->string('last_login_ip')->nullable();
        $table->rememberToken();
        $table->timestamps();
        $table->softDeletes();

        $table->index(['user_type', 'status']);
        $table->index('email');
    });
}

public function down(): void
{
    Schema::dropIfExists('users');
}
};
