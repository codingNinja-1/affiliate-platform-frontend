<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Services\DynamicMailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;


class SmtpSettingsController extends Controller
{
    public function index(Request $request)
    {
        $settings = [
            'mail_mailer' => $this->getSetting('mail.mailer', 'smtp'),
            'mail_host' => $this->getSetting('mail.host', ''),
            'mail_port' => $this->getSetting('mail.port', '587'),
            'mail_username' => $this->getSetting('mail.username', ''),
            'mail_password' => $this->getSetting('mail.password', ''),
            'mail_encryption' => $this->getSetting('mail.encryption', 'tls'),
            'mail_from_address' => $this->getSetting('mail.from.address', ''),
            'mail_from_name' => $this->getSetting('mail.from.name', 'AffiliateHub'),
        ];

        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'mail_mailer' => 'nullable|string',
            'mail_host' => 'nullable|string',
            'mail_port' => 'nullable|string',
            'mail_username' => 'nullable|string',
            'mail_password' => 'nullable|string',
            'mail_encryption' => 'nullable|string',
            'mail_from_address' => 'nullable|email',
            'mail_from_name' => 'nullable|string',
        ]);

        foreach ($validated as $key => $value) {
            if ($value !== null) {
                $settingKey = str_replace('_', '.', $key);
                Setting::updateOrCreate(
                    ['key' => $settingKey],
                    ['value' => $value]
                );

                // Update config in runtime
                config([$settingKey => $value]);
            }
        }

        // Clear config cache
        Artisan::call('config:clear');

        return response()->json([
            'success' => true,
            'message' => 'SMTP settings updated successfully'
        ]);
    }

    public function test(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $testEmail = $request->input('email');

        try {
            // Load settings from database and configure mail transport
            DynamicMailService::configure();

            Mail::raw('This is a test email from your AffiliateHub platform. If you received this, your SMTP configuration is working correctly!', function ($message) use ($testEmail) {
                $message->to($testEmail)
                    ->subject('Test Email - AffiliateHub');
            });

            return response()->json([
                'success' => true,
                'message' => 'Test email sent successfully to ' . $testEmail
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send test email: ' . $e->getMessage()
            ], 500);
        }
    }

    private function getSetting($key, $default = null)
    {
        $setting = Setting::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }
}
