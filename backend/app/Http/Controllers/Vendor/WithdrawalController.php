<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Withdrawal;
use App\Models\Setting;
use App\Models\Vendor;
use App\Models\CurrencyRate;
use App\Services\CurrencyConversionService;
use App\Services\AutomaticWithdrawalService;
use App\Models\EmailLog;
use App\Notifications\WithdrawalProcessingNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class WithdrawalController extends Controller
{
    /**
     * Display a listing of withdrawals for the vendor.
     */
    public function index()
    {
        $user = Auth::user();

        $withdrawals = Withdrawal::where('user_id', $user->id)
            ->where('user_type', 'vendor')
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
    public function store(Request $request, AutomaticWithdrawalService $withdrawalService)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1000',
            'bank_name' => 'required|string|max:100',
            'account_name' => 'required|string|max:100',
            'account_number' => 'required|string|min:10|max:20',
            'payment_method' => 'nullable|string|in:bank_transfer,paypal,stripe',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        // Check if there's already a pending withdrawal
        $hasPending = Withdrawal::where('user_id', $user->id)
            ->where('user_type', 'vendor')
            ->where('status', 'pending')
            ->exists();

        if ($hasPending) {
            return response()->json([
                'success' => false,
                'message' => 'You already have a pending withdrawal request. Please wait for it to be processed before requesting another withdrawal.',
            ], 400);
        }

        // Check if vendor has sufficient balance
        $vendor = $user->vendor;
        if (!$vendor) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor profile not found.',
            ], 404);
        }

        $balance = $vendor->balance ?? 0;

        // Check for pending withdrawals to calculate available balance
        $pendingWithdrawals = Withdrawal::where('user_id', $user->id)
            ->where('user_type', 'vendor')
            ->where('status', 'pending')
            ->sum('amount');

        $availableBalance = $balance - $pendingWithdrawals;

        if ($availableBalance < $validated['amount']) {
            return response()->json([
                'success' => false,
                'message' => "Insufficient balance. Available: ₦" . number_format($availableBalance, 2),
            ], 400);
        }

        DB::beginTransaction();
        try {
            // Deduct balance immediately to prevent double-withdrawal
            $vendor->decrement('balance', $validated['amount']);

            // Create withdrawal request
            $withdrawal = Withdrawal::create([
                'uuid' => Str::uuid(),
                'user_id' => $user->id,
                'user_type' => 'vendor',
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

                $responseMessage = 'Withdrawal processed successfully! Funds will arrive within minutes.';
            } else {
                // Keep as pending for manual admin review
                $responseMessage = 'Withdrawal request submitted. It will be reviewed by the admin shortly.';
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
                        'user_type' => 'vendor',
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
                        'user_type' => 'vendor',
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
            ->where('user_type', 'vendor')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $withdrawal,
        ]);
    }

    /**
     * Get withdrawals with converted amounts based on vendor's preferred currency
     */
    public function getConvertedWithdrawals(Request $request)
    {
        $user = Auth::user();
        $vendor = Vendor::where('user_id', $user->id)->first();

        if (!$vendor) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor not found',
            ], 404);
        }

        $withdrawals = Withdrawal::where('user_id', $user->id)
            ->where('user_type', 'vendor')
            ->orderBy('created_at', 'desc')
            ->get();

        $preferredCurrency = $vendor->preferred_currency ?? 'NGN';
        $baseCurrency = 'NGN';

        if ($preferredCurrency === $baseCurrency) {
            return response()->json([
                'success' => true,
                'data' => $withdrawals,
                'currency' => 'NGN',
                'conversion_rate' => 1.0,
            ]);
        }

        $conversionRate = CurrencyRate::getRate($baseCurrency, $preferredCurrency);

        if ($conversionRate === null) {
            return response()->json([
                'success' => false,
                'message' => "Unable to convert to {$preferredCurrency}",
                'data' => $withdrawals,
                'currency' => 'NGN',
            ], 200);
        }

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
