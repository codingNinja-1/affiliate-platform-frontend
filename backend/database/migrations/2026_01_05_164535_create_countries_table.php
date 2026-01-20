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
    Schema::create('countries', function (Blueprint $table) {
        $table->id();
        $table->string('name');
        $table->string('code', 2)->unique();
        $table->string('code3', 3)->unique();
        $table->string('phone_code');
        $table->string('currency')->nullable();
        $table->string('currency_symbol')->nullable();
        $table->boolean('is_active')->default(true);
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('countries');
}

};
