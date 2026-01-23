<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\Affiliate;
use App\Models\CurrencyRate;
use App\Services\CurrencyConversionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SettingsController extends Controller
{
    protected CurrencyConversionService $currencyService;

    public function __construct(CurrencyConversionService $currencyService)
    {
        $this->currencyService = $currencyService;
    }

    /**
     * Get affiliate settings including currency preference and bank details
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $affiliate = Affiliate::where('user_id', $user->id)->first();

        if (!$affiliate) {
            return response()->json([
                'success' => false,
                'message' => 'Affiliate profile not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'preferred_currency' => $affiliate->preferred_currency ?? 'NGN',
                'available_currencies' => $this->currencyService->getSupportedCurrencies(),
                'settings' => $affiliate->settings,
                'bank_details' => [
                    'bank_name' => $affiliate->bank_name ?? '',
                    'account_name' => $affiliate->account_name ?? '',
                    'account_number' => $affiliate->account_number ?? '',
                    'bank_code' => $affiliate->bank_code ?? '',
                ],
            ],
        ]);
    }

    /**
     * Update affiliate currency preference
     */
    public function updateCurrency(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'currency' => 'required|string|size:3',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $affiliate = Affiliate::where('user_id', $user->id)->first();

        if (!$affiliate) {
            return response()->json([
                'success' => false,
                'message' => 'Affiliate profile not found',
            ], 404);
        }

        $currency = strtoupper($request->currency);

        // Check if currency is supported (either as source or target)
        $supportedCurrencies = $this->currencyService->getSupportedCurrencies();

        // Always allow NGN as it's the base currency
        if ($currency !== 'NGN' && !in_array($currency, $supportedCurrencies)) {
            return response()->json([
                'success' => false,
                'message' => 'Currency not supported. Please contact admin to add this currency.',
            ], 422);
        }

        // Log before update
        \Log::info('Currency update attempt', [
            'affiliate_id' => $affiliate->id,
            'user_id' => $user->id,
            'current' => $affiliate->preferred_currency,
            'new' => $currency,
        ]);

        // Direct SQL update to bypass any issues
        $rowsAffected = \DB::table('affiliates')
            ->where('id', $affiliate->id)
            ->update(['preferred_currency' => $currency]);

        // Fetch fresh copy
        $freshAffiliate = Affiliate::find($affiliate->id);

        \Log::info('Currency update result', [
            'rows_affected' => $rowsAffected,
            'affiliate_id' => $freshAffiliate->id,
            'preferred_currency' => $freshAffiliate->preferred_currency,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Currency preference updated successfully',
            'data' => [
                'preferred_currency' => $freshAffiliate->preferred_currency,
                'affiliate_id' => $freshAffiliate->id,
                'rows_affected' => $rowsAffected,
            ],
        ]);
    }

    /**
     * Get converted amounts for affiliate dashboard
     */
    public function getConvertedAmounts(Request $request): JsonResponse
    {
        $user = $request->user();
        $affiliate = Affiliate::where('user_id', $user->id)->first();

        if (!$affiliate) {
            return response()->json([
                'success' => false,
                'message' => 'Affiliate profile not found',
            ], 404);
        }

        $preferredCurrency = $affiliate->preferred_currency ?? 'NGN';
        $baseCurrency = 'NGN'; // All amounts are stored in NGN

        // If preferred currency is NGN, no conversion needed
        if ($preferredCurrency === $baseCurrency) {
            return response()->json([
                'success' => true,
                'data' => [
                    'currency' => $baseCurrency,
                    'balance' => (float) $affiliate->balance,
                    'total_earnings' => (float) $affiliate->total_earnings,
                    'total_withdrawn' => (float) $affiliate->total_withdrawn,
                    'conversion_rate' => 1.0,
                ],
            ]);
        }

        // Convert amounts
        $conversionRate = CurrencyRate::getRate($baseCurrency, $preferredCurrency);

        if ($conversionRate === null) {
            return response()->json([
                'success' => false,
                'message' => "Unable to convert to {$preferredCurrency}. Conversion rate not found.",
                'data' => [
                    'currency' => $baseCurrency,
                    'balance' => (float) $affiliate->balance,
                    'total_earnings' => (float) $affiliate->total_earnings,
                    'total_withdrawn' => (float) $affiliate->total_withdrawn,
                    'conversion_rate' => 1.0,
                ],
            ], 200);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'currency' => $preferredCurrency,
                'balance' => $this->currencyService->convert($affiliate->balance, $baseCurrency, $preferredCurrency),
                'total_earnings' => $this->currencyService->convert($affiliate->total_earnings, $baseCurrency, $preferredCurrency),
                'total_withdrawn' => $this->currencyService->convert($affiliate->total_withdrawn, $baseCurrency, $preferredCurrency),
                'conversion_rate' => $conversionRate,
                'original_currency' => $baseCurrency,
            ],
        ]);
    }
}
