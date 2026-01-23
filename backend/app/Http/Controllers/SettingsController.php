<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Affiliate;
use App\Models\Vendor;
use App\Services\PaystackService;

class SettingsController extends Controller
{
    /**
     * Get user settings including bank details
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $profile = null;
        $bankDetails = [
            'bank_name' => null,
            'account_name' => null,
            'account_number' => null,
            'bank_code' => null,
        ];

        if ($user->user_type === 'affiliate') {
            $profile = Affiliate::where('user_id', $user->id)->first();
        } elseif ($user->user_type === 'vendor') {
            $profile = Vendor::where('user_id', $user->id)->first();
        }

        if ($profile) {
            $bankDetails = [
                'bank_name' => $profile->bank_name,
                'account_name' => $profile->account_name,
                'account_number' => $profile->account_number,
                'bank_code' => $profile->bank_code,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'bank_details' => $bankDetails,
                'has_bank_details' => !empty($profile->account_number) && !empty($profile->bank_name) && !empty($profile->account_name),
            ],
        ]);
    }

    /**
     * Update bank details
     */
    public function updateBankDetails(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        // Super admins don't need bank details
        if (in_array($user->user_type, ['superadmin', 'admin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Admins do not need to set bank details'
            ], 400);
        }

        $validated = $request->validate([
            'bank_name' => 'required|string|max:100',
            'account_name' => 'required|string|max:100',
            'account_number' => 'required|string|min:10|max:20',
            'bank_code' => 'nullable|string|max:20',
        ]);

        $profile = null;

        if ($user->user_type === 'affiliate') {
            $profile = Affiliate::where('user_id', $user->id)->first();
        } elseif ($user->user_type === 'vendor') {
            $profile = Vendor::where('user_id', $user->id)->first();
        }

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'Profile not found'
            ], 404);
        }

        $profile->update([
            'bank_name' => $validated['bank_name'],
            'account_name' => $validated['account_name'],
            'account_number' => $validated['account_number'],
            'bank_code' => $validated['bank_code'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Bank details updated successfully',
            'data' => [
                'bank_name' => $profile->bank_name,
                'account_name' => $profile->account_name,
                'account_number' => $profile->account_number,
                'bank_code' => $profile->bank_code,
            ],
        ]);
    }

    /**
     * Resolve account name from bank code + account number (Nigeria via Paystack)
     */
    public function resolveAccount(Request $request, PaystackService $paystack)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $validated = $request->validate([
            'bank_code' => 'required|string|max:20',
            'account_number' => 'required|string|min:10|max:20',
        ]);

        // Paystack only supports Nigerian banks; their bank codes are numeric
        if (!preg_match('/^\d+$/', $validated['bank_code'])) {
            return response()->json([
                'success' => false,
                'message' => 'Account name verification is only available for Nigerian banks with numeric bank codes.',
            ], 422);
        }

        // Validate account number is numeric
        if (!preg_match('/^\d+$/', $validated['account_number'])) {
            return response()->json([
                'success' => false,
                'message' => 'Account number must contain only digits.',
            ], 422);
        }

        try {
            \Illuminate\Support\Facades\Log::info('Resolving account via Paystack', [
                'account' => $validated['account_number'],
                'bank_code' => $validated['bank_code'],
            ]);

            $resolved = $paystack->resolveAccountNumber(
                $validated['account_number'],
                $validated['bank_code']
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'account_name' => $resolved['account_name'] ?? null,
                    'bank_code' => $validated['bank_code'],
                    'account_number' => $validated['account_number'],
                ],
                'message' => 'Account verified successfully',
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Account resolution error', [
                'message' => $e->getMessage(),
                'account' => $validated['account_number'],
                'bank_code' => $validated['bank_code'],
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Unable to verify account. Please check bank code and account number are correct.',
            ], 422);
        }
    }

    /**
     * Check if user has completed bank details setup
     */
    public function checkBankDetails(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        // Super admins don't need bank details
        if (in_array($user->user_type, ['superadmin', 'admin'])) {
            return response()->json([
                'success' => true,
                'data' => [
                    'has_bank_details' => true,
                    'requires_setup' => false,
                ],
            ]);
        }

        $profile = null;

        if ($user->user_type === 'affiliate') {
            $profile = Affiliate::where('user_id', $user->id)->first();
        } elseif ($user->user_type === 'vendor') {
            $profile = Vendor::where('user_id', $user->id)->first();
        }

        $hasBankDetails = $profile &&
                         !empty($profile->account_number) &&
                         !empty($profile->bank_name) &&
                         !empty($profile->account_name);

        return response()->json([
            'success' => true,
            'data' => [
                'has_bank_details' => $hasBankDetails,
                'requires_setup' => !$hasBankDetails,
            ],
        ]);
    }
}
