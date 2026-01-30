<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function converted(Request $request)
    {
        $user = $request->user();
        
        // Get vendor data from database
        $vendor = \App\Models\Vendor::where('user_id', $user->id)->first();
        
        if (!$vendor) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor profile not found',
            ], 404);
        }

        $baseCurrency = 'NGN'; // All amounts are stored in NGN
        $selectedCurrency = strtoupper($request->query('currency', $vendor->preferred_currency ?? $baseCurrency));

        // Calculate pending payouts from pending withdrawals
        $pendingPayouts = (float) $vendor->withdrawals()
            ->where('status', 'pending')
            ->sum('amount');

        // If selected currency is NGN, no conversion needed
        if ($selectedCurrency === $baseCurrency) {
            $data = [
                'success' => true,
                'data' => [
                    'balance' => (float) $vendor->balance,
                    'total_earnings' => (float) $vendor->total_earnings,
                    'total_withdrawn' => (float) $vendor->total_withdrawn,
                    'pending_balance' => $pendingPayouts,
                    'total_sales' => (int) $vendor->total_sales,
                    'currency' => $baseCurrency,
                    'original_currency' => $baseCurrency,
                    'conversion_rate' => 1.0,
                ]
            ];
            return response()->json($data);
        }

        // Get conversion rate
        $conversionRate = \App\Models\CurrencyRate::getRate($baseCurrency, $selectedCurrency);

        if ($conversionRate === null) {
            return response()->json([
                'success' => false,
                'message' => "Unable to convert to {$selectedCurrency}. Conversion rate not found.",
                'data' => [
                    'balance' => (float) $vendor->balance,
                    'total_earnings' => (float) $vendor->total_earnings,
                    'total_withdrawn' => (float) $vendor->total_withdrawn,
                    'pending_balance' => $pendingPayouts,
                    'total_sales' => (int) $vendor->total_sales,
                    'currency' => $baseCurrency,
                    'conversion_rate' => 1.0,
                ]
            ], 200);
        }

        // Convert amounts using currency conversion service
        $conversionService = app(\App\Services\CurrencyConversionService::class);

        return response()->json([
            'success' => true,
            'data' => [
                'balance' => $conversionService->convert((float) $vendor->balance, $baseCurrency, $selectedCurrency),
                'total_earnings' => $conversionService->convert((float) $vendor->total_earnings, $baseCurrency, $selectedCurrency),
                'total_withdrawn' => $conversionService->convert((float) $vendor->total_withdrawn, $baseCurrency, $selectedCurrency),
                'pending_balance' => $conversionService->convert($pendingPayouts, $baseCurrency, $selectedCurrency),
                'total_sales' => (int) $vendor->total_sales,
                'currency' => $selectedCurrency,
                'original_currency' => $baseCurrency,
                'conversion_rate' => $conversionRate,
            ]
        ]);
    }
}
