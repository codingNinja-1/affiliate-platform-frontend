<?php

namespace App\Services;

use App\Models\Commission;
use App\Models\EmailLog;
use App\Models\Transaction;
use App\Notifications\AffiliateSaleNotification;
use App\Notifications\VendorSaleNotification;

class SaleNotificationService
{
    public function send(Transaction $transaction, ?Commission $commission = null): void
    {
        $transaction->loadMissing(['product', 'affiliate.user', 'vendor.user']);

        $product = $transaction->product;
        $amount = number_format((float) ($transaction->amount ?? 0), 2);
        $commissionAmount = number_format((float) ($transaction->commission_amount ?? 0), 2);
        $customerEmail = $transaction->customer_email ?? '';

        $this->notifyAffiliate($transaction, $product?->name ?? '', $amount, $commissionAmount, $customerEmail, $commission);
        $this->notifyVendor($transaction, $product?->name ?? '', $amount, $commissionAmount, $customerEmail);
    }

    private function notifyAffiliate(Transaction $transaction, string $productName, string $amount, string $commissionAmount, string $customerEmail, ?Commission $commission): void
    {
        $affiliateUser = $transaction->affiliate?->user;

        if (!$affiliateUser || !$affiliateUser->email) {
            return;
        }

        $notification = new AffiliateSaleNotification([
            'name' => trim(($affiliateUser->first_name ?? '') . ' ' . ($affiliateUser->last_name ?? '')) ?: ($affiliateUser->name ?? $affiliateUser->email),
            'product_name' => $productName,
            'amount' => $amount,
            'commission' => $commissionAmount,
            'customer_email' => $customerEmail,
        ]);

        try {
            $affiliateUser->notify($notification);
            EmailLog::log(
                $affiliateUser->email,
                $notification->resolvedSubject($affiliateUser),
                $notification->templateKey(),
                'sent',
                [
                    'transaction_id' => $transaction->id,
                    'commission_id' => $commission?->id,
                    'product_id' => $transaction->product?->id,
                    'role' => 'affiliate',
                ]
            );
        } catch (\Exception $e) {
            EmailLog::log(
                $affiliateUser->email,
                null,
                $notification->templateKey(),
                'failed',
                [
                    'transaction_id' => $transaction->id,
                    'commission_id' => $commission?->id,
                    'product_id' => $transaction->product?->id,
                    'role' => 'affiliate',
                ],
                $e->getMessage()
            );
        }
    }

    private function notifyVendor(Transaction $transaction, string $productName, string $amount, string $commissionAmount, string $customerEmail): void
    {
        $vendorUser = $transaction->vendor?->user ?? $transaction->product?->vendor?->user;

        if (!$vendorUser || !$vendorUser->email) {
            return;
        }

        $notification = new VendorSaleNotification([
            'name' => trim(($vendorUser->first_name ?? '') . ' ' . ($vendorUser->last_name ?? '')) ?: ($vendorUser->name ?? $vendorUser->email),
            'product_name' => $productName,
            'amount' => $amount,
            'commission' => $commissionAmount,
            'customer_email' => $customerEmail,
        ]);

        try {
            $vendorUser->notify($notification);
            EmailLog::log(
                $vendorUser->email,
                $notification->resolvedSubject($vendorUser),
                $notification->templateKey(),
                'sent',
                [
                    'transaction_id' => $transaction->id,
                    'product_id' => $transaction->product?->id,
                    'role' => 'vendor',
                ]
            );
        } catch (\Exception $e) {
            EmailLog::log(
                $vendorUser->email,
                null,
                $notification->templateKey(),
                'failed',
                [
                    'transaction_id' => $transaction->id,
                    'product_id' => $transaction->product?->id,
                    'role' => 'vendor',
                ],
                $e->getMessage()
            );
        }
    }
}
