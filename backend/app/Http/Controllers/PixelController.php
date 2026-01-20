<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PixelController extends Controller
{
    /**
     * Track conversion pixel for payment confirmation
     */
    public function trackConversion(Request $request)
    {
        $reference = $request->query('ref');

        if (!$reference) {
            return $this->pixel();
        }

        try {
            // Log the conversion
            $transaction = Transaction::where('payment_reference', $reference)
                ->orWhere('transaction_ref', $reference)
                ->first();

            if ($transaction) {
                Log::info('Conversion pixel tracked', [
                    'transaction_id' => $transaction->id,
                    'reference' => $reference,
                    'affiliate_id' => $transaction->affiliate_id,
                    'product_id' => $transaction->product_id,
                ]);
            } else {
                Log::warning('Conversion pixel tracked for unknown reference', [
                    'reference' => $reference,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Pixel tracking error', [
                'reference' => $reference,
                'error' => $e->getMessage(),
            ]);
        }

        // Return 1x1 transparent GIF pixel
        return $this->pixel();
    }

    /**
     * Return a 1x1 transparent GIF pixel
     */
    private function pixel()
    {
        // 1x1 transparent GIF
        $gif = base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');

        return response($gif)
            ->header('Content-Type', 'image/gif')
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            ->header('Pragma', 'no-cache');
    }
}
