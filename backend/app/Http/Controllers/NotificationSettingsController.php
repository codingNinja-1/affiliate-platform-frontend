<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
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

        // Rate limiting: max 10 updates per minute per user
        $key = 'update-notification-settings:' . $userId;
        if (RateLimiter::tooManyAttempts($key, 10)) {
            return response()->json([
                'success' => false,
                'message' => 'Too many requests. Please wait and try again.',
            ], 429);
        }
        RateLimiter::hit($key, 60);

        // Only allow specific keys
        $allowed = [
            'affiliate_approved',
            'affiliate_declined',
            'new_referral',
            'new_sale',
            'new_withdrawal_request',
            'withdrawal_approved',
            'withdrawal_rejected',
            'weekly_summary',
        ];

        $input = $request->only($allowed);
        $rules = [];
        foreach ($allowed as $k) {
            $rules[$k] = 'sometimes|boolean';
        }

        $validated = validator($input, $rules)->validate();

        // Audit log
        Log::info('User updated notification settings', [
            'user_id' => $userId,
            'ip' => $request->ip(),
            'changes' => $validated,
        ]);

        try {
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
        } catch (\Exception $e) {
            Log::error('Failed to update notification settings', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to update settings. Please try again later.',
            ], 500);
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
