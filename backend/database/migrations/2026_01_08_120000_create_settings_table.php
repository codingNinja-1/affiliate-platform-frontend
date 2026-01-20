<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, json, boolean, integer
            $table->string('group')->default('general'); // general, payment, email, etc
            $table->timestamps();
        });

        // Insert default Paystack settings
        DB::table('settings')->insert([
            [
                'key' => 'paystack_test_public_key',
                'value' => '',
                'type' => 'string',
                'group' => 'payment',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'paystack_test_secret_key',
                'value' => '',
                'type' => 'string',
                'group' => 'payment',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'paystack_live_public_key',
                'value' => '',
                'type' => 'string',
                'group' => 'payment',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'paystack_live_secret_key',
                'value' => '',
                'type' => 'string',
                'group' => 'payment',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'paystack_mode',
                'value' => 'test',
                'type' => 'string',
                'group' => 'payment',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
