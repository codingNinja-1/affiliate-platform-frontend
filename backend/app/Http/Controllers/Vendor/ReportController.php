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
            ->get();

        $totalRevenue = $transactions->sum('amount');
        $totalSales = $transactions->count();
        $conversionRate = $totalSales > 0 ? ($totalSales / 100) : 0;
        $avgOrderValue = $totalSales > 0 ? $totalRevenue / $totalSales : 0;

        return response()->json([
            'success' => true,
            'data' => [
                'totalRevenue' => $totalRevenue,
                'totalSales' => $totalSales,
                'conversionRate' => $conversionRate,
                'avgOrderValue' => $avgOrderValue,
                'period' => $period,
                'startDate' => $startDate->toDateString(),
                'endDate' => now()->toDateString(),
            ],
        ]);
    }
}
