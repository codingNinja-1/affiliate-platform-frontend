<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\Withdrawal;
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
     * Store a newly created withdrawal request.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1000',
            'bank_name' => 'required|string|max:100',
            'account_name' => 'required|string|max:100',
            'account_number' => 'required|string|min:10|max:20',
            'payment_method' => 'nullable|string|in:bank_transfer,paypal,stripe',
        ]);

        $user = Auth::user();

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

        $balance = $affiliate->balance ?? 0;

        // Check for pending withdrawals to calculate available balance
        $pendingWithdrawals = Withdrawal::where('user_id', $user->id)
            ->where('user_type', 'affiliate')
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
            $affiliate->decrement('balance', $validated['amount']);

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

            return response()->json([
                'success' => true,
                'message' => 'Withdrawal request submitted successfully.',
                'data' => $withdrawal,
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
}
