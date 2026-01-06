<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\Commission;
use App\Models\AffiliateClick;
use App\Models\Affiliate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Get affiliate analytics and reports.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $affiliate = Affiliate::where('user_id', $user->id)->first();
        if (!$affiliate) {
            return response()->json([
                'success' => true,
                'data' => [
                    'totalRevenue' => 0,
                    'totalSales' => 0,
                    'conversionRate' => 0,
                    'avgOrderValue' => 0,
                    'clicks' => 0,
                    'period' => $request->query('period', '7d'),
                    'startDate' => null,
                    'endDate' => null,
                ],
            ]);
        }
        $period = $request->query('period', '7d');

        $startDate = match($period) {
            '7d' => Carbon::now()->subDays(7),
            '30d' => Carbon::now()->subDays(30),
            '90d' => Carbon::now()->subDays(90),
            '1y' => Carbon::now()->subYear(),
            default => Carbon::now()->subDays(7),
        };

        // Get clicks for affiliate's links (affiliate_id references affiliates.id)
        $clicks = AffiliateClick::whereBetween('created_at', [$startDate, now()])
            ->where('affiliate_id', $affiliate->id)
            ->count();

        // Get commissions for affiliate
        $commissions = Commission::whereBetween('created_at', [$startDate, now()])
            ->where('user_id', $user->id)
            ->where('user_type', 'affiliate')
            ->get();

        $totalRevenue = $commissions->sum('amount');
        $totalSales = $commissions->count();
        $conversionRate = $clicks > 0 ? ($totalSales / $clicks * 100) : 0;
        $avgOrderValue = $totalSales > 0 ? $totalRevenue / $totalSales : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'totalRevenue' => $totalRevenue,
                'totalSales' => $totalSales,
                'conversionRate' => $conversionRate,
                'avgOrderValue' => $avgOrderValue,
                'clicks' => $clicks,
                'period' => $period,
                'startDate' => $startDate->toDateString(),
                'endDate' => now()->toDateString(),
            ],
        ]);
    }
}
