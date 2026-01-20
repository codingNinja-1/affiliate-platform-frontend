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
            ->where('status', 'approved')
            ->get();

        $totalRevenue = $commissions->sum('amount');
        $totalSales = $commissions->count();
        $conversionRate = $clicks > 0 ? ($totalSales / $clicks * 100) : 0;
        $avgOrderValue = $totalSales > 0 ? $totalRevenue / $totalSales : 0;

        // Calculate growth rate (compare to previous period)
        $periodDays = $startDate->diffInDays(now());
        $previousStartDate = (clone $startDate)->subDays($periodDays);
        $previousEndDate = (clone $startDate)->subSecond();

        $previousSales = Commission::whereBetween('created_at', [$previousStartDate, $previousEndDate])
            ->where('user_id', $user->id)
            ->where('user_type', 'affiliate')
            ->where('status', 'approved')
            ->count();

        $growthRate = 0;
        if ($previousSales > 0) {
            $growthRate = (($totalSales - $previousSales) / $previousSales) * 100;
        } elseif ($totalSales > 0) {
            $growthRate = 100;
        }

        // Get top performing products
        $topProducts = Commission::selectRaw('product_id, COUNT(*) as sales_count, SUM(amount) as revenue')
            ->whereBetween('created_at', [$startDate, now()])
            ->where('user_id', $user->id)
            ->where('user_type', 'affiliate')
            ->where('status', 'approved')
            ->groupBy('product_id')
            ->orderBy('revenue', 'desc')
            ->limit(5)
            ->with('product:id,name,price')
            ->get()
            ->map(function ($item) {
                return [
                    'product_id' => $item->product_id,
                    'product_name' => $item->product->name ?? 'Unknown',
                    'sales_count' => $item->sales_count,
                    'revenue' => (float) $item->revenue,
                ];
            });

        // Get daily sales for chart
        $dailySales = Commission::selectRaw('DATE(created_at) as date, COUNT(*) as sales, SUM(amount) as revenue')
            ->whereBetween('created_at', [$startDate, now()])
            ->where('user_id', $user->id)
            ->where('user_type', 'affiliate')
            ->where('status', 'approved')
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'sales' => $item->sales,
                    'revenue' => (float) $item->revenue,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => [
                'totalRevenue' => (float) $totalRevenue,
                'totalSales' => $totalSales,
                'conversionRate' => round($conversionRate, 2),
                'growthRate' => round($growthRate, 2),
                'avgOrderValue' => (float) $avgOrderValue,
                'clicks' => $clicks,
                'period' => $period,
                'startDate' => $startDate->toDateString(),
                'endDate' => now()->toDateString(),
                'topProducts' => $topProducts,
                'dailySales' => $dailySales,
            ],
        ]);
    }
}
