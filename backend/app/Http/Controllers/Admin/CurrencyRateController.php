<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CurrencyRate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CurrencyRateController extends Controller
{
    /**
     * Get all currency rates
     */
    public function index(Request $request): JsonResponse
    {
        $query = CurrencyRate::query();

        // Filter by active status if specified
        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        // Filter by currency
        if ($request->has('from_currency')) {
            $query->where('from_currency', strtoupper($request->from_currency));
        }

        if ($request->has('to_currency')) {
            $query->where('to_currency', strtoupper($request->to_currency));
        }

        $rates = $query->orderBy('from_currency')
            ->orderBy('to_currency')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $rates,
            'supported_currencies' => CurrencyRate::getSupportedCurrencies(),
        ]);
    }

    /**
     * Get a specific currency rate
     */
    public function show($id): JsonResponse
    {
        $rate = CurrencyRate::find($id);

        if (!$rate) {
            return response()->json([
                'success' => false,
                'message' => 'Currency rate not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $rate,
        ]);
    }

    /**
     * Create a new currency rate
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'from_currency' => 'required|string|size:3',
            'to_currency' => 'required|string|size:3',
            'rate' => 'required|numeric|min:0.000001',
            'is_active' => 'boolean',
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();
        $data['from_currency'] = strtoupper($data['from_currency']);
        $data['to_currency'] = strtoupper($data['to_currency']);

        // Check if same currency
        if ($data['from_currency'] === $data['to_currency']) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot create conversion rate for the same currency',
            ], 422);
        }

        // Check if rate already exists
        $existing = CurrencyRate::where('from_currency', $data['from_currency'])
            ->where('to_currency', $data['to_currency'])
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'Currency rate already exists. Please update the existing rate.',
            ], 409);
        }

        $rate = CurrencyRate::create($data);

        return response()->json([
            'success' => true,
            'message' => 'Currency rate created successfully',
            'data' => $rate,
        ], 201);
    }

    /**
     * Update a currency rate
     */
    public function update(Request $request, $id): JsonResponse
    {
        $rate = CurrencyRate::find($id);

        if (!$rate) {
            return response()->json([
                'success' => false,
                'message' => 'Currency rate not found',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'from_currency' => 'sometimes|string|size:3',
            'to_currency' => 'sometimes|string|size:3',
            'rate' => 'sometimes|numeric|min:0.000001',
            'is_active' => 'sometimes|boolean',
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        // Normalize currency codes if provided
        if (isset($data['from_currency'])) {
            $data['from_currency'] = strtoupper($data['from_currency']);
        }
        if (isset($data['to_currency'])) {
            $data['to_currency'] = strtoupper($data['to_currency']);
        }

        // Check if trying to make them the same currency
        $fromCurrency = $data['from_currency'] ?? $rate->from_currency;
        $toCurrency = $data['to_currency'] ?? $rate->to_currency;

        if ($fromCurrency === $toCurrency) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot set the same currency for conversion',
            ], 422);
        }

        // Check if update would create duplicate
        if (isset($data['from_currency']) || isset($data['to_currency'])) {
            $duplicate = CurrencyRate::where('from_currency', $fromCurrency)
                ->where('to_currency', $toCurrency)
                ->where('id', '!=', $id)
                ->first();

            if ($duplicate) {
                return response()->json([
                    'success' => false,
                    'message' => 'A currency rate with these currencies already exists',
                ], 409);
            }
        }

        $rate->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Currency rate updated successfully',
            'data' => $rate,
        ]);
    }

    /**
     * Delete a currency rate
     */
    public function destroy($id): JsonResponse
    {
        $rate = CurrencyRate::find($id);

        if (!$rate) {
            return response()->json([
                'success' => false,
                'message' => 'Currency rate not found',
            ], 404);
        }

        $rate->delete();

        return response()->json([
            'success' => true,
            'message' => 'Currency rate deleted successfully',
        ]);
    }

    /**
     * Convert amount between currencies
     */
    public function convert(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0',
            'from_currency' => 'required|string|size:3',
            'to_currency' => 'required|string|size:3',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $amount = $request->amount;
        $fromCurrency = strtoupper($request->from_currency);
        $toCurrency = strtoupper($request->to_currency);

        $convertedAmount = CurrencyRate::convert($amount, $fromCurrency, $toCurrency);

        if ($convertedAmount === null) {
            return response()->json([
                'success' => false,
                'message' => "No conversion rate found for {$fromCurrency} to {$toCurrency}",
            ], 404);
        }

        $rate = CurrencyRate::getRate($fromCurrency, $toCurrency);

        return response()->json([
            'success' => true,
            'data' => [
                'original_amount' => (float) $amount,
                'from_currency' => $fromCurrency,
                'to_currency' => $toCurrency,
                'converted_amount' => $convertedAmount,
                'rate' => $rate,
            ],
        ]);
    }

    /**
     * Get available currencies
     */
    public function currencies(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => CurrencyRate::getSupportedCurrencies(),
        ]);
    }
}
