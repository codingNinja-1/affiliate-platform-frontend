<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Affiliate;
use App\Models\Vendor;

class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $data = $this->getSummaryByUserType($user);

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    private function getSummaryByUserType($user): array
    {
        switch ($user->user_type) {
            case 'affiliate':
                return $this->getAffiliateSummary($user);

            case 'vendor':
                return $this->getVendorSummary($user);

            case 'admin':
            case 'superadmin':
                return $this->getAdminSummary();

            default:
                return $this->getDefaultSummary();
        }
    }

    private function getAffiliateSummary($user): array
    {
        $affiliate = Affiliate::where('user_id', $user->id)->first();

        if (!$affiliate) {
            return [
                'balance' => 0,
                'total_earnings' => 0,
                'total_withdrawn' => 0,
                'pending_balance' => 0,
                'total_sales' => 0,
                'total_clicks' => 0,
            ];
        }

        return [
            'balance' => (float) $affiliate->balance,
            'total_earnings' => (float) $affiliate->total_earnings,
            'total_withdrawn' => (float) $affiliate->total_withdrawn,
            'pending_balance' => (float) $affiliate->pending_balance,
            'total_sales' => (int) $affiliate->total_sales,
            'total_clicks' => (int) $affiliate->total_clicks,
        ];
    }

    private function getVendorSummary($user): array
    {
        $vendor = Vendor::where('user_id', $user->id)->first();

        if (!$vendor) {
            return [
                'balance' => 0,
                'total_earnings' => 0,
                'total_withdrawn' => 0,
                'pending_balance' => 0,
                'total_sales' => 0,
                'total_clicks' => 0,
            ];
        }

        return [
            'balance' => (float) $vendor->balance,
            'total_earnings' => (float) $vendor->total_earnings,
            'total_withdrawn' => (float) $vendor->total_withdrawn,
            'pending_balance' => (float) $vendor->pending_balance,
            'total_sales' => (int) ($vendor->total_sales ?? 0),
            'total_clicks' => 0, // Vendors don't track clicks
        ];
    }

    private function getAdminSummary(): array
    {
        // Platform-wide statistics
        $totalBalance = Affiliate::sum('balance') + Vendor::sum('balance');
        $totalWithdrawn = Affiliate::sum('total_withdrawn') + Vendor::sum('total_withdrawn');
        $pendingBalance = Affiliate::sum('balance') + Vendor::sum('balance');
        $totalSales = Affiliate::sum('total_sales');
        $totalClicks = Affiliate::sum('total_clicks');

        return [
            'balance' => (float) $totalBalance,
            'total_earnings' => (float) ($totalBalance + $totalWithdrawn),
            'total_withdrawn' => (float) $totalWithdrawn,
            'pending_balance' => (float) $pendingBalance,
            'total_sales' => (int) $totalSales,
            'total_clicks' => (int) $totalClicks,
        ];
    }

    private function getDefaultSummary(): array
    {
        return [
            'balance' => 0,
            'total_earnings' => 0,
            'total_withdrawn' => 0,
            'pending_balance' => 0,
            'total_sales' => 0,
            'total_clicks' => 0,
        ];
    }
}
