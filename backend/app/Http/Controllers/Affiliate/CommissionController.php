<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\Commission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommissionController extends Controller
{
    /**
     * Display a listing of commissions for the affiliate.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $limit = $request->query('limit', 10);

        $commissions = Commission::where('user_id', $user->id)
            ->where('user_type', 'affiliate')
            ->with(['product:id,name,price', 'transaction:id,transaction_ref,created_at'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($commission) {
                return [
                    'id' => $commission->id,
                    'product_name' => $commission->product->name ?? 'N/A',
                    'amount' => (float) $commission->amount,
                    'status' => $commission->status,
                    'transaction_ref' => $commission->transaction->transaction_ref ?? 'N/A',
                    'created_at' => $commission->created_at->format('Y-m-d H:i:s'),
                    'created_at_human' => $commission->created_at->diffForHumans(),
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $commissions,
        ]);
    }
}
