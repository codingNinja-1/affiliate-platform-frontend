<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Transaction;
use App\Models\Withdrawal;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReportsController extends Controller
{
    public function index(Request $request)
    {
        $period = $request->query('period', '30d');
        $startDate = $this->getStartDate($period);

        // Count total users
        $totalUsers = User::count();

        // Calculate total revenue from transactions
        $totalRevenue = Transaction::where('created_at', '>=', $startDate)
            ->sum('amount');

        // Calculate total commissions
        $totalCommissions = Transaction::where('created_at', '>=', $startDate)
            ->sum('commission_amount');

        // Calculate total withdrawals
        $totalWithdrawals = Withdrawal::where('created_at', '>=', $startDate)
            ->where('status', 'approved')
            ->sum('amount');

        // Count active vendors
        $activeVendors = User::where('user_type', 'vendor')
            ->where('status', 'active')
            ->count();

        // Count active affiliates
        $activeAffiliates = User::where('user_type', 'affiliate')
            ->where('status', 'active')
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'totalUsers' => $totalUsers,
                'totalRevenue' => floatval($totalRevenue),
                'totalCommissions' => floatval($totalCommissions),
                'totalWithdrawals' => floatval($totalWithdrawals),
                'activeVendors' => $activeVendors,
                'activeAffiliates' => $activeAffiliates,
                'period' => $period,
            ]
        ]);
    }

    private function getStartDate(string $period): Carbon
    {
        return match($period) {
            '7d' => Carbon::now()->subDays(7),
            '30d' => Carbon::now()->subDays(30),
            '90d' => Carbon::now()->subDays(90),
            '1y' => Carbon::now()->subYear(),
            default => Carbon::now()->subDays(30),
        };
    }
}
