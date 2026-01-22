<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Database Check ===\n";
echo "Affiliates: " . App\Models\Affiliate::count() . "\n";
echo "Commissions: " . App\Models\Commission::count() . "\n";
echo "Transactions: " . App\Models\Transaction::count() . "\n";
echo "Products: " . App\Models\Product::count() . "\n\n";

echo "=== First Affiliate ===\n";
$affiliate = App\Models\Affiliate::first();
if ($affiliate) {
    echo "ID: " . $affiliate->id . "\n";
    echo "Email: " . $affiliate->email . "\n";
    echo "User ID: " . $affiliate->user_id . "\n";
    echo "Balance: " . $affiliate->balance . "\n";
    echo "Currency: " . $affiliate->preferred_currency . "\n\n";

    echo "=== Commissions for this affiliate ===\n";
    $commissions = App\Models\Commission::where('user_id', $affiliate->user_id)
        ->where('user_type', 'affiliate')
        ->get();
    echo "Count: " . $commissions->count() . "\n";
    foreach ($commissions as $comm) {
        echo "  - ID: {$comm->id}, Amount: {$comm->amount}, Status: {$comm->status}\n";
    }
} else {
    echo "No affiliates found!\n";
}
