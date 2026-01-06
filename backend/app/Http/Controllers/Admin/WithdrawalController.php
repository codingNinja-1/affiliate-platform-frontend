<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Withdrawal;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class WithdrawalController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        if (!$user || !in_array($user->user_type, ['admin', 'superadmin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $status = $request->query('status');
        $search = $request->query('search');
        $page = $request->query('page', 1);
        $perPage = $request->query('per_page', 50);

        $query = Withdrawal::query();

        if ($status) {
            $query->where('status', $status);
        }

        if ($search) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $withdrawals = $query->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'success' => true,
            'data' => $withdrawals->items(),
            'pagination' => [
                'total' => $withdrawals->total(),
                'per_page' => $withdrawals->perPage(),
                'current_page' => $withdrawals->currentPage(),
                'last_page' => $withdrawals->lastPage(),
            ],
        ]);
    }

    public function approve(Request $request, $withdrawalId)
    {
        $user = Auth::user();

        if (!$user || !in_array($user->user_type, ['admin', 'superadmin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $withdrawal = Withdrawal::findOrFail($withdrawalId);

        if ($withdrawal->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending withdrawals can be approved.',
            ], 400);
        }

        $withdrawal->update([
            'status' => 'completed',
            'approved_at' => now(),
            'approved_by' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'data' => $withdrawal,
            'message' => 'Withdrawal approved successfully.',
        ]);
    }

    public function reject(Request $request, $withdrawalId)
    {
        $user = Auth::user();

        if (!$user || !in_array($user->user_type, ['admin', 'superadmin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $withdrawal = Withdrawal::findOrFail($withdrawalId);

        if ($withdrawal->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending withdrawals can be rejected.',
            ], 400);
        }

        $withdrawal->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['reason'],
            'rejected_at' => now(),
            'rejected_by' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'data' => $withdrawal,
            'message' => 'Withdrawal rejected successfully.',
        ]);
    }
}

