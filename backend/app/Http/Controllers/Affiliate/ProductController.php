<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Display a listing of all active products for affiliates.
     */
    public function index()
    {
        $products = Product::where('is_active', true)
            ->where('approval_status', 'approved')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Display the specified product.
     */
    public function show($id)
    {
        $product = Product::where('is_active', true)
            ->where('approval_status', 'approved')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }
}
