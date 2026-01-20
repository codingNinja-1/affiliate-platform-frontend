<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class PaystackSettingsSeeder extends Seeder
{
    public function run(): void
    {
        // Get keys from environment variables or use placeholders
        $testPublicKey = env('PAYSTACK_TEST_PUBLIC_KEY', '');
        $testSecretKey = env('PAYSTACK_TEST_SECRET_KEY', '');
        $livePublicKey = env('PAYSTACK_LIVE_PUBLIC_KEY', '');
        $liveSecretKey = env('PAYSTACK_LIVE_SECRET_KEY', '');
        
        Setting::updateOrCreate(
            ['key' => 'paystack_test_public_key'],
            ['value' => $testPublicKey, 'type' => 'string', 'group' => 'payment']
        );

        Setting::updateOrCreate(
            ['key' => 'paystack_test_secret_key'],
            ['value' => $testSecretKey, 'type' => 'string', 'group' => 'payment']
        );

        Setting::updateOrCreate(
            ['key' => 'paystack_live_public_key'],
            ['value' => $livePublicKey, 'type' => 'string', 'group' => 'payment']
        );

        Setting::updateOrCreate(
            ['key' => 'paystack_live_secret_key'],
            ['value' => $liveSecretKey, 'type' => 'string', 'group' => 'payment']
        );

        Setting::updateOrCreate(
            ['key' => 'paystack_mode'],
            ['value' => env('PAYSTACK_MODE', 'test'), 'type' => 'string', 'group' => 'payment']
        );
    }
}
