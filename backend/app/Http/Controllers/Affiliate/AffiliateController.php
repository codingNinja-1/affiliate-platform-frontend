<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AffiliateController extends Controller
{
    public function getSettings(Request $request)
    {
        // Example: return default currency and a success message
        return response()->json([
            'currency' => 'NGN',
            'message' => 'Settings loaded successfully'
        ]);
    }
}
