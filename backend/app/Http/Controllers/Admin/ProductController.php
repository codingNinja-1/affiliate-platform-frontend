<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        if (!$user || !in_array($user->user_type, ['admin', 'superadmin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $status = $request->query('status');
        $search = $request->query('search');
        $page = $request->query('page', 1);
        $perPage = $request->query('per_page', 50);

        $query = Product::query();

        if ($status) {
            $query->where('approval_status', $status);
        }

        if ($search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('product_id', 'like', "%{$search}%");
        }

        $products = $query->with(['vendor' => function ($q) {
            $q->select('id');
        }])->orderBy('created_at', 'desc')->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'success' => true,
            'data' => $products->items(),
            'pagination' => [
                'total' => $products->total(),
                'per_page' => $products->perPage(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
            ],
        ]);
    }

    public function show($id)
    {
        $user = Auth::user();

        if (!$user || !in_array($user->user_type, ['admin', 'superadmin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $product = Product::with('vendor')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    public function approve(Request $request, $productId)
    {
        $user = Auth::user();

        if (!$user || !in_array($user->user_type, ['admin', 'superadmin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $product = Product::findOrFail($productId);

        if ($product->approval_status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending products can be approved.',
            ], 400);
        }

        $product->update([
            'approval_status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Product approved successfully',
            'data' => $product,
        ]);
    }

    public function reject(Request $request, $productId)
    {
        $user = Auth::user();

        if (!$user || !in_array($user->user_type, ['admin', 'superadmin'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized.',
            ], 403);
        }

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $product = Product::findOrFail($productId);

        if ($product->approval_status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Only pending products can be rejected.',
            ], 400);
        }

        $product->update([
            'approval_status' => 'rejected',
            'rejection_reason' => $validated['reason'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Product rejected successfully',
            'data' => $product,
        ]);
    }
}
