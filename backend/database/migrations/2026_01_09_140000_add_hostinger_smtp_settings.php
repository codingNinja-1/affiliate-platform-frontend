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
        // Add Hostinger SMTP settings
        $settings = [
            'mail.mailer' => 'smtp',
            'mail.host' => 'smtp.hostinger.com',
            'mail.port' => '465',
            'mail.username' => 'admin@timilehinaruaji.com.ng',
            'mail.password' => 'Adedamola001$',
            'mail.encryption' => 'ssl',
            'mail.from.address' => 'admin@timilehinaruaji.com.ng',
            'mail.from.name' => 'AffiliateHub',
        ];

        foreach ($settings as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove settings if needed
        $keys = [
            'mail.mailer',
            'mail.host',
            'mail.port',
            'mail.username',
            'mail.password',
            'mail.encryption',
            'mail.from.address',
            'mail.from.name',
        ];

        foreach ($keys as $key) {
            DB::table('settings')->where('key', $key)->delete();
        }
    }
};
