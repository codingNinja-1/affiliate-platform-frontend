<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaystackController extends Controller
{
    public function handle(Request $request)
    {
        $signature = $request->header('x-paystack-signature');
        $mode = Setting::getValue('paystack_mode', 'test');
        $secret = $mode === 'live' ? Setting::getValue('paystack_live_secret_key') : Setting::getValue('paystack_test_secret_key');

        // Verify signature
        $payload = $request->getContent();
        if ($secret) {
            $computed = hash_hmac('sha512', $payload, $secret);
            if (!hash_equals($computed, (string) $signature)) {
                return response()->json(['error' => 'Invalid signature'], 400);
            }
        }

        $json = $request->json()->all();
        $event = data_get($json, 'event');

        if ($event !== 'charge.success') {
            return response()->json([], 200);
        }

        $data = data_get($json, 'data', []);
        $reference = data_get($data, 'reference');

        if (!$reference) {
            return response()->json([], 200);
        }

        $sub = SubscriptionPayment::where('reference', $reference)->lockForUpdate()->first();
        if (!$sub) {
            // Unknown subscription payment. Log for investigation and ack.
            \Log::warning('Paystack webhook for unknown subscription reference: ' . $reference);
            return response()->json([], 200);
        }

        if ($sub->status === 'success') {
            return response()->json([], 200);
        }

        DB::transaction(function () use ($sub, $data) {
            $sub->status = 'success';
            $sub->gateway_payload = $data;
            $sub->save();

            // Activate subscription for the user
            $user = User::find($sub->user_id);
            if (!$user) {
                \Log::error('Paystack webhook: user not found for subscription payment ' . $sub->id);
                return;
            }

            $record = $sub->user_type === 'vendor' ? $user->vendor : $user->affiliate;
            if (!$record) {
                \Log::error('Paystack webhook: account record not found for user ' . $user->id);
                return;
            }

            $period = $sub->period;
            $expiresAt = $period === 'monthly' ? now()->addMonth() : now()->addYear();

            $record->update([
                'subscription_status' => 'active',
                'subscription_last_charged_at' => now(),
                'subscription_expires_at' => $expiresAt,
                'subscription_failed_at' => null,
            ]);

            if ($user->status === 'inactive') {
                $user->update(['status' => 'active']);
            }
        });

        return response()->json([], 200);
    }
}
