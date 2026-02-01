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
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->string('recipient_code')->nullable()->after('account_number');
            $table->string('transfer_code')->nullable()->after('recipient_code');
            $table->string('bank_code')->nullable()->after('bank_name');
            $table->text('payout_response')->nullable()->after('transfer_code');
            $table->timestamp('processed_at')->nullable()->after('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->dropColumn(['recipient_code', 'transfer_code', 'bank_code', 'payout_response', 'processed_at']);
        });
    }
};
