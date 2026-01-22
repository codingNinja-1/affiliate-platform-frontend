<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== All Affiliates ===\n";
$affiliates = App\Models\Affiliate::with('user')->get();
foreach ($affiliates as $aff) {
    echo "Affiliate ID: {$aff->id}\n";
    echo "  User ID: {$aff->user_id}\n";
    echo "  Email: " . ($aff->user->email ?? 'N/A') . "\n";
    echo "  Balance: {$aff->balance}\n";
    echo "  Total Earnings: {$aff->total_earnings}\n";
    
    $commCount = App\Models\Commission::where('user_id', $aff->user_id)
        ->where('user_type', 'affiliate')
        ->count();
    echo "  Commissions: {$commCount}\n\n";
}

echo "=== Latest Transaction ===\n";
$txn = App\Models\Transaction::latest()->first();
if ($txn) {
    echo "ID: {$txn->id}\n";
    echo "Ref: {$txn->transaction_ref}\n";
    echo "Amount: {$txn->amount}\n";
    echo "Affiliate ID: " . ($txn->affiliate_id ?? 'NULL') . "\n";
    echo "Status: {$txn->status}\n";
    echo "Created: {$txn->created_at}\n";
}
