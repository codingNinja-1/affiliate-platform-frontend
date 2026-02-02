<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Setting;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add the automatic withdrawal setting if it doesn't exist
        Setting::updateOrCreate(
            ['key' => 'enable_automatic_withdrawals'],
            [
                'value' => 'true',
                'type' => 'boolean',
                'group' => 'payment',
            ]
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Setting::where('key', 'enable_automatic_withdrawals')->delete();
    }
};
