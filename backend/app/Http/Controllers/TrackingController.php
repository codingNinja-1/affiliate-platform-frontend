<?php

namespace App\Http\Controllers;

use App\Models\Affiliate;
use App\Models\AffiliateClick;
use App\Models\Product;
use Illuminate\Http\Request;

class TrackingController extends Controller
{
    /**
     * Track affiliate click and return redirect URL
     */
    public function trackClick($referralCode, $productId, Request $request)
    {
        $affiliate = Affiliate::where('referral_code', $referralCode)->first();
        $product = Product::find($productId);

        if (!$affiliate || !$product) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid referral link',
            ], 404);
        }

        // Record the click
        AffiliateClick::create([
            'affiliate_id' => $affiliate->id,
            'product_id' => $product->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'referrer' => $request->header('referer'),
            'device_type' => $this->getDeviceType($request->userAgent()),
            'browser' => $this->getBrowser($request->userAgent()),
            'os' => $this->getOS($request->userAgent()),
            'country' => $request->header('cf-ipcountry') ?? 'NG',
        ]);

        // Return JSON with redirect URL for frontend to handle
        return response()->json([
            'success' => true,
            'message' => 'Click tracked successfully',
            'redirect_url' => "/products/{$product->slug}?ref={$referralCode}",
        ]);
    }

    /**
     * Get device type from user agent
     */
    private function getDeviceType($userAgent)
    {
        if (preg_match('/mobile|android|iphone|ipod|blackberry|windows phone/i', $userAgent)) {
            return 'mobile';
        } elseif (preg_match('/tablet|ipad/i', $userAgent)) {
            return 'tablet';
        }
        return 'desktop';
    }

    /**
     * Get browser from user agent
     */
    private function getBrowser($userAgent)
    {
        if (preg_match('/firefox/i', $userAgent)) {
            return 'Firefox';
        } elseif (preg_match('/chrome/i', $userAgent)) {
            return 'Chrome';
        } elseif (preg_match('/safari/i', $userAgent)) {
            return 'Safari';
        } elseif (preg_match('/edge/i', $userAgent)) {
            return 'Edge';
        }
        return 'Other';
    }

    /**
     * Get OS from user agent
     */
    private function getOS($userAgent)
    {
        if (preg_match('/windows/i', $userAgent)) {
            return 'Windows';
        } elseif (preg_match('/mac/i', $userAgent)) {
            return 'macOS';
        } elseif (preg_match('/linux/i', $userAgent)) {
            return 'Linux';
        } elseif (preg_match('/android/i', $userAgent)) {
            return 'Android';
        } elseif (preg_match('/iphone|ipad/i', $userAgent)) {
            return 'iOS';
        }
        return 'Other';
    }
}
