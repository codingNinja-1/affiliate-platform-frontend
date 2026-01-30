<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get converted amounts for affiliate dashboard
     */
    public function converted(Request $request)
    {
        $user = $request->user();
        \Log::info('Affiliate DashboardController@converted called', ['user_id' => $user ? $user->id : null]);
        $affiliate = \App\Models\Affiliate::where('user_id', $user->id)->first();

        if (!$affiliate) {
            \Log::warning('Affiliate not found for user', ['user_id' => $user->id]);
            return response()->json([
                'success' => false,
                'message' => 'Affiliate profile not found',
            ], 404);
        }

        $baseCurrency = 'NGN'; // All amounts are stored in NGN
        $requestedCurrency = strtoupper($request->query('currency', $affiliate->preferred_currency ?? $baseCurrency));
        \Log::info('Requested currency', ['requestedCurrency' => $requestedCurrency, 'affiliate_id' => $affiliate->id]);

        // Calculate pending balance
        $pendingBalance = (float) $affiliate->withdrawals()
            ->where('status', 'pending')
            ->sum('amount');

        // If requested currency is NGN, no conversion needed
        if ($requestedCurrency === $baseCurrency) {
            $data = [
                'currency' => $baseCurrency,
                'balance' => (float) $affiliate->balance,
                'total_earnings' => (float) $affiliate->total_earnings,
                'total_withdrawn' => (float) $affiliate->total_withdrawn,
                'pending_balance' => $pendingBalance,
                'conversion_rate' => 1.0,
                'original_currency' => $baseCurrency,
            ];
            \Log::info('Returning NGN data', $data);
            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        }

        $conversionRate = \App\Models\CurrencyRate::getRate($baseCurrency, $requestedCurrency);
        \Log::info('Conversion rate lookup', ['rate' => $conversionRate, 'from' => $baseCurrency, 'to' => $requestedCurrency]);

        if ($conversionRate === null) {
            $data = [
                'currency' => $baseCurrency,
                'balance' => (float) $affiliate->balance,
                'total_earnings' => (float) $affiliate->total_earnings,
                'total_withdrawn' => (float) $affiliate->total_withdrawn,
                'pending_balance' => $pendingBalance,
                'conversion_rate' => 1.0,
                'original_currency' => $baseCurrency,
            ];
            \Log::warning('Conversion rate not found', ['requestedCurrency' => $requestedCurrency, 'affiliate_id' => $affiliate->id]);
            return response()->json([
                'success' => false,
                'message' => "Unable to convert to {$requestedCurrency}. Conversion rate not found.",
                'data' => $data,
            ], 200);
        }

        $currencyService = app(\App\Services\CurrencyConversionService::class);
        $converted = [
            'currency' => $requestedCurrency,
            'balance' => $currencyService->convert($affiliate->balance, $baseCurrency, $requestedCurrency),
            'total_earnings' => $currencyService->convert($affiliate->total_earnings, $baseCurrency, $requestedCurrency),
            'total_withdrawn' => $currencyService->convert($affiliate->total_withdrawn, $baseCurrency, $requestedCurrency),
            'pending_balance' => $currencyService->convert($pendingBalance, $baseCurrency, $requestedCurrency),
            'conversion_rate' => $conversionRate,
            'original_currency' => $baseCurrency,
        ];
        \Log::info('Returning converted data', $converted);
        return response()->json([
            'success' => true,
            'data' => $converted,
        ]);
    }
}
