<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SubscriptionController extends Controller
{
    public function show()
    {
        $user = Auth::user();

        if (!$user || !in_array($user->user_type, ['vendor', 'affiliate'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $record = $user->user_type === 'vendor' ? $user->vendor : $user->affiliate;

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription record not found.',
            ], 404);
        }

        $monthlyAmount = $this->getMonthlyAmount($user->user_type);
        $annualAmount = round($monthlyAmount * 12, 2);

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $record->subscription_status,
                'expires_at' => $record->subscription_expires_at,
                'last_charged_at' => $record->subscription_last_charged_at,
                'annual_amount' => $annualAmount,
                'monthly_amount' => $monthlyAmount,
                'balance' => $record->balance,
                'can_pay' => $annualAmount > 0 && $record->balance >= $annualAmount,
            ],
        ]);
    }

    public function pay(Request $request)
    {
        $user = Auth::user();

        if (!$user || !in_array($user->user_type, ['vendor', 'affiliate'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $record = $user->user_type === 'vendor' ? $user->vendor : $user->affiliate;

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription record not found.',
            ], 404);
        }

        $monthlyAmount = $this->getMonthlyAmount($user->user_type);
        $annualAmount = round($monthlyAmount * 12, 2);

        if ($annualAmount <= 0) {
            return response()->json([
                'success' => true,
                'message' => 'Subscription is free.',
                'data' => [
                    'status' => $record->subscription_status,
                ],
            ]);
        }

        if ($record->balance < $annualAmount) {
            return response()->json([
                'success' => false,
                'message' => 'Insufficient balance for subscription payment.',
            ], 422);
        }

        DB::transaction(function () use ($record, $annualAmount, $user) {
            $record->updateBalance($annualAmount, 'subtract');
            $record->update([
                'subscription_status' => 'active',
                'subscription_last_charged_at' => now(),
                'subscription_expires_at' => now()->addYear(),
                'subscription_failed_at' => null,
            ]);

            if ($user->status === 'inactive') {
                $user->update(['status' => 'active']);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Subscription paid successfully.',
            'data' => [
                'status' => $record->subscription_status,
                'expires_at' => $record->subscription_expires_at,
            ],
        ]);
    }

    private function getMonthlyAmount(string $userType): float
    {
        $key = $userType === 'vendor' ? 'vendor_monthly' : 'affiliate_monthly';
        $value = Setting::getValue($key, 0);

        return (float) $value;
    }
}
