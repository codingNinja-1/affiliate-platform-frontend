<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SettingsController extends Controller
{
    /**
     * Get payment settings
     */
    public function getPaymentSettings()
    {
        $user = Auth::user();

        if (!$user || !in_array($user->user_type, ['admin', 'superadmin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $settings = Setting::getByGroup('payment');

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * Update payment settings
     */
    public function updatePaymentSettings(Request $request)
    {
        $user = Auth::user();

        if (!$user || !in_array($user->user_type, ['admin', 'superadmin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'paystack_test_public_key' => 'nullable|string|max:255',
            'paystack_test_secret_key' => 'nullable|string|max:255',
            'paystack_live_public_key' => 'nullable|string|max:255',
            'paystack_live_secret_key' => 'nullable|string|max:255',
            'paystack_mode' => 'required|in:test,live',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        foreach ($data as $key => $value) {
            Setting::setValue($key, $value, 'string', 'payment');
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment settings updated successfully.',
            'data' => Setting::getByGroup('payment'),
        ]);
    }
}
