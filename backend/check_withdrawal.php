<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Withdrawal;

echo "=== WITHDRAWAL ID 5 ===\n";
$w = Withdrawal::find(5);
if ($w) {
    echo "Found!\n";
    echo "ID: " . $w->id . "\n";
    echo "User ID: " . $w->user_id . "\n";
    echo "User Type: " . $w->user_type . "\n";
    echo "Amount: ₦" . number_format($w->amount, 2) . "\n";
    echo "Status: " . $w->status . "\n";
} else {
    echo "Not found!\n";
}

echo "\n=== ALL PENDING WITHDRAWALS ===\n";
$pending_all = Withdrawal::where('status', 'pending')->get();
foreach ($pending_all as $p) {
    echo "ID: {$p->id}, User: {$p->user_id}, Type: {$p->user_type}, Amount: ₦" . number_format($p->amount, 2) . "\n";
}
