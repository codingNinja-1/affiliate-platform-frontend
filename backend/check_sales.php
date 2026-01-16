<?php

/**
 * Quick diagnostic script to check why affiliate sales aren't recording
 * Run from backend directory: php check_sales.php
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Transaction;
use App\Models\Commission;
use App\Models\Affiliate;
use App\Models\Product;
use App\Models\User;

echo "=== AFFILIATE SALES DIAGNOSTIC ===\n\n";

// Check products
$products = Product::count();
echo "Products in database: {$products}\n";
if ($products > 0) {
    $sampleProduct = Product::first();
    echo "Sample product: ID={$sampleProduct->id}, Name={$sampleProduct->name}, Commission Rate={$sampleProduct->commission_rate}%\n";
}

// Check affiliates
$affiliates = Affiliate::count();
echo "\nAffiliates in database: {$affiliates}\n";
if ($affiliates > 0) {
    $sampleAffiliate = Affiliate::with('user')->first();
    echo "Sample affiliate: ID={$sampleAffiliate->id}, Referral Code={$sampleAffiliate->referral_code}, User={$sampleAffiliate->user->email}\n";
}

// Check transactions
$transactions = Transaction::count();
echo "\nTransactions in database: {$transactions}\n";
if ($transactions > 0) {
    $sampleTxn = Transaction::latest()->first();
    echo "Latest transaction: ID={$sampleTxn->id}, Ref={$sampleTxn->transaction_ref}, Status={$sampleTxn->status}, Amount={$sampleTxn->amount}, Affiliate ID={$sampleTxn->affiliate_id}\n";
    echo "  Product ID: {$sampleTxn->product_id}\n";
    echo "  Vendor ID: {$sampleTxn->vendor_id}\n";
    echo "  Customer ID: {$sampleTxn->customer_id}\n";
}

// Check commissions
$commissions = Commission::count();
echo "\nCommissions in database: {$commissions}\n";
if ($commissions > 0) {
    $sampleCommission = Commission::latest()->first();
    echo "Latest commission: ID={$sampleCommission->id}, User ID={$sampleCommission->user_id}, User Type={$sampleCommission->user_type}, Amount={$sampleCommission->amount}, Status={$sampleCommission->status}\n";
}

// Check for completed transactions with no commissions
$completedTxns = Transaction::where('status', 'completed')->count();
$completedWithCommissions = Transaction::where('status', 'completed')
    ->whereHas('commissions')
    ->count();

echo "\nCompleted transactions: {$completedTxns}\n";
echo "Completed transactions WITH commissions: {$completedWithCommissions}\n";
echo "Completed transactions WITHOUT commissions: " . ($completedTxns - $completedWithCommissions) . "\n";

// Check for affiliate-linked transactions
$affiliateTxns = Transaction::whereNotNull('affiliate_id')->count();
echo "\nTransactions linked to affiliates: {$affiliateTxns}\n";

// Check affiliate dashboard stats
if ($affiliates > 0) {
    echo "\n=== AFFILIATE STATS ===\n";
    foreach (Affiliate::with('user')->limit(3)->get() as $aff) {
        $commissionsForAffiliate = Commission::where('user_id', $aff->user_id)
            ->where('user_type', 'affiliate')
            ->count();
        $totalCommissionsAmount = Commission::where('user_id', $aff->user_id)
            ->where('user_type', 'affiliate')
            ->sum('amount');

        echo "Affiliate: {$aff->user->email} (Ref: {$aff->referral_code})\n";
        echo "  Balance: {$aff->balance}, Total Sales: {$aff->total_sales}, Total Clicks: {$aff->total_clicks}\n";
        echo "  Commissions in DB: {$commissionsForAffiliate}, Total Amount: {$totalCommissionsAmount}\n";
    }
}

echo "\n=== RECOMMENDATION ===\n";
if ($transactions === 0) {
    echo "❌ No transactions found. Make a test purchase to create one.\n";
} elseif ($commissions === 0) {
    echo "❌ Transactions exist but no commissions recorded. Commission recording logic may be failing.\n";
    echo "   Check Laravel logs: storage/logs/laravel.log\n";
} elseif ($completedTxns > $completedWithCommissions) {
    echo "⚠️  Some completed transactions don't have commissions. This is unusual.\n";
} else {
    echo "✅ Transactions and commissions appear to be working.\n";
}

echo "\n";
