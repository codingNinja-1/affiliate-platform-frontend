<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$email = 'timilehinaruaji@gmail.com';

echo "=== Looking for user: {$email} ===\n\n";

$user = App\Models\User::where('email', $email)->first();

if ($user) {
    echo "User found!\n";
    echo "ID: {$user->id}\n";
    echo "Name: {$user->first_name} {$user->last_name}\n";
    echo "Type: {$user->user_type}\n\n";
    
    $affiliate = App\Models\Affiliate::where('user_id', $user->id)->first();
    
    if ($affiliate) {
        echo "Affiliate Profile:\n";
        echo "  ID: {$affiliate->id}\n";
        echo "  Balance: {$affiliate->balance}\n";
        echo "  Total Earnings: {$affiliate->total_earnings}\n";
        echo "  Currency: {$affiliate->preferred_currency}\n\n";
        
        $commissions = App\Models\Commission::where('user_id', $user->id)
            ->where('user_type', 'affiliate')
            ->get();
        
        echo "Commissions: " . $commissions->count() . "\n";
        foreach ($commissions as $comm) {
            echo "  - Amount: {$comm->amount}, Status: {$comm->status}\n";
        }
    } else {
        echo "NO AFFILIATE PROFILE FOUND!\n";
    }
} else {
    echo "User not found!\n";
}
