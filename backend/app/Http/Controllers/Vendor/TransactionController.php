<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TransactionController extends Controller
{
    /**
     * Display a listing of transactions for the vendor.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $vendor = $user->vendor;

        if (!$vendor) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor profile not found.',
            ], 404);
        }

        $limit = $request->query('limit', 10);

        $transactions = Transaction::where('vendor_id', $vendor->id)
            ->where('status', 'completed')
            ->with(['product:id,name,price', 'customer:id,first_name,last_name,email'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'transaction_ref' => $transaction->transaction_ref,
                    'product_name' => $transaction->product->name ?? 'N/A',
                    'customer_name' => $transaction->customer
                        ? trim(($transaction->customer->first_name ?? '') . ' ' . ($transaction->customer->last_name ?? ''))
                        : ($transaction->customer_email ?? 'Guest'),
                    'customer_email' => $transaction->customer_email ?? $transaction->customer->email ?? 'N/A',
                    'amount' => (float) $transaction->amount,
                    'vendor_amount' => (float) $transaction->vendor_amount,
                    'commission_amount' => (float) $transaction->commission_amount,
                    'payment_method' => $transaction->payment_method,
                    'status' => $transaction->status,
                    'created_at' => $transaction->created_at->format('Y-m-d H:i:s'),
                    'created_at_human' => $transaction->created_at->diffForHumans(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $transactions,
        ]);
    }
}
