<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaystackService
{
    private string $secretKey;
    private string $publicKey;
    private string $baseUrl = 'https://api.paystack.co';

    public function __construct()
    {
        $mode = Setting::getValue('paystack_mode', 'test');

        if ($mode === 'live') {
            $this->secretKey = Setting::getValue('paystack_live_secret_key', '');
            $this->publicKey = Setting::getValue('paystack_live_public_key', '');
        } else {
            $this->secretKey = Setting::getValue('paystack_test_secret_key', '');
            $this->publicKey = Setting::getValue('paystack_test_public_key', '');
        }
    }

    /**
     * Initialize a payment transaction
     */
    public function initializeTransaction(array $data): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Content-Type' => 'application/json',
        ])->post($this->baseUrl . '/transaction/initialize', [
            'email' => $data['email'],
            'amount' => $data['amount'] * 100, // Convert to kobo
            'reference' => $data['reference'] ?? $this->generateReference(),
            'callback_url' => $data['callback_url'] ?? null,
            'metadata' => $data['metadata'] ?? [],
        ]);

        if (!$response->successful()) {
            Log::error('Paystack initialization failed', [
                'response' => $response->json(),
                'status' => $response->status(),
            ]);
            throw new \Exception('Payment initialization failed: ' . $response->json('message'));
        }

        return $response->json();
    }

    /**
     * Verify a transaction
     */
    public function verifyTransaction(string $reference): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
        ])->get($this->baseUrl . '/transaction/verify/' . $reference);

        if (!$response->successful()) {
            Log::error('Paystack verification failed', [
                'reference' => $reference,
                'response' => $response->json(),
            ]);
            throw new \Exception('Payment verification failed');
        }

        return $response->json();
    }

    /**
     * Initialize a transfer to a recipient
     */
    public function initiateTransfer(array $data): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Content-Type' => 'application/json',
        ])->post($this->baseUrl . '/transfer', [
            'source' => 'balance',
            'amount' => $data['amount'] * 100, // Convert to kobo
            'recipient' => $data['recipient_code'],
            'reason' => $data['reason'] ?? 'Payout',
            'reference' => $data['reference'] ?? $this->generateReference(),
        ]);

        if (!$response->successful()) {
            Log::error('Paystack transfer failed', [
                'response' => $response->json(),
            ]);
            throw new \Exception('Transfer failed: ' . $response->json('message'));
        }

        return $response->json();
    }

    /**
     * Create a transfer recipient
     */
    public function createTransferRecipient(array $data): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
            'Content-Type' => 'application/json',
        ])->post($this->baseUrl . '/transferrecipient', [
            'type' => 'nuban',
            'name' => $data['account_name'],
            'account_number' => $data['account_number'],
            'bank_code' => $data['bank_code'],
            'currency' => 'NGN',
        ]);

        if (!$response->successful()) {
            Log::error('Paystack recipient creation failed', [
                'response' => $response->json(),
            ]);
            throw new \Exception('Recipient creation failed: ' . $response->json('message'));
        }

        return $response->json();
    }

    /**
     * Get list of Nigerian banks
     */
    public function getBanks(): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
        ])->get($this->baseUrl . '/bank', [
            'country' => 'nigeria',
        ]);

        if (!$response->successful()) {
            return [];
        }

        return $response->json('data', []);
    }

    /**
     * Resolve bank account details
     */
    public function resolveAccountNumber(string $accountNumber, string $bankCode): array
    {
        if (!$this->secretKey) {
            throw new \Exception('Paystack API keys not configured');
        }

        // Validate inputs
        if (strlen($accountNumber) < 10) {
            throw new \Exception('Account number must be at least 10 digits');
        }

        Log::info('Attempting Paystack account resolution', [
            'account_number' => $accountNumber,
            'bank_code' => $bankCode,
        ]);

        $response = Http::timeout(10)->withHeaders([
            'Authorization' => 'Bearer ' . $this->secretKey,
        ])->get($this->baseUrl . '/bank/resolve', [
            'account_number' => $accountNumber,
            'bank_code' => $bankCode,
        ]);

        Log::info('Paystack response received', [
            'status' => $response->status(),
            'body' => $response->body(),
        ]);

        if (!$response->successful()) {
            $errorMsg = $response->json('message') ?? $response->json('error') ?? 'Could not resolve account details';
            Log::error('Paystack account resolution failed', [
                'account_number' => $accountNumber,
                'bank_code' => $bankCode,
                'status' => $response->status(),
                'error' => $errorMsg,
                'response' => $response->json(),
            ]);
            throw new \Exception($errorMsg);
        }

        $data = $response->json('data');

        if (!$data || !isset($data['account_name'])) {
            throw new \Exception('Invalid response from Paystack - account name not found');
        }

        return $data;
    }

    /**
     * Generate a unique reference
     */
    private function generateReference(): string
    {
        return 'PS-' . uniqid() . '-' . time();
    }

    /**
     * Get public key for frontend
     */
    public function getPublicKey(): string
    {
        return $this->publicKey;
    }
}
