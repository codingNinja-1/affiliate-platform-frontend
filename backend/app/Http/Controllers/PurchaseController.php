<?php

namespace App\Http\Controllers;

use App\Models\AffiliateClick;
use App\Models\Commission;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\User;
use App\Notifications\PurchaseConfirmationNotification;
use App\Services\PaystackService;
use App\Services\SaleNotificationService;
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
            'affiliate_id' => 'nullable|integer|exists:affiliates,id',
            'ref' => 'nullable|string', // Referral code (legacy support)
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
                    'affiliate_id' => $validated['affiliate_id'] ?? null,
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
                // Preserve affiliate linkage at creation so callbacks can award commissions
                'affiliate_id' => $validated['affiliate_id'] ?? null,
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
                    $commission = null;

                    // Support both affiliate_id and referral_code
                    if (!empty($metadata['affiliate_id'])) {
                        $commission = $this->recordAffiliateCommissionById(
                            $transaction->product,
                            $transaction,
                            $metadata['affiliate_id'],
                            $transaction->commission_amount,
                            $transaction->vendor_amount
                        );
                    } elseif (!empty($metadata['referral_code'])) {
                        $commission = $this->recordAffiliateCommission(
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

                    $transaction->refresh();

                    app(SaleNotificationService::class)->send($transaction, $commission);

                    // Send purchase confirmation email to customer
                    try {
                        $transaction->customer->notify(new PurchaseConfirmationNotification($transaction));
                        Log::info('Purchase confirmation email sent', [
                            'transaction_id' => $transaction->id,
                            'customer_email' => $transaction->customer->email,
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Failed to send purchase confirmation email', [
                            'transaction_id' => $transaction->id,
                            'error' => $e->getMessage(),
                        ]);
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
                $commission = null;

                // Support both affiliate_id and referral_code
                if (!empty($metadata['affiliate_id'])) {
                    $commission = $this->recordAffiliateCommissionById(
                        $transaction->product,
                        $transaction,
                        $metadata['affiliate_id'],
                        $transaction->commission_amount,
                        $transaction->vendor_amount
                    );
                } elseif (!empty($metadata['referral_code'])) {
                    $commission = $this->recordAffiliateCommission(
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

                $transaction->refresh();

                app(SaleNotificationService::class)->send($transaction, $commission);

                // Send purchase confirmation email to customer
                try {
                    $transaction->customer->notify(new PurchaseConfirmationNotification($transaction));
                    Log::info('Purchase confirmation email sent via webhook', [
                        'transaction_id' => $transaction->id,
                        'customer_email' => $transaction->customer->email,
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to send purchase confirmation email via webhook', [
                        'transaction_id' => $transaction->id,
                        'error' => $e->getMessage(),
                    ]);
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
            'affiliate_id' => 'nullable|integer|exists:affiliates,id',
            'ref' => 'nullable|string', // Referral code
            'payment_method' => 'nullable|string',
            'payment_reference' => 'nullable|string',
        ]);

        $product = Product::findOrFail($validated['product_id']);

        // Use product price if amount not provided
        $amount = $validated['amount'] ?? $product->price;
        // Map unsupported methods (like 'demo') to an allowed enum value
        $paymentMethod = $validated['payment_method'] ?? 'bank_transfer';
        $allowedMethods = ['stripe', 'paystack', 'bank_transfer', 'wallet', 'credit_card', 'debit_card'];
        if (!in_array($paymentMethod, $allowedMethods, true)) {
            $paymentMethod = 'bank_transfer';
        }

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

        // Handle affiliate commission if affiliate_id or referral code provided
        $commission = null;

        if (!empty($validated['affiliate_id'])) {
            $commission = $this->recordAffiliateCommissionById($product, $transaction, $validated['affiliate_id'], $commissionAmount, $vendorAmount);
        } elseif (!empty($validated['ref'])) {
            $commission = $this->recordAffiliateCommission($product, $transaction, $validated['ref'], $commissionAmount, $vendorAmount);
        } else {
            // Even without referral, credit vendor earnings
            $this->recordVendorEarnings($product, $transaction, $vendorAmount);
        }

        app(SaleNotificationService::class)->send($transaction, $commission);

        return response()->json([
            'success' => true,
            'message' => 'Purchase recorded successfully',
            'transaction' => $transaction,
        ]);
    }

    /**
     * Record affiliate click conversion and commission
     */
    private function recordAffiliateCommission($product, $transaction, $referralCode, $commissionAmount = null, $vendorAmount = null): ?Commission
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
            return null;
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
        $commission = Commission::create([
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

        return $commission;
    }

    /**
     * Record affiliate commission by affiliate ID
     */
    private function recordAffiliateCommissionById($product, $transaction, $affiliateId, $commissionAmount = null, $vendorAmount = null): ?Commission
    {
        $affiliate = \App\Models\Affiliate::find($affiliateId);

        if (!$affiliate) {
            Log::stack(['single', 'stderr'])->warning('Affiliate not found', [
                'affiliate_id' => $affiliateId,
                'product_id' => $product->id,
                'transaction_id' => $transaction->id,
            ]);
            return null;
        }

        // Find recent click for this affiliate and product
        $click = AffiliateClick::where('product_id', $product->id)
            ->where('affiliate_id', $affiliateId)
            ->latest()
            ->first();

        // Mark click as converted if it exists
        if ($click) {
            $click->update([
                'converted' => true,
                'transaction_id' => $transaction->id,
            ]);
        }

        // Link transaction to affiliate
        $transaction->update([
            'affiliate_id' => $affiliate->id,
        ]);

        // Calculate commission
        $commissionAmount = $commissionAmount ?? ($transaction->amount * $product->commission_rate) / 100;
        $commissionRate = $product->commission_rate;

        // Create commission record
        $commission = Commission::create([
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

        Log::stack(['single', 'stderr'])->info('Commission recorded for affiliate by ID', [
            'affiliate_id' => $affiliate->id,
            'transaction_id' => $transaction->id,
            'amount' => $commissionAmount,
            'rate' => $commissionRate,
        ]);

        // Update affiliate stats and balance
        $affiliate->increment('total_sales');
        $affiliate->updateBalance($commissionAmount, 'add');
        $affiliate->updateConversionRate();
        $affiliate->updateTier();

        // Always credit the vendor for their share
        $vendorShare = $vendorAmount ?? $transaction->vendor_amount ?? ($transaction->amount - $commissionAmount);
        $this->recordVendorEarnings($product, $transaction, $vendorShare);

        return $commission;
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
