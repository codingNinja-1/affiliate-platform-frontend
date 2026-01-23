<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
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
     * Get vendor settings including currency preference
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $vendor = Vendor::where('user_id', $user->id)->first();

        if (!$vendor) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor profile not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'preferred_currency' => $vendor->preferred_currency ?? 'NGN',
                'available_currencies' => $this->currencyService->getSupportedCurrencies(),
                'settings' => $vendor->settings,
            ],
        ]);
    }

    /**
     * Update vendor currency preference
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
        $vendor = Vendor::where('user_id', $user->id)->first();

        if (!$vendor) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor profile not found',
            ], 404);
        }

        $currency = strtoupper($request->currency);

        // Check if currency is supported
        $supportedCurrencies = $this->currencyService->getSupportedCurrencies();

        if ($currency !== 'NGN' && !in_array($currency, $supportedCurrencies)) {
            return response()->json([
                'success' => false,
                'message' => 'Currency not supported.',
            ], 422);
        }

        // Direct SQL update
        $rowsAffected = \DB::table('vendors')
            ->where('id', $vendor->id)
            ->update(['preferred_currency' => $currency]);

        // Fetch fresh copy
        $freshVendor = Vendor::find($vendor->id);

        \Log::info('Vendor currency update', [
            'vendor_id' => $freshVendor->id,
            'preferred_currency' => $freshVendor->preferred_currency,
            'rows_affected' => $rowsAffected,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Currency preference updated successfully',
            'data' => [
                'preferred_currency' => $freshVendor->preferred_currency,
            ],
        ]);
    }

    /**
     * Get converted amounts for vendor dashboard
     */
    public function getConvertedAmounts(Request $request): JsonResponse
    {
        $user = $request->user();
        $vendor = Vendor::where('user_id', $user->id)->first();

        if (!$vendor) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor profile not found',
            ], 404);
        }

        $preferredCurrency = $vendor->preferred_currency ?? 'NGN';
        $baseCurrency = 'NGN';

        if ($preferredCurrency === $baseCurrency) {
            return response()->json([
                'success' => true,
                'data' => [
                    'currency' => $baseCurrency,
                    'balance' => (float) $vendor->balance,
                    'total_earnings' => (float) $vendor->total_earnings,
                    'total_withdrawn' => (float) $vendor->total_withdrawn,
                    'conversion_rate' => 1.0,
                ],
            ]);
        }

        $conversionRate = CurrencyRate::getRate($baseCurrency, $preferredCurrency);

        if ($conversionRate === null) {
            return response()->json([
                'success' => false,
                'message' => "Unable to convert to {$preferredCurrency}",
                'data' => [
                    'currency' => $baseCurrency,
                    'balance' => (float) $vendor->balance,
                    'total_earnings' => (float) $vendor->total_earnings,
                    'total_withdrawn' => (float) $vendor->total_withdrawn,
                    'conversion_rate' => 1.0,
                ],
            ], 200);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'currency' => $preferredCurrency,
                'balance' => $this->currencyService->convert($vendor->balance, $baseCurrency, $preferredCurrency),
                'total_earnings' => $this->currencyService->convert($vendor->total_earnings, $baseCurrency, $preferredCurrency),
                'total_withdrawn' => $this->currencyService->convert($vendor->total_withdrawn, $baseCurrency, $preferredCurrency),
                'conversion_rate' => $conversionRate,
                'original_currency' => $baseCurrency,
            ],
        ]);
    }
}
