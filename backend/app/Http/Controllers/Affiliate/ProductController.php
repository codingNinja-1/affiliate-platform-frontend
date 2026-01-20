<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\AffiliateClick;
use App\Models\Transaction; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProductController extends Controller
{
    /**
     * Display a listing of all active products for affiliates.
     */
    public function index()
    {
        $user = Auth::user();
        $affiliateId = $user?->affiliate?->id;

        $products = Product::where('is_active', true)
            ->where('approval_status', 'approved')
            ->orderBy('created_at', 'desc')
            ->get();

        // Add stats for each product if affiliate is authenticated
        if ($affiliateId) {
            $products = $products->map(function ($product) use ($affiliateId) {
                $clicks = AffiliateClick::where('affiliate_id', $affiliateId)
                    ->where('product_id', $product->id)
                    ->count();

                $sales = Transaction::where('affiliate_id', $affiliateId)
                    ->where('product_id', $product->id)
                    ->where('status', 'completed')
                    ->count();

                $product->clicks = $clicks;
                $product->sales = $sales;

                return $product;
            });
        }

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
