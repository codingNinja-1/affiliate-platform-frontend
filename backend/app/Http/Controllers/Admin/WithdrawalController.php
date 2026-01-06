<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Withdrawal;
use Illuminate\Http\Request;

class WithdrawalController extends Controller
{
    public function index(Request $request)
    {
        $query = Withdrawal::query();

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $withdrawals = $query->with(['user' => function ($q) {
            $q->select('id', 'first_name', 'last_name', 'user_type');
        }])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($withdrawal) {
                return [
                    'id' => $withdrawal->id,
                    'user_name' => $withdrawal->user->first_name . ' ' . $withdrawal->user->last_name,
                    'user_type' => $withdrawal->user->user_type,
                    'amount' => $withdrawal->amount,
                    'status' => $withdrawal->status,
                    'payment_method' => $withdrawal->payment_method,
                    'created_at' => $withdrawal->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $withdrawals,
        ]);
    }

    public function approve($withdrawalId)
    {
        return response()->json(['success' => true, 'message' => 'Approve not implemented yet.']);
    }

    public function reject($withdrawalId)
    {
        return response()->json(['success' => true, 'message' => 'Reject not implemented yet.']);
    }
}

