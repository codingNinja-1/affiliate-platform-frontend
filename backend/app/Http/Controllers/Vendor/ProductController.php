<?php

namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProductController extends Controller
{
    /**
     * Display a listing of vendor's products.
     */
    public function index()
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        // For vendors, get their vendor profile
        $vendor = $user->vendor;

        if (!$vendor) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor profile not found.',
            ], 404);
        }

        $products = Product::where('vendor_id', $vendor->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Store a newly created product.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'commission_rate' => 'required|numeric|min:0|max:100',
            'stock_quantity' => 'nullable|integer|min:0',
            'status' => 'nullable|string|in:active,inactive,draft',
        ]);

        $user = Auth::user();
        $vendor = $user->vendor;

        if (!$vendor) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor profile not found.',
            ], 404);
        }

        $product = Product::create([
            'vendor_id' => $vendor->id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? '',
            'price' => $validated['price'],
            'commission_rate' => $validated['commission_rate'],
            'stock_quantity' => $validated['stock_quantity'] ?? 0,
            'approval_status' => 'pending',
            'is_active' => $validated['status'] === 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Product created successfully.',
            'data' => $product,
        ], 201);
    }

    /**
     * Display the specified product.
     */
    public function show($id)
    {
        $user = Auth::user();
        $vendor = $user->vendor;

        if (!$vendor) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor profile not found.',
            ], 404);
        }

        $product = Product::where('vendor_id', $vendor->id)->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    /**
     * Update the specified product.
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $vendor = $user->vendor;

        if (!$vendor) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor profile not found.',
            ], 404);
        }

        $product = Product::where('vendor_id', $vendor->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'commission_rate' => 'sometimes|numeric|min:0|max:100',
            'stock_quantity' => 'nullable|integer|min:0',
            'status' => 'nullable|string|in:active,inactive,draft',
        ]);

        $product->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Product updated successfully.',
            'data' => $product,
        ]);
    }

    /**
     * Delete the specified product.
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $vendor = $user->vendor;

        if (!$vendor) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor profile not found.',
            ], 404);
        }

        $product = Product::where('vendor_id', $vendor->id)->findOrFail($id);
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully.',
        ]);
    }
}

