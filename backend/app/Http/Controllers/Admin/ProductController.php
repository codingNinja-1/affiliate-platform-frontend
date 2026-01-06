<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('vendor:id,user_id');

        // Filter by approval status if provided
        if ($request->has('status')) {
            $query->where('approval_status', $request->status);
        }

        $products = $query->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'vendor' => $product->vendor?->user_id ?? 'N/A',
                    'price' => $product->price,
                    'commission_rate' => $product->commission_rate,
                    'approval_status' => $product->approval_status,
                    'rejection_reason' => $product->rejection_reason,
                    'created_at' => $product->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    public function approve(Request $request, $productId)
    {
        $product = Product::findOrFail($productId);
        $userId = optional($request->user())->id ?? 1;
        $product->approve($userId);

        return response()->json([
            'success' => true,
            'message' => 'Product approved successfully',
            'data' => $product,
        ]);
    }

    public function reject(Request $request, $productId)
    {
        $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $product = Product::findOrFail($productId);
        $product->reject($request->reason);

        return response()->json([
            'success' => true,
            'message' => 'Product rejected successfully',
            'data' => $product,
        ]);
    }
}
