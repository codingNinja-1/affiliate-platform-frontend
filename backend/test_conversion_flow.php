<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "\n=== CONVERSION FLOW TEST ===\n\n";

// 1. Check recent transactions
echo "1. Recent Transactions:\n";
$transactions = \App\Models\Transaction::latest()
    ->with(['affiliate', 'product', 'customer'])
    ->limit(5)
    ->get();

if ($transactions->count() === 0) {
    echo "   ❌ No transactions found\n";
} else {
    foreach ($transactions as $t) {
        echo "   Ref: {$t->transaction_ref}\n";
        echo "   Status: {$t->status}\n";
        echo "   Product: " . ($t->product?->name ?? 'MISSING') . "\n";
        echo "   Affiliate ID: " . ($t->affiliate_id ?? 'NULL') . "\n";
        echo "   Commission Amount: ₦" . $t->commission_amount . "\n";
        echo "   ---\n";
    }
}

// 2. Check recent commissions
echo "\n2. Recent Commissions:\n";
$commissions = \App\Models\Commission::latest()
    ->with(['affiliate.user', 'product'])
    ->limit(5)
    ->get();

if ($commissions->count() === 0) {
    echo "   ❌ No commissions found\n";
} else {
    foreach ($commissions as $c) {
        echo "   Amount: ₦" . $c->amount . "\n";
        echo "   Status: {$c->status}\n";
        echo "   Affiliate: " . ($c->affiliate?->user?->email ?? 'MISSING') . "\n";
        echo "   Transaction: " . ($c->transaction?->transaction_ref ?? 'MISSING') . "\n";
        echo "   ---\n";
    }
}

// 3. Check affiliate clicks
echo "\n3. Affiliate Clicks:\n";
$clicks = \App\Models\AffiliateClick::latest()
    ->with(['affiliate.user', 'product'])
    ->limit(5)
    ->get();

if ($clicks->count() === 0) {
    echo "   ❌ No clicks found\n";
} else {
    foreach ($clicks as $click) {
        echo "   Affiliate: " . ($click->affiliate?->user?->email ?? 'MISSING') . "\n";
        echo "   Product: " . ($click->product?->name ?? 'MISSING') . "\n";
        echo "   Converted: " . ($click->converted ? 'YES' : 'NO') . "\n";
        echo "   Transaction ID: " . ($click->transaction_id ?? 'NULL') . "\n";
        echo "   ---\n";
    }
}

// 4. Check affiliate balances
echo "\n4. Affiliate Balances:\n";
$affiliates = \App\Models\Affiliate::where('total_sales', '>', 0)
    ->with('user')
    ->get();

if ($affiliates->count() === 0) {
    echo "   ❌ No affiliates with sales\n";
} else {
    foreach ($affiliates as $aff) {
        echo "   Email: " . ($aff->user?->email ?? 'MISSING') . "\n";
        echo "   Balance: ₦" . $aff->balance . "\n";
        echo "   Total Sales: " . $aff->total_sales . "\n";
        echo "   Total Earnings: ₦" . $aff->total_earnings . "\n";
        echo "   ---\n";
    }
}

echo "\n✅ Test complete.\n";
