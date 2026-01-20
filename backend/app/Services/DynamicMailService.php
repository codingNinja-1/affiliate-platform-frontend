<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Config;

class DynamicMailService
{
    public static function configure()
    {
        // Get settings from database
        $mailer = self::getSetting('mail.mailer');
        $host = self::getSetting('mail.host');
        $port = self::getSetting('mail.port');
        $username = self::getSetting('mail.username');
        $password = self::getSetting('mail.password');
        $encryption = self::getSetting('mail.encryption');
        $fromAddress = self::getSetting('mail.from.address');
        $fromName = self::getSetting('mail.from.name');

        // Only configure if SMTP settings exist
        if ($host && $username) {
            Config::set([
                'mail.default' => $mailer ?: 'smtp',
                'mail.mailers.smtp.transport' => 'smtp',
                'mail.mailers.smtp.host' => $host,
                'mail.mailers.smtp.port' => $port ?: 587,
                'mail.mailers.smtp.encryption' => $encryption ?: 'tls',
                'mail.mailers.smtp.username' => $username,
                'mail.mailers.smtp.password' => $password,
                'mail.from.address' => $fromAddress ?: config('mail.from.address'),
                'mail.from.name' => $fromName ?: config('mail.from.name'),
            ]);

            // Purge existing mail manager instance to force recreation with new config
            app()->forgetInstance('mail.manager');
            app()->forgetInstance('mailer');
        }
    }

    private static function getSetting($key, $default = null)
    {
        $setting = Setting::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }
}
