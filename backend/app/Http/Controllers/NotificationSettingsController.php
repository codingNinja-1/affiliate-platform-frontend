<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Setting;

class NotificationSettingsController extends Controller
{
    /**
     * Get notification settings for the authenticated user.
     */
    public function index()
    {
        $user = Auth::user();
        $userId = $user->id;

        // Get user-specific notification settings
        $settings = [
            'affiliate_approved' => $this->getSetting("notification.{$userId}.affiliate_approved", true),
            'affiliate_declined' => $this->getSetting("notification.{$userId}.affiliate_declined", true),
            'new_referral' => $this->getSetting("notification.{$userId}.new_referral", true),
            'new_sale' => $this->getSetting("notification.{$userId}.new_sale", true),
            'new_withdrawal_request' => $this->getSetting("notification.{$userId}.new_withdrawal_request", true),
            'withdrawal_approved' => $this->getSetting("notification.{$userId}.withdrawal_approved", true),
            'withdrawal_rejected' => $this->getSetting("notification.{$userId}.withdrawal_rejected", true),
            'weekly_summary' => $this->getSetting("notification.{$userId}.weekly_summary", true),
        ];

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * Update notification settings for the authenticated user.
     */
    public function update(Request $request)
    {
        $user = Auth::user();
        $userId = $user->id;

        $validated = $request->validate([
            'affiliate_approved' => 'sometimes|boolean',
            'affiliate_declined' => 'sometimes|boolean',
            'new_referral' => 'sometimes|boolean',
            'new_sale' => 'sometimes|boolean',
            'new_withdrawal_request' => 'sometimes|boolean',
            'withdrawal_approved' => 'sometimes|boolean',
            'withdrawal_rejected' => 'sometimes|boolean',
            'weekly_summary' => 'sometimes|boolean',
        ]);

        foreach ($validated as $key => $value) {
            Setting::updateOrCreate(
                ['key' => "notification.{$userId}.{$key}"],
                [
                    'value' => $value ? '1' : '0',
                    'type' => 'boolean',
                    'group' => 'notification',
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Notification settings updated successfully.',
        ]);
    }

    /**
     * Helper to get a setting value with default.
     */
    private function getSetting(string $key, $default = null)
    {
        $setting = Setting::where('key', $key)->first();

        if (!$setting) {
            return $default;
        }

        if ($setting->type === 'boolean') {
            return (bool) $setting->value;
        }

        return $setting->value ?? $default;
    }
}
