<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\Withdrawal;
use App\Models\Affiliate;
use App\Models\Vendor;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if (!$user || !in_array($user->user_type, ['admin', 'superadmin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        // Calculate metrics
        $appGrossRevenue = Transaction::where('status', 'completed')->sum('amount') ?? 0;
        $totalTransactions = Transaction::where('status', 'completed')->count() ?? 0;
        $activeVendors = User::where('user_type', 'vendor')->where('status', 'active')->count() ?? 0;

        $vendorEarnings = Transaction::whereNotNull('vendor_id')
            ->where('status', 'completed')
            ->sum('vendor_amount') ?? 0;

        $affiliateEarnings = Transaction::whereNotNull('affiliate_id')
            ->where('status', 'completed')
            ->sum('commission_amount') ?? 0;

        // Use live balances instead of pending withdrawals so numbers match user dashboards
        $unpaidAffiliateBalance = Affiliate::sum('balance') ?? 0;

        $unpaidVendorBalance = Vendor::sum('balance') ?? 0;

        $activeAffiliates = User::where('user_type', 'affiliate')
            ->where('status', 'active')
            ->count() ?? 0;

        $totalCustomers = User::where('user_type', 'customer')
            ->where('status', 'active')
            ->count() ?? 0;

        $approvedProducts = Product::where('approval_status', 'approved')->count() ?? 0;

        $pendingWithdrawals = Withdrawal::where('status', 'pending')->count() ?? 0;

        // We mark withdrawals as approved; sum total_withdrawn to represent payouts
        $totalPaidOut = (Affiliate::sum('total_withdrawn') + Vendor::sum('total_withdrawn')) ?? 0;

        return response()->json([
            'success' => true,
            'data' => [
                'app_gross_revenue' => (float) $appGrossRevenue,
                'total_transactions' => $totalTransactions,
                'active_vendors' => $activeVendors,
                'vendor_earnings' => (float) $vendorEarnings,
                'affiliate_earnings' => (float) $affiliateEarnings,
                'unpaid_affiliate_balance' => (float) $unpaidAffiliateBalance,
                'unpaid_vendor_balance' => (float) $unpaidVendorBalance,
                'active_affiliates' => $activeAffiliates,
                'total_customers' => $totalCustomers,
                'approved_products' => $approvedProducts,
                'pending_withdrawals' => $pendingWithdrawals,
                'total_paid_out' => (float) $totalPaidOut,
            ],
        ]);
    }
}
