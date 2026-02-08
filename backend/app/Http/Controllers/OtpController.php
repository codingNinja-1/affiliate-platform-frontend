<?php

namespace App\Http\Controllers;

use App\Models\EmailLog;
use App\Notifications\OtpVerificationNotification;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class OtpController extends Controller
{
    private array $allowedPurposes = [
        'profile_update' => 'Profile update',
        'bank_details_update' => 'Bank details update',
        'withdrawal_request' => 'Withdrawal request',
    ];

    public function requestOtp(Request $request, OtpService $otpService)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 401);
        }

        $validated = $request->validate([
            'purpose' => 'required|string',
        ]);

        $purpose = $validated['purpose'];
        if (!array_key_exists($purpose, $this->allowedPurposes)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP purpose.',
            ], 422);
        }

        $code = $otpService->createForUser($user, $purpose);
        $expiryMinutes = $otpService->getExpiryMinutes();

        $notification = new OtpVerificationNotification([
            'name' => trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: ($user->name ?? $user->email),
            'code' => $code,
            'expiry_time' => $expiryMinutes . ' minutes',
            'purpose' => $this->allowedPurposes[$purpose],
        ]);

        try {
            $user->notify($notification);
            EmailLog::log(
                $user->email,
                $notification->resolvedSubject($user),
                $notification->templateKey(),
                'sent',
                [
                    'purpose' => $purpose,
                ]
            );
        } catch (\Exception $e) {
            EmailLog::log(
                $user->email,
                null,
                $notification->templateKey(),
                'failed',
                [
                    'purpose' => $purpose,
                ],
                $e->getMessage()
            );

            return response()->json([
                'success' => false,
                'message' => 'Unable to send OTP email. Please try again.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'OTP sent successfully.',
            'data' => [
                'expires_in_minutes' => $expiryMinutes,
            ],
        ]);
    }
}
