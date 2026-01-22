<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Updating Affiliate Balance ===\n\n";

$affiliate = App\Models\Affiliate::first();

// Calculate balance from approved commissions
$approvedTotal = App\Models\Commission::where('user_id', $affiliate->user_id)
    ->where('user_type', 'affiliate')
    ->where('status', 'approved')
    ->sum('amount');

$totalEarnings = App\Models\Commission::where('user_id', $affiliate->user_id)
    ->where('user_type', 'affiliate')
    ->sum('amount');

$affiliate->update([
    'balance' => $approvedTotal,
    'total_earnings' => $totalEarnings,
]);

echo "Affiliate ID: {$affiliate->id}\n";
echo "Balance: {$affiliate->balance}\n";
echo "Total Earnings: {$affiliate->total_earnings}\n";
echo "\nDone!\n";
