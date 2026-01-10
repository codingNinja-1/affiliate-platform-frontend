<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Vendor;
use App\Models\Withdrawal;

// Get vendor user
$vendor_user = User::where('email', 'vendor@example.com')->first();

if (!$vendor_user) {
    echo "Vendor user not found\n";
    exit;
}

echo "=== VENDOR DEBUG ===\n";
echo "User ID: " . $vendor_user->id . "\n";
echo "Email: " . $vendor_user->email . "\n";
echo "User Type: " . $vendor_user->user_type . "\n\n";

// Get vendor
$vendor = Vendor::where('user_id', $vendor_user->id)->first();

if (!$vendor) {
    echo "Vendor record not found\n";
    exit;
}

echo "Vendor ID: " . $vendor->id . "\n";
echo "Vendor User ID (foreign key): " . $vendor->user_id . "\n";
echo "Current Balance: ₦" . number_format($vendor->balance, 2) . "\n";
echo "Total Earnings: ₦" . number_format($vendor->total_earnings, 2) . "\n";
echo "Total Withdrawn: ₦" . number_format($vendor->total_withdrawn, 2) . "\n\n";

// Check withdrawals
$withdrawals = Withdrawal::where('user_id', $vendor_user->id)
    ->where('user_type', 'vendor')
    ->get();

echo "=== WITHDRAWALS ===\n";
echo "Total withdrawal records: " . $withdrawals->count() . "\n\n";

foreach ($withdrawals as $w) {
    echo "ID: {$w->id}\n";
    echo "Amount: ₦" . number_format($w->amount, 2) . "\n";
    echo "Status: {$w->status}\n";
    echo "Created: {$w->created_at}\n";
    echo "---\n";
}

// Calculate pending using the accessor
echo "\n=== PENDING CALCULATION ===\n";

// Test the relationship query
$query = $vendor->withdrawals();
echo "Base relationship query:\n";
echo $query->toSql() . "\n";
echo "Bindings: " . json_encode($query->getBindings()) . "\n\n";

// Now add where clause
$query2 = $vendor->withdrawals()->where('status', 'pending');
echo "With status=pending filter:\n";
echo $query2->toSql() . "\n";
echo "Bindings: " . json_encode($query2->getBindings()) . "\n";
echo "Results:\n";
var_dump($query2->get()->toArray());

$pending = $vendor->withdrawals()
    ->where('status', 'pending')
    ->sum('amount');

echo "\nPending Withdrawals (manual sum): ₦" . number_format($pending, 2) . "\n";
echo "Pending Balance (accessor): ₦" . number_format($vendor->pending_balance, 2) . "\n";
