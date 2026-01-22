<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Creating Test Commissions ===\n\n";

$affiliate = App\Models\Affiliate::first();
$products = App\Models\Product::take(3)->get();
$transactions = App\Models\Transaction::take(3)->get();

if (!$affiliate) {
    echo "No affiliate found!\n";
    exit;
}

echo "Affiliate User ID: {$affiliate->user_id}\n\n";

// Create 3 sample commissions
for ($i = 0; $i < 3; $i++) {
    $product = $products[$i] ?? $products[0];
    $transaction = $transactions[$i] ?? $transactions[0];

    $commission = App\Models\Commission::create([
        'user_id' => $affiliate->user_id,
        'user_type' => 'affiliate',
        'product_id' => $product->id,
        'transaction_id' => $transaction->id,
        'amount' => 750.00 + ($i * 250),
        'rate' => $product->commission_rate ?? 15.00,
        'currency' => 'NGN',
        'status' => $i === 0 ? 'approved' : 'pending',
    ]);

    $num = $i + 1;
    echo "Commission {$num} created:\n";
    echo "  ID: {$commission->id}\n";
    echo "  Amount: {$commission->amount}\n";
    echo "  Product: {$product->name}\n";
    echo "  Status: {$commission->status}\n\n";
}

echo "=== Total Commissions: " . App\Models\Commission::count() . " ===\n";
