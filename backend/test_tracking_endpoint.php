<?php
// Quick test of tracking endpoint

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => 'http://localhost:8000/api/tracking/click',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: application/json'
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'affiliate_id' => 2,
        'product_id' => 1
    ])
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Status: $httpCode\n";
echo "Response:\n$response\n";

// Also check database
echo "\n=== Database Check ===\n";
require 'bootstrap/app.php';

try {
    $clicks = \App\Models\AffiliateClick::where('affiliate_id', 2)
        ->where('product_id', 1)
        ->orderBy('created_at', 'desc')
        ->limit(5)
        ->get(['id', 'affiliate_id', 'product_id', 'created_at']);
    
    echo "Recent clicks for Affiliate 2, Product 1:\n";
    foreach ($clicks as $click) {
        echo "  - ID: {$click->id}, Created: {$click->created_at}\n";
    }
    echo "Total: " . count($clicks) . " clicks\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
