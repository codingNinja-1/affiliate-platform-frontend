<?php

namespace App\Http\Controllers;

use App\Models\Product;

class ProductController extends Controller
{
    /**
     * Display approved products for customers/public.
     */
    public function index()
    {
        $products = Product::where('approval_status', 'approved')
            ->where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Display specific product details.
     */
    public function show($slug)
    {
        $product = Product::where('slug', $slug)
            ->where('approval_status', 'approved')
            ->where('is_active', true)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }
}
