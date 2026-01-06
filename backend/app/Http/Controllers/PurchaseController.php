<?php

namespace App\Http\Controllers;

use App\Models\AffiliateClick;
use App\Models\Commission;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;

class PurchaseController extends Controller
{
    /**
     * Record a purchase and create affiliate commission
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'customer_email' => 'required|email',
            'customer_name' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'ref' => 'nullable|string', // Referral code
            'payment_method' => 'required|string',
            'payment_reference' => 'nullable|string',
        ]);

        $product = Product::findOrFail($validated['product_id']);

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
        $commissionAmount = ($validated['amount'] * $product->commission_rate) / 100;
        $vendorAmount = $validated['amount'] - $commissionAmount;

        // Create transaction
        $transaction = Transaction::create([
            'uuid' => Str::uuid(),
            'transaction_ref' => 'TXN-' . uniqid(),
            'product_id' => $product->id,
            'customer_id' => $customer->id,
            'affiliate_id' => null, // will set below if ref exists
            'vendor_id' => $product->vendor_id,
            'customer_email' => $validated['customer_email'],
            'amount' => $validated['amount'],
            'commission_amount' => $commissionAmount,
            'vendor_amount' => $vendorAmount,
            'payment_method' => $validated['payment_method'],
            'payment_reference' => $validated['payment_reference'] ?? null,
            'status' => 'completed',
            'paid_at' => now(),
        ]);

        Log::stack(['single', 'stderr'])->info('Sale recorded', [
            'transaction_id' => $transaction->id,
            'product_id' => $product->id,
            'amount' => $validated['amount'],
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
            'status' => 'pending', // Will be approved by admin
            'approved_at' => now(),
        ]);

        Log::stack(['single', 'stderr'])->info('Commission recorded for affiliate', [
            'affiliate_id' => $affiliate->id,
            'transaction_id' => $transaction->id,
            'amount' => $commissionAmount,
            'rate' => $commissionRate,
        ]);

        // Update affiliate stats
        $affiliate->increment('total_sales');
        $affiliate->increment('total_clicks'); // Basic conversion count
        $affiliate->increment('total_earnings', $commissionAmount);
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
