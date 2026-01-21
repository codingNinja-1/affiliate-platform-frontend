<?php

namespace App\Services;

use App\Models\CurrencyRate;
use Illuminate\Support\Facades\Cache;

class CurrencyConversionService
{
    /**
     * Default cache TTL (in seconds) - 1 hour
     */
    private const CACHE_TTL = 3600;

    /**
     * Convert amount from one currency to another
     *
     * @param float $amount The amount to convert
     * @param string $fromCurrency Source currency code (e.g., 'USD')
     * @param string $toCurrency Target currency code (e.g., 'NGN')
     * @param bool $useCache Whether to use cached rates
     * @return float|null Converted amount or null if conversion not possible
     */
    public function convert(
        float $amount,
        string $fromCurrency,
        string $toCurrency,
        bool $useCache = true
    ): ?float {
        // If same currency, return the amount as-is
        if (strtoupper($fromCurrency) === strtoupper($toCurrency)) {
            return $amount;
        }

        $rate = $useCache
            ? $this->getCachedRate($fromCurrency, $toCurrency)
            : $this->getRate($fromCurrency, $toCurrency);

        if ($rate === null) {
            return null;
        }

        return round($amount * $rate, 2);
    }

    /**
     * Get exchange rate between two currencies
     *
     * @param string $fromCurrency
     * @param string $toCurrency
     * @return float|null
     */
    public function getRate(string $fromCurrency, string $toCurrency): ?float
    {
        return CurrencyRate::getRate($fromCurrency, $toCurrency);
    }

    /**
     * Get cached exchange rate
     *
     * @param string $fromCurrency
     * @param string $toCurrency
     * @return float|null
     */
    private function getCachedRate(string $fromCurrency, string $toCurrency): ?float
    {
        $cacheKey = $this->getCacheKey($fromCurrency, $toCurrency);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($fromCurrency, $toCurrency) {
            return $this->getRate($fromCurrency, $toCurrency);
        });
    }

    /**
     * Clear rate cache for specific currency pair
     *
     * @param string $fromCurrency
     * @param string $toCurrency
     * @return void
     */
    public function clearCache(string $fromCurrency, string $toCurrency): void
    {
        $cacheKey = $this->getCacheKey($fromCurrency, $toCurrency);
        Cache::forget($cacheKey);

        // Also clear inverse rate
        $inverseCacheKey = $this->getCacheKey($toCurrency, $fromCurrency);
        Cache::forget($inverseCacheKey);
    }

    /**
     * Clear all currency rate caches
     *
     * @return void
     */
    public function clearAllCache(): void
    {
        $currencies = CurrencyRate::getSupportedCurrencies();

        foreach ($currencies as $from) {
            foreach ($currencies as $to) {
                if ($from !== $to) {
                    $this->clearCache($from, $to);
                }
            }
        }
    }

    /**
     * Get cache key for currency pair
     *
     * @param string $fromCurrency
     * @param string $toCurrency
     * @return string
     */
    private function getCacheKey(string $fromCurrency, string $toCurrency): string
    {
        $from = strtoupper($fromCurrency);
        $to = strtoupper($toCurrency);
        return "currency_rate:{$from}:{$to}";
    }

    /**
     * Convert multiple amounts in batch
     *
     * @param array $amounts Array of ['amount' => float, 'from' => string, 'to' => string]
     * @param bool $useCache
     * @return array Array of converted amounts
     */
    public function batchConvert(array $amounts, bool $useCache = true): array
    {
        $results = [];

        foreach ($amounts as $key => $item) {
            $results[$key] = [
                'original_amount' => $item['amount'],
                'from_currency' => $item['from'],
                'to_currency' => $item['to'],
                'converted_amount' => $this->convert(
                    $item['amount'],
                    $item['from'],
                    $item['to'],
                    $useCache
                ),
            ];
        }

        return $results;
    }

    /**
     * Format amount with currency symbol
     *
     * @param float $amount
     * @param string $currency
     * @return string
     */
    public function formatAmount(float $amount, string $currency): string
    {
        $symbols = [
            'NGN' => '₦',
            'USD' => '$',
            'GBP' => '£',
            'EUR' => '€',
            'JPY' => '¥',
            'CNY' => '¥',
        ];

        $symbol = $symbols[strtoupper($currency)] ?? strtoupper($currency) . ' ';

        return $symbol . number_format($amount, 2);
    }

    /**
     * Get all supported currencies
     *
     * @return array
     */
    public function getSupportedCurrencies(): array
    {
        return CurrencyRate::getSupportedCurrencies();
    }
}
