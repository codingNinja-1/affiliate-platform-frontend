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
                'message' => 'You need to be logged in to manage your subscription.',
            ], 403);
        }

        $record = $user->user_type === 'vendor' ? $user->vendor : $user->affiliate;

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Your account profile was not found. Please contact support.',
            ], 404);
        }

        $monthlyAmount = $this->getMonthlyAmount($user->user_type);
        $annualAmount = round($monthlyAmount * 12, 2);

        // Check if payment is allowed (1 week before expiration or expired)
        $canPayNow = $this->canPaySubscription($record);

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $record->subscription_status,
                'expires_at' => $record->subscription_expires_at,
                'last_charged_at' => $record->subscription_last_charged_at,
                'annual_amount' => $annualAmount,
                'monthly_amount' => $monthlyAmount,
                'balance' => $record->balance,
                'can_pay' => $canPayNow,
                'can_pay_with_balance_monthly' => $monthlyAmount > 0 && $record->balance >= $monthlyAmount,
                'can_pay_with_balance_yearly' => $annualAmount > 0 && $record->balance >= $annualAmount,
            ],
        ]);
    }

    public function pay(Request $request)
    {
        $request->validate([
            'period' => 'required|in:monthly,yearly',
            'payment_method' => 'required|in:balance,paystack',
        ]);

        $user = Auth::user();

        if (!$user || !in_array($user->user_type, ['vendor', 'affiliate'])) {
            return response()->json([
                'success' => false,
                'message' => 'You need to be logged in to manage your subscription.',
            ], 403);
        }

        $record = $user->user_type === 'vendor' ? $user->vendor : $user->affiliate;

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Your account profile was not found. Please contact support.',
            ], 404);
        }

        // CRITICAL: Prevent duplicate payments - check if there was a recent payment (within last 5 minutes)
        if ($record->subscription_last_charged_at && 
            now()->diffInMinutes($record->subscription_last_charged_at) < 5) {
            return response()->json([
                'success' => false,
                'message' => 'A payment was recently processed. Please refresh the page to see your current subscription status.',
            ], 422);
        }

        // Check if subscription is active and not near expiration
        if ($record->subscription_status === 'active' && 
            $record->subscription_expires_at && 
            now()->lessThan($record->subscription_expires_at)) {
            
            // Only allow payment if within 7 days of expiration
            $daysUntilExpiry = now()->diffInDays($record->subscription_expires_at, false);
            if ($daysUntilExpiry > 7) {
                return response()->json([
                    'success' => false,
                    'message' => "Your subscription is active until " . $record->subscription_expires_at->format('M d, Y') . ". You can renew it starting " . now()->addDays((int)$daysUntilExpiry - 7)->format('M d, Y') . ".",
                ], 422);
            }
        }

        // Double-check with canPaySubscription method
        if (!$this->canPaySubscription($record)) {
            return response()->json([
                'success' => false,
                'message' => 'Your subscription is currently active. You can renew it 1 week before it expires.',
            ], 422);
        }

        $monthlyAmount = $this->getMonthlyAmount($user->user_type);
        $period = $request->input('period');
        $paymentMethod = $request->input('payment_method');

        $amount = $period === 'monthly' ? $monthlyAmount : round($monthlyAmount * 12, 2);

        if ($amount <= 0) {
            return response()->json([
                'success' => true,
                'message' => 'Your subscription is free. No payment required.',
                'data' => [
                    'status' => $record->subscription_status,
                ],
            ]);
        }

        if ($paymentMethod === 'balance') {
            if ($record->balance < $amount) {
                $shortfall = $amount - $record->balance;
                return response()->json([
                    'success' => false,
                    'message' => "Your balance is insufficient. You need " . number_format($shortfall, 2) . " more to complete this payment.",
                ], 422);
            }

            DB::transaction(function () use ($record, $amount, $user, $period) {
                $record->updateBalance($amount, 'subtract');
                $expiresAt = $period === 'monthly' ? now()->addMonth() : now()->addYear();

                $record->update([
                    'subscription_status' => 'active',
                    'subscription_last_charged_at' => now(),
                    'subscription_expires_at' => $expiresAt,
                    'subscription_failed_at' => null,
                ]);

                if ($user->status === 'inactive') {
                    $user->update(['status' => 'active']);
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Payment successful! Your subscription is now active.',
                'data' => [
                    'status' => $record->subscription_status,
                    'expires_at' => $record->subscription_expires_at,
                    'balance' => $record->balance,
                ],
            ]);
        } else {
            // Paystack payment - initialize transaction
            return $this->initializePaystackPayment($user, $record, $amount, $period);
        }
    }

    private function canPaySubscription($record): bool
    {
        // If no subscription or expired, allow payment
        if (!$record->subscription_expires_at || now()->greaterThan($record->subscription_expires_at)) {
            return true;
        }

        // Allow payment if within 1 week (7 days) before expiration
        $oneWeekBeforeExpiry = now()->addWeek();
        return $oneWeekBeforeExpiry->greaterThanOrEqualTo($record->subscription_expires_at);
    }

    private function initializePaystackPayment($user, $record, $amount, $period)
    {
        // Get Paystack mode from settings (test or live)
        $mode = Setting::getValue('paystack_mode', 'test');
        
        // Read correct Paystack keys based on mode
        if ($mode === 'live') {
            $paystackSecretKey = Setting::getValue('paystack_live_secret_key');
            $paystackPublicKey = Setting::getValue('paystack_live_public_key');
        } else {
            $paystackSecretKey = Setting::getValue('paystack_test_secret_key');
            $paystackPublicKey = Setting::getValue('paystack_test_public_key');
        }

        if (!$paystackSecretKey || !$paystackPublicKey) {
            return response()->json([
                'success' => false,
                'message' => 'Card payment is temporarily unavailable. Please try using your account balance instead.',
            ], 503);
        }

        $reference = 'SUB_' . time() . '_' . $user->id;
        $callbackUrl = config('app.frontend_url') . '/subscriptions';

        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => 'Bearer ' . $paystackSecretKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.paystack.co/transaction/initialize', [
                'email' => $user->email,
                'amount' => $amount * 100, // Convert to kobo
                'reference' => $reference,
                'callback_url' => $callbackUrl,
                'metadata' => [
                    'user_id' => $user->id,
                    'user_type' => $user->user_type,
                    'period' => $period,
                    'type' => 'subscription',
                ],
            ]);

            $data = $response->json();

            if ($response->successful() && $data['status']) {
                return response()->json([
                    'success' => true,
                    'message' => 'Redirecting to payment...',
                    'data' => [
                        'authorization_url' => $data['data']['authorization_url'],
                        'reference' => $reference,
                    ],
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $data['message'] ?? 'We couldn\'t process your payment request. Please try again.',
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Payment service is temporarily unavailable. Please try again later.',
            ], 503);
        }
    }

    public function verifyPayment(Request $request, $reference)
    {
        // Get Paystack mode from settings (test or live)
        $mode = Setting::getValue('paystack_mode', 'test');
        
        // Read correct Paystack keys based on mode
        if ($mode === 'live') {
            $paystackSecretKey = Setting::getValue('paystack_live_secret_key');
        } else {
            $paystackSecretKey = Setting::getValue('paystack_test_secret_key');
        }

        if (!$paystackSecretKey) {
            return response()->json([
                'success' => false,
                'message' => 'Payment verification is temporarily unavailable. Please contact support.',
            ], 503);
        }

        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => 'Bearer ' . $paystackSecretKey,
            ])->get("https://api.paystack.co/transaction/verify/{$reference}");

            $data = $response->json();

            if (!$response->successful() || !$data['status']) {
                return response()->json([
                    'success' => false,
                    'message' => 'We couldn\'t verify your payment. Please try again or contact support.',
                ], 422);
            }

            $transactionData = $data['data'];

            if ($transactionData['status'] !== 'success') {
                return response()->json([
                    'success' => false,
                    'message' => 'Your payment was not completed. Please try again.',
                ], 422);
            }

            $metadata = $transactionData['metadata'];
            $userId = $metadata['user_id'];
            $userType = $metadata['user_type'];
            $period = $metadata['period'];
            $amount = $transactionData['amount'] / 100; // Convert from kobo

            $user = \App\Models\User::find($userId);
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account was not found. Please contact support.',
                ], 404);
            }

            $record = $userType === 'vendor' ? $user->vendor : $user->affiliate;
            if (!$record) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account profile was not found. Please contact support.',
                ], 404);
            }

            // CRITICAL: Prevent duplicate verification - check if subscription was already updated with this payment
            if ($record->subscription_last_charged_at && 
                now()->diffInMinutes($record->subscription_last_charged_at) < 5) {
                return response()->json([
                    'success' => true,
                    'message' => 'Your subscription is already active!',
                    'data' => [
                        'status' => $record->subscription_status,
                        'expires_at' => $record->subscription_expires_at,
                    ],
                ]);
            }

            // Update subscription
            DB::transaction(function () use ($record, $user, $period) {
                $expiresAt = $period === 'monthly' ? now()->addMonth() : now()->addYear();

                $record->update([
                    'subscription_status' => 'active',
                    'subscription_last_charged_at' => now(),
                    'subscription_expires_at' => $expiresAt,
                    'subscription_failed_at' => null,
                ]);

                if ($user->status === 'inactive') {
                    $user->update(['status' => 'active']);
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Payment confirmed! Your subscription is now active.',
                'data' => [
                    'status' => $record->subscription_status,
                    'expires_at' => $record->subscription_expires_at,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Payment verification failed. Please try again or contact support.',
            ], 503);
        }
    }

    private function getMonthlyAmount(string $userType): float
    {
        $key = $userType === 'vendor' ? 'vendor_monthly' : 'affiliate_monthly';
        $value = Setting::getValue($key, 0);

        return (float) $value;
    }
}
