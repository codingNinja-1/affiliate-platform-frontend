<?php
require 'bootstrap/app.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);

// Get affiliate info
$affiliate = \App\Models\Affiliate::find(2);
if ($affiliate) {
    echo "Affiliate ID: " . $affiliate->id . "\n";
    echo "Referral Code: " . $affiliate->referral_code . "\n";
    echo "User ID: " . $affiliate->user_id . "\n";

    // Test the click tracking endpoint
    echo "\n=== Test Click Tracking ===\n";

    $affiliateId = $affiliate->id;
    $productId = 1; // Assuming product 1 exists

    echo "Testing click tracking for Affiliate ID: $affiliateId, Product ID: $productId\n";

    // Create a click record
    $click = \App\Models\AffiliateClick::create([
        'affiliate_id' => $affiliateId,
        'product_id' => $productId,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'test',
        'clicked_at' => now(),
    ]);

    echo "Click recorded: ID " . $click->id . "\n";
    echo "Status: Success\n";
} else {
    echo "Affiliate ID 2 not found\n";
}
