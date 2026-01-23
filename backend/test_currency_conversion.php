<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "\n=== CURRENCY CONVERSION TEST ===\n\n";

// 1. Check currency rates
echo "1. Currency Rates in Database:\n";
$rates = \App\Models\CurrencyRate::all();
if ($rates->count() === 0) {
    echo "   ❌ No currency rates found\n";
} else {
    echo "   ✅ " . $rates->count() . " rates found:\n";
    foreach ($rates as $rate) {
        echo "   {$rate->from_currency} → {$rate->to_currency}: {$rate->rate} (Active: " . ($rate->is_active ? 'Yes' : 'No') . ")\n";
    }
}

// 2. Test conversion
echo "\n2. Test Conversion (NGN to USD):\n";
$conversionResult = \App\Models\CurrencyRate::convert(1000, 'NGN', 'USD');
if ($conversionResult === null) {
    echo "   ❌ Conversion failed - no rate found\n";
} else {
    echo "   ✅ 1000 NGN = " . $conversionResult . " USD\n";
}

// 3. Check affiliate currency preferences
echo "\n3. Affiliate Currency Preferences:\n";
$affiliates = \App\Models\Affiliate::with('user')->get();
if ($affiliates->count() === 0) {
    echo "   ❌ No affiliates found\n";
} else {
    foreach ($affiliates as $aff) {
        $currency = $aff->preferred_currency ?? 'NULL';
        echo "   Affiliate ID {$aff->id} ({$aff->user?->email}): Currency = {$currency}\n";
    }
}

// 4. Test SettingsController conversion endpoint
echo "\n4. Test Affiliate Converted Amounts (Affiliate ID 2):\n";
$affiliate = \App\Models\Affiliate::find(2);
if (!$affiliate) {
    echo "   ❌ Affiliate ID 2 not found\n";
} else {
    $baseCurrency = 'NGN';
    $preferredCurrency = $affiliate->preferred_currency ?? 'NGN';
    echo "   Affiliate: " . $affiliate->user->email . "\n";
    echo "   Preferred Currency: " . ($preferredCurrency ?? 'Not set') . "\n";
    echo "   Balance: ₦" . $affiliate->balance . "\n";

    if ($preferredCurrency && $preferredCurrency !== $baseCurrency) {
        $conversionRate = \App\Models\CurrencyRate::getRate($baseCurrency, $preferredCurrency);
        if ($conversionRate) {
            $convertedBalance = $affiliate->balance * $conversionRate;
            echo "   Conversion Rate: " . $conversionRate . "\n";
            echo "   Converted Balance: " . $convertedBalance . " " . $preferredCurrency . "\n";
        } else {
            echo "   ❌ No conversion rate found for {$baseCurrency} to {$preferredCurrency}\n";
        }
    } else {
        echo "   (No conversion needed - already in base currency)\n";
    }
}

// 5. Check if conversion endpoint would work
echo "\n5. Test CurrencyConversionService:\n";
$service = new \App\Services\CurrencyConversionService();
$testAmount = 80750;
$converted = $service->convert($testAmount, 'NGN', 'USD', false);
if ($converted === null) {
    echo "   ❌ Service conversion failed\n";
} else {
    echo "   ✅ Service: " . $testAmount . " NGN = " . $converted . " USD\n";
}

echo "\n✅ Test complete.\n";
