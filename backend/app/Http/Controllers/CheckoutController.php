    <?php

    namespace App\Http\Controllers;

    use App\Models\Product;
    use App\Models\Affiliate;
    use App\Models\Commission;
    use App\Models\Transaction;
    use App\Models\User;
    use App\Services\PaystackService;
    use App\Services\SaleNotificationService;
    use Illuminate\Http\Request;
    use Illuminate\Support\Str;
    use Illuminate\Support\Facades\Log;
    use Illuminate\Support\Facades\Hash;

    class CheckoutController extends Controller
    {
        /**
         * Initialize checkout and create Paystack payment
         */
        public function initialize(Request $request)
        {
            $validated = $request->validate([
                'product_id' => 'required|exists:products,id',
                'affiliate_id' => 'nullable|exists:affiliates,id',
                'ref' => 'nullable|string', // referral code
                'customer_name' => 'required|string',
                'customer_email' => 'required|email',
                'customer_phone' => 'required|string',
                'customer_country' => 'required|string',
            ]);

            $product = Product::findOrFail($validated['product_id']);
            $reference = 'CHK-' . uniqid() . '-' . time();

            // Validate product is approved and active
            if ($product->approval_status !== 'approved' || !$product->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product is not available for purchase',
                ], 403);
            }

            // Validate affiliate if provided
            $affiliate = null;
            if (!empty($validated['affiliate_id'])) {
                $affiliate = Affiliate::findOrFail($validated['affiliate_id']);
            }

            try {
                $paystack = new PaystackService();

                // Initialize Paystack payment
                $response = $paystack->initializeTransaction([
                    'email' => $validated['customer_email'],
                    'amount' => $product->price,
                    'reference' => $reference,
                    'callback_url' => url('/api/payment/callback'),
                    'metadata' => [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'customer_name' => $validated['customer_name'],
                        'customer_phone' => $validated['customer_phone'],
                        'customer_country' => $validated['customer_country'],
                        'affiliate_id' => $affiliate?->id ?? null,
                        'referral_code' => $validated['ref'] ?? ($affiliate?->referral_code ?? null),
                    ],
                ]);

                // Create or get customer
                $nameParts = explode(' ', $validated['customer_name'], 2);
                $customer = User::firstOrCreate(
                    ['email' => $validated['customer_email']],
                    [
                        'uuid' => Str::uuid(),
                        'first_name' => $nameParts[0] ?? '',
                        'last_name' => $nameParts[1] ?? 'Customer',
                        'phone' => $validated['customer_phone'],
                        'user_type' => 'customer',
                        'status' => 'active',
                        'email_verified_at' => now(),
                        'password' => Hash::make(Str::random(16)),
                    ]
                );

                // Calculate revenue splits
                $commissionAmount = ($product->price * $product->commission_rate) / 100;
                $vendorAmount = $product->price - $commissionAmount;

                // Create pending transaction
                Transaction::create([
                    'uuid' => Str::uuid(),
                    'transaction_ref' => $reference,
                    'product_id' => $product->id,
                    'customer_id' => $customer->id,
                    'vendor_id' => $product->vendor_id,
                    'affiliate_id' => $affiliate?->id ?? null,
                    'customer_email' => $validated['customer_email'],
                    'customer_phone' => $validated['customer_phone'],
                    'customer_country' => $validated['customer_country'],
                    'amount' => $product->price,
                    'commission_amount' => $commissionAmount,
                    'vendor_amount' => $vendorAmount,
                    'payment_method' => 'paystack',
                    'payment_reference' => $reference,
                    'status' => 'pending',
                ]);

                Log::info('Checkout initialized', [
                    'reference' => $reference,
                    'product_id' => $product->id,
                    'affiliate_id' => $affiliate?->id ?? null,
                    'amount' => $product->price,
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
                Log::error('Checkout initialization failed', [
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
         * Handle payment callback - called by Paystack after payment
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
                    $transaction = Transaction::where('transaction_ref', $reference)
                        ->orWhere('payment_reference', $reference)->first();

                    if ($transaction && $transaction->status === 'pending') {
                        $metadata = $response['data']['metadata'] ?? [];

                        // Backfill affiliate on the transaction using metadata when it was not stored at creation time
                        if (!$transaction->affiliate_id) {
                            $affiliate = null;

                            if (!empty($metadata['affiliate_id'])) {
                                $affiliate = Affiliate::find($metadata['affiliate_id']);
                            } elseif (!empty($metadata['referral_code'])) {
                                $affiliate = Affiliate::where('referral_code', $metadata['referral_code'])->first();
                            }

                            if ($affiliate) {
                                $transaction->affiliate_id = $affiliate->id;
                            }
                        }

                        $transaction->update([
                            'status' => 'completed',
                            'paid_at' => now(),
                            'affiliate_id' => $transaction->affiliate_id,
                        ]);

                        // Process commissions and payouts
                        $commission = null;

                        if ($transaction->affiliate_id) {
                            $commission = $this->recordAffiliateCommission($transaction);
                        } else {
                            $this->recordVendorEarnings($transaction);
                        }

                        $transaction->refresh();

                        app(SaleNotificationService::class)->send($transaction, $commission);

                        // Send purchase confirmation email
                        try {
                            $transaction->customer->notify(new \App\Notifications\PurchaseConfirmationNotification($transaction));
                            Log::info('Purchase confirmation email sent', [
                                'transaction_id' => $transaction->id,
                                'customer_email' => $transaction->customer->email,
                            ]);
                        } catch (\Exception $e) {
                            Log::error('Failed to send confirmation email', [
                                'transaction_id' => $transaction->id,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    }

                    // Redirect to vendor's thank you page if available, otherwise to success page
                    $redirectUrl = $frontendUrl . '/purchase/success?reference=' . $reference;
                    if ($transaction && $transaction->product && $transaction->product->thank_you_page_url) {
                        $redirectUrl = $transaction->product->thank_you_page_url . '?reference=' . $reference;
                    }

                    return redirect($redirectUrl);
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
         * Record affiliate commission
         */
        private function recordAffiliateCommission($transaction): ?Commission
        {
            $affiliate = $transaction->affiliate;
            $product = $transaction->product;

            if (!$affiliate) {
                return null;
            }

            // Mark any recent unconverted clicks as converted
            \App\Models\AffiliateClick::where('affiliate_id', $affiliate->id)
                ->where('product_id', $product->id)
                ->where('converted', false)
                ->latest()
                ->first()
                ?->update([
                    'converted' => true,
                    'transaction_id' => $transaction->id,
                ]);

            // Create commission record
            $commission = Commission::create([
                'uuid' => Str::uuid(),
                'user_id' => $affiliate->user_id,
                'user_type' => 'affiliate',
                'product_id' => $product->id,
                'transaction_id' => $transaction->id,
                'amount' => $transaction->commission_amount,
                'rate' => $product->commission_rate,
                'status' => 'approved',
                'approved_at' => now(),
            ]);

            // Update affiliate stats and balance
            $affiliate->increment('total_sales');
            $affiliate->updateBalance($transaction->commission_amount, 'add');
            $affiliate->updateConversionRate();
            $affiliate->updateTier();

            Log::info('Commission recorded for affiliate', [
                'affiliate_id' => $affiliate->id,
                'transaction_id' => $transaction->id,
                'amount' => $transaction->commission_amount,
            ]);

            // Record vendor earnings too
            $this->recordVendorEarnings($transaction);

            return $commission;
        }

        /**
         * Record vendor earnings
         */
        private function recordVendorEarnings($transaction)
        {
            $vendor = $transaction->vendor ?? $transaction->product->vendor;

            if (!$vendor) {
                return;
            }

            $vendor->increment('total_sales');
            $vendor->updateBalance($transaction->vendor_amount, 'add');

            Log::info('Vendor credited for sale', [
                'vendor_id' => $vendor->id,
                'transaction_id' => $transaction->id,
                'amount' => $transaction->vendor_amount,
            ]);
        }

        /**
         * Get transaction details by reference (for purchase success page)
         */
        public function getTransactionByReference($reference)
        {
            $transaction = Transaction::with(['product', 'customer', 'affiliate', 'vendor'])
                ->where('payment_reference', $reference)
                ->orWhere('transaction_ref', $reference)
                ->first();

            if (!$transaction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transaction not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $transaction,
            ]);
        }
    }
