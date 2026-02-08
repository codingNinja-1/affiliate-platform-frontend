<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\Withdrawal;
use App\Models\Commission;
use App\Models\EmailLog;
use App\Models\Setting;
use App\Models\Affiliate;
use App\Models\CurrencyRate;
use App\Services\CurrencyConversionService;
use App\Services\AutomaticWithdrawalService;
use App\Services\OtpService;
use App\Notifications\WithdrawalProcessingNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WithdrawalController extends Controller
{
    /**
     * Display a listing of withdrawals for the affiliate.
     */
    public function index()
    {
        $user = Auth::user();

        $withdrawals = Withdrawal::where('user_id', $user->id)
            ->where('user_type', 'affiliate')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $withdrawals,
        ]);
    }

    /**
     * Store a newly created withdrawal request with instant payout.
     */
    public function store(Request $request, AutomaticWithdrawalService $withdrawalService, OtpService $otpService)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1000',
            'bank_name' => 'required|string|max:100',
            'account_name' => 'required|string|max:100',
            'account_number' => 'required|string|min:10|max:20',
            'payment_method' => 'nullable|string|in:bank_transfer,paypal,stripe',
            'otp_code' => 'required|string',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        $otpCheck = $otpService->verifyForUser($user, 'withdrawal_request', $validated['otp_code']);
        if (!$otpCheck['success']) {
            return response()->json([
                'success' => false,
                'message' => $otpCheck['message'],
            ], 403);
        }

        // Check if there's already a pending withdrawal
        $hasPending = Withdrawal::where('user_id', $user->id)
            ->where('user_type', 'affiliate')
            ->where('status', 'pending')
            ->exists();

        if ($hasPending) {
            return response()->json([
                'success' => false,
                'message' => 'You already have a pending withdrawal request. Please wait for it to be processed before requesting another withdrawal.',
            ], 400);
        }

        // Check if affiliate has sufficient balance
        $affiliate = $user->affiliate;
        if (!$affiliate) {
            return response()->json([
                'success' => false,
                'message' => 'Affiliate profile not found.',
            ], 404);
        }

        // Check if subscription is active
        if (!$affiliate->subscription_expires_at) {
            return response()->json([
                'success' => false,
                'message' => 'You need an active subscription to make withdrawals. Please subscribe first.',
            ], 403);
        }

        if (now()->greaterThan($affiliate->subscription_expires_at)) {
            return response()->json([
                'success' => false,
                'message' => 'Your subscription has expired. Please renew your subscription to make withdrawals.',
            ], 403);
        }

        // Recompute available balance from commissions minus withdrawals to stay in sync with dashboard
        $totalEarnings = (float) Commission::where('user_id', $user->id)
            ->where('user_type', 'affiliate')
            ->whereIn('status', ['approved', 'paid'])
            ->sum('amount');

        $approvedWithdrawals = (float) Withdrawal::where('user_id', $user->id)
            ->where('user_type', 'affiliate')
            ->where('status', 'approved')
            ->sum('amount');

        $pendingWithdrawals = (float) Withdrawal::where('user_id', $user->id)
            ->where('user_type', 'affiliate')
            ->where('status', 'pending')
            ->sum('amount');

        $availableBalance = $totalEarnings - $approvedWithdrawals - $pendingWithdrawals;

        if ($availableBalance < $validated['amount']) {
            return response()->json([
                'success' => false,
                'message' => "Insufficient balance. Available: ₦" . number_format($availableBalance, 2),
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Snap balance to derived available and deduct this request to prevent double-withdrawal
            $newBalance = max($availableBalance - $validated['amount'], 0);
            $affiliate->update(['balance' => $newBalance]);

            // Create withdrawal request
            $withdrawal = Withdrawal::create([
                'uuid' => Str::uuid(),
                'user_id' => $user->id,
                'user_type' => 'affiliate',
                'amount' => $validated['amount'],
                'bank_name' => $validated['bank_name'],
                'account_name' => $validated['account_name'],
                'account_number' => $validated['account_number'],
                'payment_method' => $validated['payment_method'] ?? 'bank_transfer',
                'status' => 'pending',
            ]);

            DB::commit();

            // Check if automatic withdrawals are enabled
            $enableAutomatic = Setting::getValue('enable_automatic_withdrawals', true);

            if ($enableAutomatic) {
                // Process automatic withdrawal immediately
                $result = $withdrawalService->processWithdrawal($withdrawal, $user);

                if (!$result['success']) {
                    return response()->json([
                        'success' => false,
                        'message' => $result['message'],
                    ], 400);
                }

                $responseMessage = 'Withdrawal processed successfully! Funds will arrive in your account within minutes.';
            } else {
                // Keep as pending for manual admin review
                $responseMessage = 'Withdrawal request submitted successfully! Our team will review and process it shortly. You will receive an email notification once completed.';
            }

            $notification = new WithdrawalProcessingNotification([
                'name' => trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')) ?: ($user->name ?? $user->email),
                'amount' => number_format((float) $withdrawal->amount, 2),
                'reference' => $withdrawal->withdrawal_ref ?? $withdrawal->uuid,
                'bank_name' => $withdrawal->bank_name,
                'account_number' => $withdrawal->account_number,
            ]);

            try {
                $user->notify($notification);
                EmailLog::log(
                    $user->email,
                    $notification->resolvedSubject($user),
                    $notification->templateKey(),
                    'sent',
                    [
                        'withdrawal_id' => $withdrawal->id,
                        'user_type' => 'affiliate',
                    ]
                );
            } catch (\Exception $e) {
                EmailLog::log(
                    $user->email,
                    null,
                    $notification->templateKey(),
                    'failed',
                    [
                        'withdrawal_id' => $withdrawal->id,
                        'user_type' => 'affiliate',
                    ],
                    $e->getMessage()
                );
            }

            return response()->json([
                'success' => true,
                'message' => $responseMessage,
                'data' => $withdrawal->fresh(),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create withdrawal request.',
            ], 500);
        }
    }

    /**
     * Display the specified withdrawal.
     */
    public function show($id)
    {
        $user = Auth::user();

        $withdrawal = Withdrawal::where('user_id', $user->id)
            ->where('user_type', 'affiliate')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $withdrawal,
        ]);
    }

    /**
     * Get withdrawals with converted amounts based on affiliate's preferred currency
     */
    public function getConvertedWithdrawals(Request $request)
    {
        $user = Auth::user();
        $affiliate = Affiliate::where('user_id', $user->id)->first();

        if (!$affiliate) {
            return response()->json([
                'success' => false,
                'message' => 'Affiliate not found',
            ], 404);
        }

        $withdrawals = Withdrawal::where('user_id', $user->id)
            ->where('user_type', 'affiliate')
            ->orderBy('created_at', 'desc')
            ->get();

        $preferredCurrency = $affiliate->preferred_currency ?? 'NGN';
        $baseCurrency = 'NGN';

        // If preferred currency is NGN, no conversion needed
        if ($preferredCurrency === $baseCurrency) {
            return response()->json([
                'success' => true,
                'data' => $withdrawals,
                'currency' => 'NGN',
                'conversion_rate' => 1.0,
            ]);
        }

        // Get conversion rate
        $conversionRate = CurrencyRate::getRate($baseCurrency, $preferredCurrency);

        if ($conversionRate === null) {
            return response()->json([
                'success' => false,
                'message' => "Unable to convert to {$preferredCurrency}",
                'data' => $withdrawals,
                'currency' => 'NGN',
            ], 200);
        }

        // Convert each withdrawal amount
        $converted = $withdrawals->map(function ($withdrawal) use ($conversionRate, $preferredCurrency) {
            $withdrawal->converted_amount = (float) $withdrawal->amount * $conversionRate;
            $withdrawal->converted_currency = $preferredCurrency;
            return $withdrawal;
        });

        return response()->json([
            'success' => true,
            'data' => $converted,
            'currency' => $preferredCurrency,
            'conversion_rate' => $conversionRate,
        ]);
    }
}
