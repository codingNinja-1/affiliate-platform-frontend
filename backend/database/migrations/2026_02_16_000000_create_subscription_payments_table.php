<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('subscription_payments', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->nullable()->index();
            $table->string('reference')->unique();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('user_type')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('period')->nullable(); // monthly|yearly
            $table->string('status')->default('pending')->index(); // pending|success|failed
            $table->json('gateway_payload')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('subscription_payments');
    }
};
