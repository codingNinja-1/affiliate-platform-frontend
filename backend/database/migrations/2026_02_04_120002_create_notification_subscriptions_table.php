<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notification_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            // Web push subscription details (from browser)
            $table->text('endpoint'); // Push service endpoint URL
            $table->text('p256dh'); // Public key for encryption
            $table->text('auth'); // Authentication secret
            $table->string('user_agent')->nullable(); // Browser/device info

            // Status tracking
            $table->boolean('is_active')->default(true);
            $table->timestamp('subscribed_at')->nullable();
            $table->timestamp('unsubscribed_at')->nullable();
            $table->timestamp('last_used_at')->nullable();

            // Unique constraint: one subscription per user per endpoint
            $table->unique(['user_id', 'endpoint']);

            $table->timestamps();
            $table->index('user_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_subscriptions');
    }
};
