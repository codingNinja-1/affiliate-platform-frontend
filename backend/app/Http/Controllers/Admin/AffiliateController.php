<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Affiliate;
use App\Models\Commission;
use App\Mail\AffiliateApprovedMail;
use App\Mail\AffiliateDeclinedMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class AffiliateController extends Controller
{
    /**
     * Get all affiliates with stats
     */
    public function index()
    {
        $affiliates = Affiliate::with(['user', 'commissions'])
            ->get()
            ->map(function (Affiliate $affiliate) {
                $user = $affiliate->user;

                $userId = $user?->id;

                // Get commissions for this affiliate user
                $totalEarnings = Commission::where('user_id', $userId)
                    ->where('user_type', 'affiliate')
                    ->sum('amount');

                $totalReferrals = $affiliate->referrals()->count();
                $totalClicks = $affiliate->clicks()->count();
                if ($totalClicks === 0 && $affiliate->total_clicks) {
                    $totalClicks = $affiliate->total_clicks;
                }

                return [
                    'id' => $user?->id,
                    'first_name' => $user?->first_name,
                    'last_name' => $user?->last_name,
                    'email' => $user?->email,
                    'status' => $user?->status ?? 'pending',
                    'total_earnings' => $totalEarnings ?? 0,
                    'total_referrals' => $totalReferrals ?? 0,
                    'total_clicks' => $totalClicks ?? 0,
                    'approval_date' => $user?->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $affiliates,
            'count' => count($affiliates),
        ]);
    }

    /**
     * Get single affiliate details
     */
    public function show($id)
    {
        $user = User::where('id', $id)->where('user_type', 'affiliate')->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Affiliate not found',
            ], 404);
        }

        $affiliate = Affiliate::where('user_id', $user->id)->first();

        $totalEarnings = Commission::where('user_id', $user->id)
            ->where('user_type', 'affiliate')
            ->sum('amount') ?? 0;
        $totalReferrals = $affiliate?->referrals()->count() ?? 0;
        $totalClicks = $affiliate?->clicks()->count() ?? 0;
        if ($totalClicks === 0 && $affiliate?->total_clicks) {
            $totalClicks = $affiliate->total_clicks;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'status' => $user->status ?? 'pending',
                'total_earnings' => $totalEarnings,
                'total_referrals' => $totalReferrals,
                'total_clicks' => $totalClicks,
                'approval_date' => $user->created_at,
            ],
        ]);
    }

    /**
     * Approve an affiliate
     */
    public function approve($id)
    {
        $affiliate = User::find($id);

        if (!$affiliate || $affiliate->user_type !== 'affiliate') {
            return response()->json([
                'success' => false,
                'message' => 'Affiliate not found',
            ], 404);
        }

        $affiliate->update([
            'status' => 'approved',
        ]);

        // Send approval email
        try {
            if ($affiliate->email) {
                Mail::to($affiliate->email)->send(new AffiliateApprovedMail($affiliate));
                Log::info('Affiliate approval email sent', ['affiliate_id' => $affiliate->id]);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to send affiliate approval email', [
                'affiliate_id' => $affiliate->id,
                'error' => $e->getMessage(),
            ]);
            // Don't fail the approval if email fails
        }

        return response()->json([
            'success' => true,
            'message' => 'Affiliate approved successfully',
            'data' => $affiliate,
        ]);
    }

    /**
     * Reject an affiliate
     */
    public function reject($id, Request $request)
    {
        $affiliate = User::find($id);

        if (!$affiliate || $affiliate->user_type !== 'affiliate') {
            return response()->json([
                'success' => false,
                'message' => 'Affiliate not found',
            ], 404);
        }

        $reason = $request->input('reason');

        $affiliate->update([
            'status' => 'declined',
        ]);

        // Send rejection email
        try {
            if ($affiliate->email) {
                Mail::to($affiliate->email)->send(new AffiliateDeclinedMail($affiliate, $reason));
                Log::info('Affiliate rejection email sent', ['affiliate_id' => $affiliate->id]);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to send affiliate rejection email', [
                'affiliate_id' => $affiliate->id,
                'error' => $e->getMessage(),
            ]);
            // Don't fail the rejection if email fails
        }

        return response()->json([
            'success' => true,
            'message' => 'Affiliate rejected successfully',
            'data' => $affiliate,
        ]);
    }
}
