<?php
namespace App\Http\Controllers\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

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
            'name' => 'required|string|max:255|unique:products,name,NULL,id,vendor_id,' . Auth::user()->vendor->id,
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'commission_rate' => 'required|numeric|min:0|max:100',
            'stock_quantity' => 'nullable|integer|min:0',
            'status' => 'nullable|string|in:active,inactive,draft',
            'sales_page_url' => 'nullable|url',
            'delivery_link' => 'nullable|url',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:1024',
            'buy_now_config' => 'nullable|array',
            'buy_now_config.button_text' => 'nullable|string|max:100',
            'buy_now_config.button_color' => 'nullable|string|max:20',
            'buy_now_config.redirect_url' => 'nullable|url',
            'buy_now_config.open_in_new_tab' => 'nullable|boolean',
        ]);

        $user = Auth::user();
        $vendor = $user->vendor;

        if (!$vendor) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor profile not found.',
            ], 404);
        }

        // Handle image upload
        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
        }

        $product = Product::create([
            'vendor_id' => $vendor->id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? '',
            'price' => $validated['price'],
            'commission_rate' => $validated['commission_rate'],
            'stock_quantity' => $validated['stock_quantity'] ?? 0,
            'approval_status' => 'pending',
            'is_active' => isset($validated['status']) ? ($validated['status'] === 'active') : false,
            'sales_page_url' => $validated['sales_page_url'] ?? null,
            'delivery_link' => $validated['delivery_link'] ?? null,
            'images' => $imagePath ? [$imagePath] : [],
            'buy_now_config' => $validated['buy_now_config'] ?? null,
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

        // Normalize camelCase inputs from frontend into snake_case
        $request->merge([
            'sales_page_url' => $request->input('sales_page_url', $request->input('salesPageUrl')),
            'delivery_link' => $request->input('delivery_link', $request->input('deliveryLink')),
            'commission_rate' => $request->input('commission_rate', $request->input('commissionRate')),
            'stock_quantity' => $request->input('stock_quantity', $request->input('stockQuantity')),
            'buy_now_config' => $request->input('buy_now_config', $request->input('buyNowConfig')),
        ]);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255|unique:products,name,' . $product->id . ',id,vendor_id,' . $vendor->id,
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric|min:0',
            'commission_rate' => 'sometimes|numeric|min:0|max:100',
            'stock_quantity' => 'nullable|integer|min:0',
            'status' => 'nullable|string|in:active,inactive,draft',
            'sales_page_url' => 'nullable|string',
            'delivery_link' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:1024',
            'buy_now_config' => 'nullable|array',
            'buy_now_config.button_text' => 'nullable|string|max:100',
            'buy_now_config.button_color' => 'nullable|string|max:20',
            'buy_now_config.redirect_url' => 'nullable|url',
            'buy_now_config.open_in_new_tab' => 'nullable|boolean',
        ]);

        // Clean up URL fields - convert empty strings to null
        if (isset($validated['sales_page_url']) && empty($validated['sales_page_url'])) {
            $validated['sales_page_url'] = null;
        }
        if (isset($validated['delivery_link']) && empty($validated['delivery_link'])) {
            $validated['delivery_link'] = null;
        }

        // Map status field to is_active
        if (isset($validated['status'])) {
            $validated['is_active'] = $validated['status'] === 'active';
            unset($validated['status']);
        }

        // Handle image upload and replace old one
        if ($request->hasFile('image')) {
            // Delete old image if exists
            if (!empty($product->images) && is_array($product->images)) {
                foreach ($product->images as $oldImage) {
                    Storage::disk('public')->delete($oldImage);
                }
            }
            $imagePath = $request->file('image')->store('products', 'public');
            $validated['images'] = [$imagePath];
        }

        // Explicitly handle all fields from request to ensure they're updated
        if (array_key_exists('name', $validated)) $product->name = $validated['name'];
        if (array_key_exists('description', $validated)) $product->description = $validated['description'] ?? '';
        if (array_key_exists('price', $validated)) $product->price = $validated['price'];
        if (array_key_exists('commission_rate', $validated)) $product->commission_rate = $validated['commission_rate'];
        if (array_key_exists('stock_quantity', $validated)) $product->stock_quantity = $validated['stock_quantity'] ?? 0;
        if (isset($validated['is_active'])) $product->is_active = $validated['is_active'];
        if (array_key_exists('sales_page_url', $validated)) $product->sales_page_url = $validated['sales_page_url'];
        if (array_key_exists('delivery_link', $validated)) $product->delivery_link = $validated['delivery_link'];
        if (isset($validated['images'])) $product->images = $validated['images'];
        if (array_key_exists('buy_now_config', $validated)) $product->buy_now_config = $validated['buy_now_config'];

        // Save the changes
        $saved = $product->save();

        // Log for debugging
        \Log::info('Product Update', [
            'product_id' => $product->id,
            'saved' => $saved,
            'delivery_link' => $product->delivery_link,
            'sales_page_url' => $product->sales_page_url,
        ]);

        // Refresh to ensure we return the latest data
        $product->refresh();

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

        // Delete associated images
        if (!empty($product->images) && is_array($product->images)) {
            foreach ($product->images as $image) {
                Storage::disk('public')->delete($image);
            }
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully.',
        ]);
    }
}

