<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$affiliateId = 2; // Your affiliate ID

echo "=== Checking Click Tracking for Affiliate ID {$affiliateId} ===\n\n";

$affiliate = App\Models\Affiliate::find($affiliateId);

if (!$affiliate) {
    echo "Affiliate not found!\n";
    exit;
}

echo "Affiliate: {$affiliate->user->email}\n";
echo "Referral Code: {$affiliate->referral_code}\n\n";

// Check clicks
echo "=== Affiliate Clicks ===\n";
$clicks = App\Models\AffiliateClick::where('affiliate_id', $affiliateId)
    ->with('product')
    ->orderBy('created_at', 'desc')
    ->get();

echo "Total Clicks: " . $clicks->count() . "\n\n";

if ($clicks->count() > 0) {
    foreach ($clicks as $click) {
        echo "Product: " . ($click->product->name ?? 'N/A') . "\n";
        echo "  IP: {$click->ip_address}\n";
        echo "  Converted: " . ($click->converted ? 'Yes' : 'No') . "\n";
        echo "  Created: {$click->created_at}\n\n";
    }
} else {
    echo "No clicks recorded yet.\n\n";
}

// Check commissions
echo "=== Commissions ===\n";
$commissions = App\Models\Commission::where('user_id', $affiliate->user_id)
    ->where('user_type', 'affiliate')
    ->with('product')
    ->get();

echo "Total Commissions: " . $commissions->count() . "\n\n";

foreach ($commissions as $comm) {
    echo "Product: " . ($comm->product->name ?? 'N/A') . "\n";
    echo "  Amount: ₦{$comm->amount}\n";
    echo "  Status: {$comm->status}\n";
    echo "  Created: {$comm->created_at}\n\n";
}

echo "=== Affiliate Stats ===\n";
echo "Total Sales: {$affiliate->total_sales}\n";
echo "Total Clicks: {$affiliate->total_clicks}\n";
echo "Balance: ₦{$affiliate->balance}\n";
echo "Total Earnings: ₦{$affiliate->total_earnings}\n";
