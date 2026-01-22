<?php

namespace App\Http\Controllers;

use App\Models\AffiliateClick;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ClickTrackingController extends Controller
{
    /**
     * Track an affiliate click using affiliate ID and product ID
     */
    public function trackClick(Request $request)
    {
        try {
            $validated = $request->validate([
                'affiliate_id' => 'required|integer|exists:affiliates,id',
                'product_id' => 'required|integer|exists:products,id',
            ]);

            // Check if product exists and is active
            $product = Product::find($validated['product_id']);
            if (!$product || !$product->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found or inactive'
                ], 404);
            }

            // Create click record
            $click = AffiliateClick::create([
                'affiliate_id' => $validated['affiliate_id'],
                'product_id' => $validated['product_id'],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'referer' => $request->header('referer'),
                'clicked_at' => now(),
            ]);

            Log::info('Affiliate click tracked', [
                'click_id' => $click->id,
                'affiliate_id' => $validated['affiliate_id'],
                'product_id' => $validated['product_id'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Click tracked successfully',
                'data' => [
                    'click_id' => $click->id,
                ]
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error tracking click', [
                'error' => $e->getMessage(),
                'request' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to track click'
            ], 500);
        }
    }
}
