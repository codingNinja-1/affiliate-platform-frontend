<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Latest Transactions ===\n";
$transactions = App\Models\Transaction::orderBy('id', 'desc')->take(5)->get();

foreach ($transactions as $txn) {
    echo "ID: {$txn->id}, Ref: {$txn->transaction_ref}\n";
    echo "  Amount: {$txn->amount}, Status: {$txn->status}\n";
    echo "  Affiliate ID: " . ($txn->affiliate_id ?? 'NULL') . "\n";
    echo "  Created: {$txn->created_at}\n\n";
}

echo "\n=== Creating commission for User ID 4 (timilehinaruaji@gmail.com) ===\n\n";

// Get the logged-in affiliate
$affiliate = App\Models\Affiliate::where('user_id', 4)->first();
$latestTxn = App\Models\Transaction::latest()->first();

if ($affiliate && $latestTxn) {
    // Link transaction to this affiliate
    $latestTxn->update(['affiliate_id' => $affiliate->id]);
    
    // Create commission
    $commission = App\Models\Commission::create([
        'user_id' => $affiliate->user_id,
        'user_type' => 'affiliate',
        'product_id' => $latestTxn->product_id,
        'transaction_id' => $latestTxn->id,
        'amount' => $latestTxn->commission_amount,
        'rate' => App\Models\Product::find($latestTxn->product_id)->commission_rate ?? 15,
        'currency' => 'NGN',
        'status' => 'approved',
        'approved_at' => now(),
    ]);
    
    echo "Commission created!\n";
    echo "  ID: {$commission->id}\n";
    echo "  Amount: {$commission->amount}\n\n";
    
    // Update affiliate balance
    $affiliate->increment('total_sales');
    $affiliate->increment('balance', $commission->amount);
    $affiliate->increment('total_earnings', $commission->amount);
    
    $affiliate->refresh();
    
    echo "Affiliate updated!\n";
    echo "  Balance: {$affiliate->balance}\n";
    echo "  Total Earnings: {$affiliate->total_earnings}\n";
    echo "  Total Sales: {$affiliate->total_sales}\n";
} else {
    echo "ERROR: Affiliate or transaction not found!\n";
}
