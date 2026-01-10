<?php

namespace App\Http\Controllers;

use App\Models\AffiliateClick;
use App\Models\Commission;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\User;
use App\Services\PaystackService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;

class PurchaseController extends Controller
{
    /**
     * Initialize a payment with Paystack
     */
    public function initializePayment(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'customer_email' => 'required|email',
            'customer_name' => 'required|string',
            'ref' => 'nullable|string', // Referral code
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $reference = 'TXN-' . uniqid() . '-' . time();

        // Initialize Paystack payment
        $paystack = new PaystackService();

        try {
            $response = $paystack->initializeTransaction([
                'email' => $validated['customer_email'],
                'amount' => $product->price,
                'reference' => $reference,
                'callback_url' => url('/api/payment/callback'),
                'metadata' => [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'customer_name' => $validated['customer_name'],
                    'referral_code' => $validated['ref'] ?? null,
                ],
            ]);

            // Create pending transaction
            $nameParts = explode(' ', $validated['customer_name'], 2);
            $customer = User::firstOrCreate(
                ['email' => $validated['customer_email']],
                [
                    'uuid' => Str::uuid(),
                    'first_name' => $nameParts[0] ?? '',
                    'last_name' => $nameParts[1] ?? 'Customer',
                    'user_type' => 'customer',
                    'status' => 'active',
                    'email_verified_at' => now(),
                    'password' => Hash::make(Str::random(16)),
                ]
            );

            $commissionAmount = ($product->price * $product->commission_rate) / 100;
            $vendorAmount = $product->price - $commissionAmount;

            Transaction::create([
                'uuid' => Str::uuid(),
                'transaction_ref' => $reference,
                'product_id' => $product->id,
                'customer_id' => $customer->id,
                'vendor_id' => $product->vendor_id,
                'customer_email' => $validated['customer_email'],
                'amount' => $product->price,
                'commission_amount' => $commissionAmount,
                'vendor_amount' => $vendorAmount,
                'payment_method' => 'paystack',
                'payment_reference' => $reference,
                'status' => 'pending',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment initialized',
                'data' => [
                    'authorization_url' => $response['data']['authorization_url'],
                    'access_code' => $response['data']['access_code'],
                    'reference' => $response['data']['reference'],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Payment initialization failed', [
                'error' => $e->getMessage(),
                'product_id' => $product->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Payment initialization failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Handle Paystack callback
     */
    public function handleCallback(Request $request)
    {
        $reference = $request->query('reference');
        $frontendUrl = config('app.frontend_url', 'http://192.168.1.134:3000');

        if (!$reference) {
            return redirect($frontendUrl . '/purchase/failed?error=no_reference');
        }

        $paystack = new PaystackService();

        try {
            $response = $paystack->verifyTransaction($reference);

            if ($response['data']['status'] === 'success') {
                // Find transaction and complete it
                $transaction = Transaction::where('transaction_ref', $reference)->first();

                if ($transaction && $transaction->status === 'pending') {
                    $transaction->update([
                        'status' => 'completed',
                        'paid_at' => now(),
                    ]);

                    // Process commissions
                    $metadata = $response['data']['metadata'];
                    if (!empty($metadata['referral_code'])) {
                        $this->recordAffiliateCommission(
                            $transaction->product,
                            $transaction,
                            $metadata['referral_code'],
                            $transaction->commission_amount,
                            $transaction->vendor_amount
                        );
                    } else {
                        $this->recordVendorEarnings(
                            $transaction->product,
                            $transaction,
                            $transaction->vendor_amount
                        );
                    }
                }

                return redirect($frontendUrl . '/purchase/success?reference=' . $reference);
            }

            return redirect($frontendUrl . '/purchase/failed?error=verification_failed');
        } catch (\Exception $e) {
            Log::error('Payment verification failed', [
                'reference' => $reference,
                'error' => $e->getMessage(),
            ]);

            return redirect($frontendUrl . '/purchase/failed?error=verification_error');
        }
    }

    /**
     * Webhook handler for Paystack events
     */
    public function handleWebhook(Request $request)
    {
        // Verify webhook signature
        $signature = $request->header('x-paystack-signature');
        $body = $request->getContent();

        // In production, verify the signature
        // $expectedSignature = hash_hmac('sha512', $body, config('paystack.secret_key'));

        $event = $request->input('event');
        $data = $request->input('data');

        if ($event === 'charge.success') {
            $reference = $data['reference'];
            $transaction = Transaction::where('transaction_ref', $reference)->first();

            if ($transaction && $transaction->status === 'pending') {
                $transaction->update([
                    'status' => 'completed',
                    'paid_at' => now(),
                ]);

                // Process commissions
                $metadata = $data['metadata'] ?? [];
                if (!empty($metadata['referral_code'])) {
                    $this->recordAffiliateCommission(
                        $transaction->product,
                        $transaction,
                        $metadata['referral_code'],
                        $transaction->commission_amount,
                        $transaction->vendor_amount
                    );
                } else {
                    $this->recordVendorEarnings(
                        $transaction->product,
                        $transaction,
                        $transaction->vendor_amount
                    );
                }
            }
        }

        return response()->json(['status' => 'success']);
    }

    /**
     * Get Paystack public key
     */
    public function getPublicKey()
    {
        $paystack = new PaystackService();
        return response()->json([
            'public_key' => $paystack->getPublicKey(),
        ]);
    }

    /**
     * Record a purchase and create affiliate commission (legacy demo method)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'customer_email' => 'required|email',
            'customer_name' => 'required|string',
            'amount' => 'nullable|numeric|min:0',
            'ref' => 'nullable|string', // Referral code
            'payment_method' => 'nullable|string',
            'payment_reference' => 'nullable|string',
        ]);

        $product = Product::findOrFail($validated['product_id']);

        // Use product price if amount not provided
        $amount = $validated['amount'] ?? $product->price;
        $paymentMethod = $validated['payment_method'] ?? 'demo';

        // Create or get customer user
        $nameParts = explode(' ', $validated['customer_name'], 2);
        $customer = User::firstOrCreate(
            ['email' => $validated['customer_email']],
            [
                'uuid' => Str::uuid(),
                'first_name' => $nameParts[0] ?? '',
                'last_name' => $nameParts[1] ?? 'Customer',
                'user_type' => 'customer',
                'status' => 'active',
                'email_verified_at' => now(),
                'password' => Hash::make(Str::random(16)),
            ]
        );

        // Calculate revenue splits
        $commissionAmount = ($amount * $product->commission_rate) / 100;
        $vendorAmount = $amount - $commissionAmount;

        // Create transaction
        $transaction = Transaction::create([
            'uuid' => Str::uuid(),
            'transaction_ref' => 'TXN-' . uniqid(),
            'product_id' => $product->id,
            'customer_id' => $customer->id,
            'affiliate_id' => null, // will set below if ref exists
            'vendor_id' => $product->vendor_id,
            'customer_email' => $validated['customer_email'],
            'amount' => $amount,
            'commission_amount' => $commissionAmount,
            'vendor_amount' => $vendorAmount,
            'payment_method' => $paymentMethod,
            'payment_reference' => $validated['payment_reference'] ?? null,
            'status' => 'completed',
            'paid_at' => now(),
        ]);

        Log::stack(['single', 'stderr'])->info('Sale recorded', [
            'transaction_id' => $transaction->id,
            'product_id' => $product->id,
            'amount' => $amount,
            'has_referral' => !empty($validated['ref']),
        ]);

        // Handle affiliate commission if referral code provided
        if (!empty($validated['ref'])) {
            $this->recordAffiliateCommission($product, $transaction, $validated['ref'], $commissionAmount, $vendorAmount);
        } else {
            // Even without referral, credit vendor earnings
            $this->recordVendorEarnings($product, $transaction, $vendorAmount);
        }

        return response()->json([
            'success' => true,
            'message' => 'Purchase recorded successfully',
            'transaction' => $transaction,
        ]);
    }

    /**
     * Record affiliate click conversion and commission
     */
    private function recordAffiliateCommission($product, $transaction, $referralCode, $commissionAmount = null, $vendorAmount = null)
    {
        // Find the affiliate click record if it exists
        $click = AffiliateClick::where('product_id', $product->id)
            ->whereHas('affiliate', function ($q) use ($referralCode) {
                $q->where('referral_code', $referralCode);
            })
            ->latest()
            ->first();

        // Fallback: resolve affiliate directly if no click was tracked
        $affiliate = $click?->affiliate ??
            \App\Models\Affiliate::where('referral_code', $referralCode)->first();

        if (!$affiliate) {
            Log::stack(['single', 'stderr'])->warning('Affiliate not found for referral', [
                'referral_code' => $referralCode,
                'product_id' => $product->id,
                'transaction_id' => $transaction->id,
            ]);
            return;
        }

        // Mark click as converted when a tracked click exists
        if ($click) {
            $click->update([
                'converted' => true,
                'transaction_id' => $transaction->id,
            ]);
        }

        // Link transaction to affiliate for reporting
        $transaction->update([
            'affiliate_id' => $affiliate->id,
        ]);

        // Calculate commission
        $commissionAmount = $commissionAmount ?? ($transaction->amount * $product->commission_rate) / 100;
        $commissionRate = $product->commission_rate;

        // Create commission record
        Commission::create([
            'uuid' => Str::uuid(),
            'user_id' => $affiliate->user_id,
            'user_type' => 'affiliate',
            'product_id' => $product->id,
            'transaction_id' => $transaction->id,
            'amount' => $commissionAmount,
            'rate' => $commissionRate,
            'status' => 'approved', // Auto-approve commissions
            'approved_at' => now(),
        ]);

        Log::stack(['single', 'stderr'])->info('Commission recorded for affiliate', [
            'affiliate_id' => $affiliate->id,
            'transaction_id' => $transaction->id,
            'amount' => $commissionAmount,
            'rate' => $commissionRate,
        ]);

        // Update affiliate stats and balance
        $affiliate->increment('total_sales');
        $affiliate->increment('total_clicks'); // Basic conversion count
        $affiliate->updateBalance($commissionAmount, 'add'); // Add commission to balance
        $affiliate->updateConversionRate();
        $affiliate->updateTier();

        // Always credit the vendor for their share
        $vendorShare = $vendorAmount ?? $transaction->vendor_amount ?? ($transaction->amount - $commissionAmount);
        $this->recordVendorEarnings($product, $transaction, $vendorShare);
    }

    /**
     * Credit vendor earnings for a completed transaction
     */
    private function recordVendorEarnings($product, $transaction, $vendorAmount)
    {
        $vendor = $product->vendor ?? $product->vendor()->first();

        if (!$vendor) {
            return;
        }

        $vendor->increment('total_sales');
        $vendor->updateBalance($vendorAmount, 'add');

        Log::stack(['single', 'stderr'])->info('Vendor credited for sale', [
            'vendor_id' => $vendor->id,
            'transaction_id' => $transaction->id,
            'amount' => $vendorAmount,
        ]);
    }
}
