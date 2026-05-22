<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SubscriptionPayment;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;

class ReconcileSubscriptionPayments extends Command
{
    protected $signature = 'subscriptions:reconcile';
    protected $description = 'Verify pending subscription payments with Paystack and reconcile status';

    public function handle()
    {
        $this->info('Starting reconciliation...');

        $mode = Setting::getValue('paystack_mode', 'test');
        $secret = $mode === 'live' ? Setting::getValue('paystack_live_secret_key') : Setting::getValue('paystack_test_secret_key');

        if (!$secret) {
            $this->error('Paystack secret not configured.');
            return 1;
        }

        $pending = SubscriptionPayment::where('status', 'pending')
            ->where('created_at', '<', now()->subMinutes(5))
            ->get();

        foreach ($pending as $sub) {
            try {
                $resp = Http::withHeaders(['Authorization' => 'Bearer ' . $secret])->get("https://api.paystack.co/transaction/verify/{$sub->reference}");
                $data = $resp->json();
                if ($resp->successful() && data_get($data, 'status') && data_get($data, 'data.status') === 'success') {
                    // Let the webhook or manual verify route handle activation; mark success here to avoid duplicate work
                    $sub->status = 'success';
                    $sub->gateway_payload = data_get($data, 'data');
                    $sub->save();
                    $this->info('Marked success: ' . $sub->reference);
                }
            } catch (\Exception $e) {
                \Log::warning('Reconciliation error for ' . $sub->id . ': ' . $e->getMessage());
            }
        }

        $this->info('Reconciliation complete.');
        return 0;
    }
}
