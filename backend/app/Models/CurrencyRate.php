<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CurrencyRate extends Model
{
    use HasFactory;

    protected $fillable = [
        'from_currency',
        'to_currency',
        'rate',
        'is_active',
        'description',
    ];

    protected $casts = [
        'rate' => 'decimal:6',
        'is_active' => 'boolean',
    ];

    /**
     * Get conversion rate from one currency to another
     */
    public static function getRate(string $fromCurrency, string $toCurrency): ?float
    {
        // If same currency, return 1
        if ($fromCurrency === $toCurrency) {
            return 1.0;
        }

        // Find direct conversion rate
        $rate = self::where('from_currency', strtoupper($fromCurrency))
            ->where('to_currency', strtoupper($toCurrency))
            ->where('is_active', true)
            ->first();

        if ($rate) {
            return (float) $rate->rate;
        }

        // Try inverse conversion (e.g., if NGN->USD doesn't exist, try USD->NGN and inverse it)
        $inverseRate = self::where('from_currency', strtoupper($toCurrency))
            ->where('to_currency', strtoupper($fromCurrency))
            ->where('is_active', true)
            ->first();

        if ($inverseRate && $inverseRate->rate > 0) {
            return 1 / (float) $inverseRate->rate;
        }

        return null;
    }

    /**
     * Convert amount from one currency to another
     */
    public static function convert(float $amount, string $fromCurrency, string $toCurrency): ?float
    {
        $rate = self::getRate($fromCurrency, $toCurrency);

        if ($rate === null) {
            return null;
        }

        return round($amount * $rate, 2);
    }

    /**
     * Scope to get active rates only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get all supported currencies
     */
    public static function getSupportedCurrencies(): array
    {
        $fromCurrencies = self::distinct()->pluck('from_currency')->toArray();
        $toCurrencies = self::distinct()->pluck('to_currency')->toArray();

        return array_unique(array_merge($fromCurrencies, $toCurrencies));
    }
}
