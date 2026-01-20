<?php

namespace App\Console\Commands;

use App\Models\Affiliate;
use App\Models\Vendor;
use App\Models\Withdrawal;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixWithdrawalBalances extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'withdrawals:fix-balances {--dry-run : Run without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Audit and fix balance inconsistencies based on withdrawal history';

    /**
     * Execute the console command.
     *
     * This command recalculates balances by:
     * 1. Summing all approved/paid withdrawals from withdrawal history
     * 2. Calculating expected balance: total_earnings - total_withdrawn - pending_withdrawals
     * 3. Fixing any discrepancies between actual and expected values
     *
     * Use --dry-run flag to see what would be changed without applying changes
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info('🔍 Running in DRY RUN mode - no changes will be made');
            $this->newLine();
        }

        $this->info('Starting balance audit and fix...');
        $this->newLine();

        // Fix affiliate balances
        $this->info('📊 Auditing Affiliates...');
        $this->fixAffiliateBalances($dryRun);
        $this->newLine();

        // Fix vendor balances
        $this->info('📊 Auditing Vendors...');
        $this->fixVendorBalances($dryRun);
        $this->newLine();

        if ($dryRun) {
            $this->warn('This was a DRY RUN. Run without --dry-run to apply changes.');
        } else {
            $this->info('✅ Balance audit and fix completed successfully!');
        }

        return 0;
    }

    private function fixAffiliateBalances($dryRun)
    {
        $affiliates = Affiliate::all();
        $fixedCount = 0;

        foreach ($affiliates as $affiliate) {
            // Calculate total withdrawn from approved/paid withdrawals
            $actualTotalWithdrawn = Withdrawal::where('user_id', $affiliate->user_id)
                ->where('user_type', 'affiliate')
                ->whereIn('status', ['approved', 'paid'])
                ->sum('amount');

            // Calculate pending withdrawal amount
            $pendingWithdrawals = Withdrawal::where('user_id', $affiliate->user_id)
                ->where('user_type', 'affiliate')
                ->where('status', 'pending')
                ->sum('amount');

            // Expected balance = total_earnings - total_withdrawn - pending_withdrawals
            $expectedBalance = $affiliate->total_earnings - $actualTotalWithdrawn - $pendingWithdrawals;

            // Check for discrepancies
            $balanceDiscrepancy = abs($affiliate->balance - $expectedBalance);
            $withdrawnDiscrepancy = abs($affiliate->total_withdrawn - $actualTotalWithdrawn);

            if ($balanceDiscrepancy > 0.01 || $withdrawnDiscrepancy > 0.01) {
                $this->warn("  Affiliate ID {$affiliate->id} (User: {$affiliate->user_id})");

                if ($balanceDiscrepancy > 0.01) {
                    $this->line("    Balance: ₦" . number_format($affiliate->balance, 2) . " → ₦" . number_format($expectedBalance, 2));
                }

                if ($withdrawnDiscrepancy > 0.01) {
                    $this->line("    Total Withdrawn: ₦" . number_format($affiliate->total_withdrawn, 2) . " → ₦" . number_format($actualTotalWithdrawn, 2));
                }

                if (!$dryRun) {
                    $affiliate->update([
                        'balance' => $expectedBalance,
                        'total_withdrawn' => $actualTotalWithdrawn,
                        'pending_balance' => $pendingWithdrawals,
                    ]);
                    $this->info("    ✓ Fixed");
                }

                $fixedCount++;
            }
        }

        if ($fixedCount === 0) {
            $this->info('  All affiliate balances are correct! ✓');
        } else {
            $this->info("  Found and " . ($dryRun ? 'would fix' : 'fixed') . " {$fixedCount} affiliate(s)");
        }
    }

    private function fixVendorBalances($dryRun)
    {
        $vendors = Vendor::all();
        $fixedCount = 0;

        foreach ($vendors as $vendor) {
            // Calculate total withdrawn from approved/paid withdrawals
            $actualTotalWithdrawn = Withdrawal::where('user_id', $vendor->user_id)
                ->where('user_type', 'vendor')
                ->whereIn('status', ['approved', 'paid'])
                ->sum('amount');

            // Calculate pending withdrawal amount
            $pendingWithdrawals = Withdrawal::where('user_id', $vendor->user_id)
                ->where('user_type', 'vendor')
                ->where('status', 'pending')
                ->sum('amount');

            // Expected balance = total_earnings - total_withdrawn - pending_withdrawals
            $expectedBalance = $vendor->total_earnings - $actualTotalWithdrawn - $pendingWithdrawals;

            // Check for discrepancies
            $balanceDiscrepancy = abs($vendor->balance - $expectedBalance);
            $withdrawnDiscrepancy = abs($vendor->total_withdrawn - $actualTotalWithdrawn);

            if ($balanceDiscrepancy > 0.01 || $withdrawnDiscrepancy > 0.01) {
                $this->warn("  Vendor ID {$vendor->id} (User: {$vendor->user_id})");

                if ($balanceDiscrepancy > 0.01) {
                    $this->line("    Balance: ₦" . number_format($vendor->balance, 2) . " → ₦" . number_format($expectedBalance, 2));
                }

                if ($withdrawnDiscrepancy > 0.01) {
                    $this->line("    Total Withdrawn: ₦" . number_format($vendor->total_withdrawn, 2) . " → ₦" . number_format($actualTotalWithdrawn, 2));
                }

                if (!$dryRun) {
                    $vendor->update([
                        'balance' => $expectedBalance,
                        'total_withdrawn' => $actualTotalWithdrawn,
                        'pending_balance' => $pendingWithdrawals,
                    ]);
                    $this->info("    ✓ Fixed");
                }

                $fixedCount++;
            }
        }

        if ($fixedCount === 0) {
            $this->info('  All vendor balances are correct! ✓');
        } else {
            $this->info("  Found and " . ($dryRun ? 'would fix' : 'fixed') . " {$fixedCount} vendor(s)");
        }
    }
}
