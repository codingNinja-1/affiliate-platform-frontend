<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Models\Commission;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Get vendor analytics and reports.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $vendor = Vendor::where('user_id', $user->id)->first();
        if (!$vendor) {
            return response()->json([
                'success' => true,
                'data' => [
                    'totalRevenue' => 0,
                    'totalSales' => 0,
                    'conversionRate' => 0,
                    'avgOrderValue' => 0,
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

        // Get transactions for vendor's products (vendor_id references vendors.id)
        $transactions = Transaction::whereBetween('created_at', [$startDate, now()])
            ->where('vendor_id', $vendor->id)
            ->where('status', 'completed')
            ->get();

        $totalRevenue = $transactions->sum('vendor_amount');
        $totalSales = $transactions->count();
        $avgOrderValue = $totalSales > 0 ? $totalRevenue / $totalSales : 0;

        // Calculate growth rate (compare to previous period)
        $periodDays = $startDate->diffInDays(now());
        $previousStartDate = (clone $startDate)->subDays($periodDays);
        $previousEndDate = (clone $startDate)->subSecond();

        $previousSales = Transaction::whereBetween('created_at', [$previousStartDate, $previousEndDate])
            ->where('vendor_id', $vendor->id)
            ->where('status', 'completed')
            ->count();

        $growthRate = 0;
        if ($previousSales > 0) {
            $growthRate = (($totalSales - $previousSales) / $previousSales) * 100;
        } elseif ($totalSales > 0) {
            $growthRate = 100; // 100% growth from 0
        }

        // Get top performing products
        $topProducts = Transaction::selectRaw('product_id, COUNT(*) as sales_count, SUM(vendor_amount) as revenue')
            ->whereBetween('created_at', [$startDate, now()])
            ->where('vendor_id', $vendor->id)
            ->where('status', 'completed')
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
        $dailySales = Transaction::selectRaw('DATE(created_at) as date, COUNT(*) as sales, SUM(vendor_amount) as revenue')
            ->whereBetween('created_at', [$startDate, now()])
            ->where('vendor_id', $vendor->id)
            ->where('status', 'completed')
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
                'conversionRate' => round($growthRate, 2),
                'avgOrderValue' => (float) $avgOrderValue,
                'period' => $period,
                'startDate' => $startDate->toDateString(),
                'endDate' => now()->toDateString(),
                'topProducts' => $topProducts,
                'dailySales' => $dailySales,
            ],
        ]);
    }
}
