<?php

namespace App\Http\Controllers;

use App\Services\VapidKeyService;
use Illuminate\Http\JsonResponse;

class VapidKeyController extends Controller
{
    /**
     * Get VAPID public key for client-side subscription
     * GET /api/push/vapid-key
     */
    public function get(): JsonResponse
    {
        try {
            $keys = VapidKeyService::getKeys();

            if (!$keys['public']) {
                return response()->json([
                    'error' => 'VAPID keys not configured',
                    'message' => 'Admin must run: php artisan vapid:generate',
                ], 500);
            }

            return response()->json([
                'public_key' => $keys['public'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to retrieve VAPID key',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
