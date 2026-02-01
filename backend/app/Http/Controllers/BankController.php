<?php

namespace App\Http\Controllers;

use App\Services\AutomaticWithdrawalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BankController extends Controller
{
    /**
     * Get list of supported banks from Paystack
     */
    public function index(AutomaticWithdrawalService $withdrawalService)
    {
        try {
            $banks = $withdrawalService->getSupportedBanks();
            
            return response()->json([
                'success' => true,
                'data' => $banks,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch banks', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch banks',
            ], 500);
        }
    }

    /**
     * Verify bank account details
     */
    public function verifyAccount(Request $request, AutomaticWithdrawalService $withdrawalService)
    {
        $validated = $request->validate([
            'account_number' => 'required|string|min:10|max:10',
            'bank_code' => 'required|string',
        ]);

        try {
            $accountDetails = $withdrawalService->verifyBankAccount(
                $validated['account_number'],
                $validated['bank_code']
            );
            
            return response()->json([
                'success' => true,
                'data' => $accountDetails,
            ]);
        } catch (\Exception $e) {
            Log::error('Account verification failed', [
                'account_number' => $validated['account_number'],
                'bank_code' => $validated['bank_code'],
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
