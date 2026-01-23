<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Affiliate;
use App\Models\AffiliateClick;
use App\Models\Commission;
use App\Models\Vendor;
use App\Services\CurrencyConversionService;

class DashboardController extends Controller
{
    protected $currencyService;

    public function __construct(CurrencyConversionService $currencyService)
    {
        $this->currencyService = $currencyService;
    }

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

    public function affiliateConverted(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || $user->user_type !== 'affiliate') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $affiliate = Affiliate::where('user_id', $user->id)->first();

        if (!$affiliate) {
            return response()->json([
                'success' => false,
                'message' => 'Affiliate not found'
            ], 404);
        }

        // Get the affiliate's preferred currency
        $preferredCurrency = $affiliate->preferred_currency ?? 'NGN';

        // Get original amounts in NGN
        $approvedCommissions = Commission::where('user_id', $user->id)
            ->where('user_type', 'affiliate')
            ->whereIn('status', ['approved', 'paid']);
        $totalEarnings = (float) $approvedCommissions->sum('amount');

        $totalWithdrawn = (float) $affiliate->withdrawals()
            ->where('status', 'approved')
            ->sum('amount');

        $pendingBalance = (float) $affiliate->withdrawals()
            ->where('status', 'pending')
            ->sum('amount');

        $balance = max($totalEarnings - $totalWithdrawn, 0);

        // Convert amounts
        $conversionRate = $this->currencyService->getRate('NGN', $preferredCurrency) ?? 1;

        $convertedData = [
            'balance' => $this->currencyService->convert($balance, 'NGN', $preferredCurrency) ?? $balance,
            'pending_balance' => $this->currencyService->convert($pendingBalance, 'NGN', $preferredCurrency) ?? $pendingBalance,
            'total_earnings' => $this->currencyService->convert($totalEarnings, 'NGN', $preferredCurrency) ?? $totalEarnings,
            'total_withdrawn' => $this->currencyService->convert($totalWithdrawn, 'NGN', $preferredCurrency) ?? $totalWithdrawn,
            'currency' => $preferredCurrency,
            'original_currency' => 'NGN',
            'conversion_rate' => $conversionRate,
        ];

        return response()->json([
            'success' => true,
            'data' => $convertedData
        ]);
    }

    public function vendorConverted(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user || $user->user_type !== 'vendor') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }

        $vendor = Vendor::where('user_id', $user->id)->first();

        if (!$vendor) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor not found'
            ], 404);
        }

        // Get the vendor's preferred currency
        $preferredCurrency = $vendor->preferred_currency ?? 'NGN';

        // Get original amounts in NGN
        $balance = (float) $vendor->balance;
        $totalEarnings = (float) $vendor->total_earnings;
        $totalWithdrawn = (float) $vendor->total_withdrawn;
        $pendingBalance = (float) $vendor->pending_balance;

        // Convert amounts
        $conversionRate = $this->currencyService->getRate('NGN', $preferredCurrency) ?? 1;

        $convertedData = [
            'balance' => $this->currencyService->convert($balance, 'NGN', $preferredCurrency) ?? $balance,
            'pending_balance' => $this->currencyService->convert($pendingBalance, 'NGN', $preferredCurrency) ?? $pendingBalance,
            'total_earnings' => $this->currencyService->convert($totalEarnings, 'NGN', $preferredCurrency) ?? $totalEarnings,
            'total_withdrawn' => $this->currencyService->convert($totalWithdrawn, 'NGN', $preferredCurrency) ?? $totalWithdrawn,
            'currency' => $preferredCurrency,
            'original_currency' => 'NGN',
            'conversion_rate' => $conversionRate,
        ];

        return response()->json([
            'success' => true,
            'data' => $convertedData
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

        // Use live aggregates keyed by user_id so totals reflect actual commissions
        $approvedCommissions = Commission::where('user_id', $user->id)
            ->where('user_type', 'affiliate')
            ->whereIn('status', ['approved', 'paid']);
        $totalEarnings = (float) $approvedCommissions->sum('amount');
        $totalSales = (int) $approvedCommissions->count();

        $totalWithdrawn = (float) $affiliate->withdrawals()
            ->where('status', 'approved')
            ->sum('amount');

        $pendingBalance = (float) $affiliate->withdrawals()
            ->where('status', 'pending')
            ->sum('amount');

        // Derive available balance from earnings minus approved payouts
        $derivedBalance = max($totalEarnings - $totalWithdrawn, 0);

        $totalClicks = (int) AffiliateClick::where('affiliate_id', $affiliate->id)->count();

        return [
            'balance' => $derivedBalance,
            'total_earnings' => $totalEarnings,
            'total_withdrawn' => $totalWithdrawn,
            'pending_balance' => $pendingBalance,
            'total_sales' => $totalSales,
            'total_clicks' => $totalClicks,
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
