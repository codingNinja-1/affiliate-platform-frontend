<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ImageController extends Controller
{
    /**
     * Serve product images
     */
    public function serve(Request $request)
    {
        $path = $request->query('path');
        
        if (!$path) {
            return response()->json(['error' => 'Missing path'], 400);
        }

        // Remove leading slash and storage prefix if present
        $path = ltrim($path, '/');
        if (strpos($path, 'storage/') === 0) {
            $path = substr($path, 8); // Remove 'storage/' prefix
        }

        try {
            // Try to get the file from storage
            if (Storage::disk('public')->exists($path)) {
                $file = Storage::disk('public')->get($path);
                $mimeType = Storage::disk('public')->mimeType($path);
                
                return response($file)
                    ->header('Content-Type', $mimeType)
                    ->header('Cache-Control', 'public, max-age=86400');
            }

            // Try local storage
            if (Storage::exists($path)) {
                $file = Storage::get($path);
                $mimeType = Storage::mimeType($path);
                
                return response($file)
                    ->header('Content-Type', $mimeType)
                    ->header('Cache-Control', 'public, max-age=86400');
            }

            return response()->json(['error' => 'Image not found'], 404);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to serve image: ' . $e->getMessage()], 500);
        }
    }
}
