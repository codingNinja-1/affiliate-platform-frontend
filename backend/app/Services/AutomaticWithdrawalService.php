<?php

namespace App\Services;

use App\Models\Withdrawal;
use App\Models\User;
use App\Models\Setting;
use App\Models\EmailLog;
use App\Mail\WithdrawalApprovedMail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class AutomaticWithdrawalService
{
    private PaystackService $paystack;

    public function __construct(PaystackService $paystack)
    {
        $this->paystack = $paystack;
    }

    /**
     * Process automatic withdrawal with instant payout
     */
    public function processWithdrawal(Withdrawal $withdrawal, User $user): array
    {
        $enableAutomatic = Setting::getValue('enable_automatic_withdrawals', true);
        if (!$enableAutomatic) {
            return [
                'success' => false,
                'message' => 'Your withdrawal request has been received and is being reviewed by our team. You will be notified once it is processed.',
                'data' => $withdrawal,
            ];
        }

        try {
            // Step 1: Get bank code from bank name
            $bankCode = $this->getBankCode($withdrawal->bank_name);

            if (!$bankCode) {
                throw new \Exception('Bank not found or not supported');
            }

            // Update withdrawal with bank code
            $withdrawal->update(['bank_code' => $bankCode]);

            // Step 2: Create or get transfer recipient
            $recipientCode = $this->getOrCreateRecipient($withdrawal);

            // Step 3: Initiate transfer
            $transferResponse = $this->paystack->initiateTransfer([
                'amount' => $withdrawal->amount,
                'recipient_code' => $recipientCode,
                'reason' => 'Withdrawal payout for ' . $user->email,
                'reference' => $withdrawal->withdrawal_ref ?? $withdrawal->uuid,
            ]);

            // Step 4: Update withdrawal with transfer details
            $withdrawal->update([
                'transfer_code' => $transferResponse['data']['transfer_code'] ?? null,
                'payout_response' => json_encode($transferResponse),
                'status' => 'approved',
                'processed_at' => now(),
            ]);

            Log::info('Automatic withdrawal processed successfully', [
                'withdrawal_id' => $withdrawal->id,
                'transfer_code' => $withdrawal->transfer_code,
                'user_id' => $user->id,
            ]);

            // Send approval email notification
            try {
                if ($user && $user->email) {
                    $mail = new WithdrawalApprovedMail($withdrawal);
                    Mail::to($user->email)->send($mail);

                    EmailLog::log(
                        $user->email,
                        $mail->subject ?? null,
                        'withdrawal_approved',
                        'sent',
                        [
                            'withdrawal_id' => $withdrawal->id,
                            'user_type' => $withdrawal->user_type,
                            'automatic' => true,
                        ]
                    );
                }
            } catch (\Exception $e) {
                EmailLog::log(
                    $user->email ?? 'unknown',
                    null,
                    'withdrawal_approved',
                    'failed',
                    [
                        'withdrawal_id' => $withdrawal->id,
                        'user_type' => $withdrawal->user_type,
                        'automatic' => true,
                    ],
                    $e->getMessage()
                );
            }

            return [
                'success' => true,
                'message' => 'Withdrawal processed successfully. Funds should arrive within minutes.',
                'data' => $withdrawal,
            ];

        } catch (\Exception $e) {
            $errorMessage = $e->getMessage();
            Log::error('Automatic withdrawal failed', [
                'withdrawal_id' => $withdrawal->id,
                'error' => $errorMessage,
                'trace' => $e->getTraceAsString(),
            ]);

            // Rollback the withdrawal and refund balance
            $this->rollbackWithdrawal($withdrawal, $user, $errorMessage);

            // Check if this is a Paystack account restriction error
            if ($this->isPaystackTransferRestriction($errorMessage)) {
                return [
                    'success' => false,
                    'message' => 'Payouts are temporarily unavailable. Please contact support.',
                    'data' => null,
                ];
            }

            return [
                'success' => false,
                'message' => 'Withdrawal failed: ' . $errorMessage,
                'data' => null,
            ];
        }
    }

    /**
     * Get or create Paystack transfer recipient
     */
    private function getOrCreateRecipient(Withdrawal $withdrawal): string
    {
        // If we already have a recipient code, reuse it
        if ($withdrawal->recipient_code) {
            return $withdrawal->recipient_code;
        }

        // Create new recipient
        $recipientResponse = $this->paystack->createTransferRecipient([
            'account_name' => $withdrawal->account_name,
            'account_number' => $withdrawal->account_number,
            'bank_code' => $withdrawal->bank_code,
        ]);

        $recipientCode = $recipientResponse['data']['recipient_code'];

        // Save recipient code for future use
        $withdrawal->update(['recipient_code' => $recipientCode]);

        return $recipientCode;
    }

    /**
     * Get bank code from bank name
     */
    private function getBankCode(string $bankName): ?string
    {
        $banks = $this->paystack->getBanks();

        foreach ($banks as $bank) {
            if (stripos($bank['name'], $bankName) !== false ||
                stripos($bankName, $bank['name']) !== false) {
                return $bank['code'];
            }
        }

        return null;
    }

    /**
     * Check if error is a Paystack account transfer restriction
     */
    private function isPaystackTransferRestriction(string $error): bool
    {
        $restrictionKeywords = [
            'third party payouts',
            'starter',
            'transfer not enabled',
            'payouts not enabled',
            '405',
            'restricted',
        ];

        $lowerError = strtolower($error);
        foreach ($restrictionKeywords as $keyword) {
            if (stripos($lowerError, $keyword) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Rollback failed withdrawal and refund balance
     */
    private function rollbackWithdrawal(Withdrawal $withdrawal, User $user, string $reason): void
    {
        DB::beginTransaction();
        try {
            // Update withdrawal status to failed
            $withdrawal->update([
                'status' => 'rejected',
                'payout_response' => json_encode(['error' => $reason]),
                'processed_at' => now(),
            ]);

            // Refund balance based on user type
            if ($withdrawal->user_type === 'vendor') {
                $vendor = $user->vendor;
                if ($vendor) {
                    $vendor->increment('balance', $withdrawal->amount);
                }
            } elseif ($withdrawal->user_type === 'affiliate') {
                $affiliate = $user->affiliate;
                if ($affiliate) {
                    $affiliate->increment('balance', $withdrawal->amount);
                }
            }

            DB::commit();

            Log::info('Withdrawal rolled back and balance refunded', [
                'withdrawal_id' => $withdrawal->id,
                'amount' => $withdrawal->amount,
                'user_id' => $user->id,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to rollback withdrawal', [
                'withdrawal_id' => $withdrawal->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get list of supported banks
     */
    public function getSupportedBanks(): array
    {
        return $this->paystack->getBanks();
    }

    /**
     * Verify bank account details
     */
    public function verifyBankAccount(string $accountNumber, string $bankCode): array
    {
        return $this->paystack->resolveAccountNumber($accountNumber, $bankCode);
    }
}
