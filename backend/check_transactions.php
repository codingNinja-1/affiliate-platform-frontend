<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Transactions ===\n";
$transactions = App\Models\Transaction::all();
foreach ($transactions as $txn) {
    echo "ID: {$txn->id}\n";
    echo "  Ref: {$txn->transaction_ref}\n";
    echo "  Amount: {$txn->amount}\n";
    echo "  Product ID: {$txn->product_id}\n";
    echo "  Affiliate ID: {$txn->affiliate_id}\n";
    echo "  Status: {$txn->status}\n";
    echo "  Created: {$txn->created_at}\n\n";
}

echo "\n=== Creating Test Commission ===\n";
$affiliate = App\Models\Affiliate::first();
$product = App\Models\Product::first();
$transaction = App\Models\Transaction::first();

if ($affiliate && $product && $transaction) {
    $commission = App\Models\Commission::create([
        'user_id' => $affiliate->user_id,
        'user_type' => 'affiliate',
        'product_id' => $product->id,
        'transaction_id' => $transaction->id,
        'amount' => 1000.00,
        'status' => 'pending',
        'tier' => 1,
    ]);
    echo "Commission created: ID {$commission->id}, Amount: {$commission->amount}\n";
} else {
    echo "Missing data to create commission\n";
}
