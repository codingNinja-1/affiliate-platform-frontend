<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Affiliate;
use App\Models\Vendor;
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
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
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

    public function approve(Request $request, Withdrawal $withdrawal)
    {
        try {
            $user = Auth::user();

            if (!$user || !in_array($user->user_type, ['admin', 'superadmin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized.',
                ], 403);
            }

            if ($withdrawal->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending withdrawals can be approved.',
                ], 400);
            }

            $withdrawal->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => $user->id,
            ]);

            // Update total_withdrawn for the user's profile
            // Note: Balance is deducted when withdrawal is created (not here)
            // We only update total_withdrawn when approved to track successful payouts
            if ($withdrawal->user_type === 'affiliate') {
                $affiliate = Affiliate::where('user_id', $withdrawal->user_id)->first();
                if ($affiliate) {
                    $affiliate->increment('total_withdrawn', $withdrawal->amount);
                }
            } elseif ($withdrawal->user_type === 'vendor') {
                $vendor = Vendor::where('user_id', $withdrawal->user_id)->first();
                if ($vendor) {
                    $vendor->increment('total_withdrawn', $withdrawal->amount);
                }
            }

            return response()->json([
                'success' => true,
                'data' => $withdrawal,
                'message' => 'Withdrawal approved successfully.',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error approving withdrawal', [
                'error' => $e->getMessage(),
                'withdrawal_id' => $withdrawal?->id ?? 'unknown',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while approving the withdrawal: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function reject(Request $request, Withdrawal $withdrawal)
    {
        try {
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

            // Restore balance to user's profile since withdrawal was rejected
            if ($withdrawal->user_type === 'affiliate') {
                $affiliate = Affiliate::where('user_id', $withdrawal->user_id)->first();
                if ($affiliate) {
                    $affiliate->increment('balance', $withdrawal->amount);
                }
            } elseif ($withdrawal->user_type === 'vendor') {
                $vendor = Vendor::where('user_id', $withdrawal->user_id)->first();
                if ($vendor) {
                    $vendor->increment('balance', $withdrawal->amount);
                }
            }

            return response()->json([
                'success' => true,
                'data' => $withdrawal,
                'message' => 'Withdrawal rejected successfully.',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error rejecting withdrawal', [
                'error' => $e->getMessage(),
                'withdrawal_id' => $withdrawal?->id ?? 'unknown',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while rejecting the withdrawal: ' . $e->getMessage(),
            ], 500);
        }
    }
}

