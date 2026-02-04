<?php

namespace App\Console\Commands;

use App\Models\Affiliate;
use App\Models\Setting;
use App\Models\Vendor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ChargeSubscriptions extends Command
{
    protected $signature = 'subscriptions:charge {--force : Charge even if not yet due}';

    protected $description = 'Charge annual subscriptions for vendors and affiliates';

    public function handle()
    {
        $force = (bool) $this->option('force');

        $this->chargeForType('vendor', $force);
        $this->chargeForType('affiliate', $force);

        return Command::SUCCESS;
    }

    private function chargeForType(string $type, bool $force): void
    {
        $monthly = (float) Setting::getValue("{$type}_monthly", 0);
        $annual = round($monthly * 12, 2);

        if ($annual <= 0) {
            $this->info("Skipping {$type} subscriptions (annual amount is 0)." );
            return;
        }

        $records = $type === 'vendor'
            ? Vendor::with('user')->get()
            : Affiliate::with('user')->get();

        $charged = 0;
        $failed = 0;

        foreach ($records as $record) {
            $due = !$record->subscription_expires_at || $record->subscription_expires_at->isPast();
            if (!$force && !$due) {
                continue;
            }

            if ($record->balance < $annual) {
                $this->markPastDue($record);
                $failed++;
                continue;
            }

            DB::transaction(function () use ($record, $annual) {
                $record->updateBalance($annual, 'subtract');
                $record->update([
                    'subscription_status' => 'active',
                    'subscription_last_charged_at' => now(),
                    'subscription_expires_at' => now()->addYear(),
                    'subscription_failed_at' => null,
                ]);

                if ($record->user && $record->user->status === 'inactive') {
                    $record->user->update(['status' => 'active']);
                }
            });

            $charged++;
        }

        $this->info("{$type} subscriptions charged: {$charged}, failed: {$failed}");
    }

    private function markPastDue($record): void
    {
        $record->update([
            'subscription_status' => 'past_due',
            'subscription_failed_at' => now(),
        ]);

        if ($record->user && $record->user->status === 'active') {
            $record->user->update(['status' => 'inactive']);
        }
    }
}
