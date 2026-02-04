<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('affiliates', function (Blueprint $table) {
            $table->enum('subscription_status', ['active', 'past_due', 'suspended'])->default('active');
            $table->timestamp('subscription_expires_at')->nullable();
            $table->timestamp('subscription_last_charged_at')->nullable();
            $table->timestamp('subscription_failed_at')->nullable();
        });

        Schema::table('vendors', function (Blueprint $table) {
            $table->enum('subscription_status', ['active', 'past_due', 'suspended'])->default('active');
            $table->timestamp('subscription_expires_at')->nullable();
            $table->timestamp('subscription_last_charged_at')->nullable();
            $table->timestamp('subscription_failed_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('affiliates', function (Blueprint $table) {
            $table->dropColumn([
                'subscription_status',
                'subscription_expires_at',
                'subscription_last_charged_at',
                'subscription_failed_at',
            ]);
        });

        Schema::table('vendors', function (Blueprint $table) {
            $table->dropColumn([
                'subscription_status',
                'subscription_expires_at',
                'subscription_last_charged_at',
                'subscription_failed_at',
            ]);
        });
    }
};
