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

        // Check if payment is allowed
        if (!$this->canPaySubscription($record)) {
            return response()->json([
                'success' => false,
                'message' => 'Subscription payment not allowed at this time. You can only pay within 1 week before expiration or after expiration.',
            ], 422);
        }

        $monthlyAmount = $this->getMonthlyAmount($user->user_type);
        $period = $request->input('period');
        $paymentMethod = $request->input('payment_method');
        
        $amount = $period === 'monthly' ? $monthlyAmount : round($monthlyAmount * 12, 2);

        if ($amount <= 0) {
            return response()->json([
                'success' => true,
                'message' => 'Subscription is free.',
                'data' => [
                    'status' => $record->subscription_status,
                ],
            ]);
        }

        if ($paymentMethod === 'balance') {
            if ($record->balance < $amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient balance for subscription payment.',
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
        $paystackSecretKey = config('services.paystack.secret_key');
        
        if (!$paystackSecretKey) {
            return response()->json([
                'success' => false,
                'message' => 'Paystack is not configured.',
            ], 500);
        }

        $reference = 'SUB_' . time() . '_' . $user->id;
        $callbackUrl = config('app.frontend_url') . '/subscriptions/verify';

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
                    'message' => 'Payment initialized.',
                    'data' => [
                        'authorization_url' => $data['data']['authorization_url'],
                        'reference' => $reference,
                    ],
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $data['message'] ?? 'Failed to initialize payment.',
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Payment initialization failed: ' . $e->getMessage(),
            ], 500);
        }
    }
            });

            return response()->json([
                'success' => true,
                'message' => 'Subscription paid successfully from balance.',
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

    public function verifyPayment(Request $request, $reference)
    {
        $paystackSecretKey = config('services.paystack.secret_key');
        
        if (!$paystackSecretKey) {
            return response()->json([
                'success' => false,
                'message' => 'Paystack is not configured.',
            ], 500);
        }

        try {
            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => 'Bearer ' . $paystackSecretKey,
            ])->get("https://api.paystack.co/transaction/verify/{$reference}");

            $data = $response->json();

            if (!$response->successful() || !$data['status']) {
                return response()->json([
                    'success' => false,
                    'message' => $data['message'] ?? 'Payment verification failed.',
                ], 422);
            }

            $transactionData = $data['data'];

            if ($transactionData['status'] !== 'success') {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment was not successful.',
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
                    'message' => 'User not found.',
                ], 404);
            }

            $record = $userType === 'vendor' ? $user->vendor : $user->affiliate;
            if (!$record) {
                return response()->json([
                    'success' => false,
                    'message' => 'Record not found.',
                ], 404);
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
                'message' => 'Payment verified and subscription activated.',
                'data' => [
                    'status' => $record->subscription_status,
                    'expires_at' => $record->subscription_expires_at,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Payment verification failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    private function getMonthlyAmount(string $userType): float
    {
        $key = $userType === 'vendor' ? 'vendor_monthly' : 'affiliate_monthly';
        $value = Setting::getValue($key, 0);

        return (float) $value;
    }
}
