<?php

namespace App\Console\Commands;

use App\Models\Affiliate;
use App\Models\Vendor;
use Illuminate\Console\Command;

class UpdateAffiliateBalances extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'balances:update {--type=all : Type of users to update (all, affiliates, vendors)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculate and update affiliate and vendor balances from approved commissions';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $type = $this->option('type');

        if (in_array($type, ['all', 'affiliates'])) {
            $this->updateAffiliateBalances();
        }

        if (in_array($type, ['all', 'vendors'])) {
            $this->updateVendorBalances();
        }

        return Command::SUCCESS;
    }

    /**
     * Update affiliate balances
     */
    private function updateAffiliateBalances()
    {
        $this->info('Updating affiliate balances...');

        $affiliates = Affiliate::all();
        $updated = 0;

        foreach ($affiliates as $affiliate) {
            // Calculate balance from approved commissions
            $totalEarnings = $affiliate->commissions()
                ->where('status', 'approved')
                ->sum('amount');

            // Calculate withdrawn amount
            $totalWithdrawn = $affiliate->withdrawals()
                ->where('status', 'paid')
                ->sum('amount');

            // Calculate current balance
            $currentBalance = $totalEarnings - $totalWithdrawn;

            // Update affiliate
            $affiliate->update([
                'balance' => max(0, $currentBalance),
                'total_earnings' => $totalEarnings,
                'total_withdrawn' => $totalWithdrawn,
            ]);

            $updated++;
        }

        $this->info("Updated {$updated} affiliate balances");
    }

    /**
     * Update vendor balances
     */
    private function updateVendorBalances()
    {
        $this->info('Updating vendor balances...');

        $vendors = Vendor::all();
        $updated = 0;

        foreach ($vendors as $vendor) {
            // Calculate balance from completed transactions
            $totalEarnings = $vendor->products()
                ->join('transactions', 'products.id', '=', 'transactions.product_id')
                ->where('transactions.status', 'completed')
                ->sum('transactions.vendor_amount');

            // Calculate withdrawn amount
            $totalWithdrawn = $vendor->withdrawals()
                ->where('status', 'paid')
                ->sum('amount');

            // Calculate current balance
            $currentBalance = $totalEarnings - $totalWithdrawn;

            // Update vendor
            $vendor->update([
                'balance' => max(0, $currentBalance),
                'total_earnings' => $totalEarnings,
                'total_withdrawn' => $totalWithdrawn,
            ]);

            $updated++;
        }

        $this->info("Updated {$updated} vendor balances");
    }
}
