<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function __construct()
    {
        // Require authentication for all product API actions to ensure
        // tenant context is always available (prevents unauthenticated
        // requests from causing 403 responses or overwriting client cache).
        $this->middleware('auth:sanctum');
        $this->authorizeResource(\App\Models\Product::class, 'product');
    }
    public function index(Request $request)
    {
        // Defensive: ensure authenticated user present — return 401 for unauthenticated
        if (! $request->user()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated', 'code' => 'UNAUTHENTICATED'], 401);
        }

        $tenantId = $request->user()?->tenant_id;
        if (! $tenantId) {
            return response()->json(['success' => false, 'message' => 'Tenant missing', 'code' => 'TENANT_MISSING'], 403);
        }

        return Product::forTenant($tenantId)->with('category')->paginate(25);
    }

    public function show(Request $request, Product $product)
    {
        if (! $request->user()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated', 'code' => 'UNAUTHENTICATED'], 401);
        }

        $tenantId = $request->user()?->tenant_id;
        if (! $tenantId || $product->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Not found', 'code' => 'NOT_FOUND'], 404);
        }

        return $product->load('category');
    }

    public function store(StoreProductRequest $request)
    {
        if (! $request->user()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated', 'code' => 'UNAUTHENTICATED'], 401);
        }

        $tenantId = $request->user()?->tenant_id;
        if (! $tenantId) {
            return response()->json(['success' => false, 'message' => 'Tenant missing', 'code' => 'TENANT_MISSING'], 403);
        }

        // Debug log: record who is attempting to create a product and payload
        try {
            Log::info('ProductController@store called', [
                'user_id' => $request->user()?->id,
                'user_tenant_id' => $request->user()?->tenant_id,
                'payload' => $request->all(),
            ]);
        } catch (\Throwable $e) {
            // swallow logging errors
        }
        $validated = $request->validated();
        $validated['tenant_id'] = $tenantId;

        // If an image file was uploaded as part of the product creation request,
        // store it and set the image_url so the frontend doesn't need to upload
        // separately. This is a defensive fallback for clients that POST
        // multipart form data with `image` attached.
        if ($request->hasFile('image')) {
            try {
                $file = $request->file('image');
                $path = $file->store("products/{$tenantId}", 'public');
                $diskUrl = Storage::disk('public')->url($path);
                $assetUrl = asset('storage/' . $path);
                $url = $diskUrl;
                if (! $url || str_starts_with($url, '/')) $url = $assetUrl;
                $validated['image_url'] = $url;
            } catch (\Throwable $e) {
                try { Log::warning('Failed to store product image in fallback', ['err' => $e->getMessage()]); } catch (\Throwable $_) {}
            }
        }

        // Generate SKU on backend; retry on collision
        $attempts = 0;
        $maxAttempts = 6;
        do {
            $attempts++;
            $sku = Product::generateSku($tenantId);
            try {
                $p = new Product();
                // Assign allowed attributes explicitly
                $p->tenant_id = $tenantId;
                $p->category_id = $validated['category_id'] ?? null;
                $p->barcode = $validated['barcode'] ?? null;
                $p->name = $validated['name'];
                $p->description = $validated['description'] ?? null;
                $p->image_url = $validated['image_url'] ?? null;
                $p->price = $validated['price'] ?? 0;
                $p->cost = $validated['cost'] ?? null;
                $p->stock_min = $validated['stock_min'] ?? 0;
                $p->custom_fields = $validated['custom_fields'] ?? null;
                $p->is_active = $validated['is_active'] ?? true;
                // Set generated SKU
                $p->sku = $sku;
                $p->save();
                try {
                    Log::info('Product saved', [
                        'id' => $p->id,
                        'tenant_id' => $p->tenant_id,
                        'user_id' => $request->user()?->id,
                        'image_url' => $p->image_url,
                    ]);
                } catch (\Throwable $e) {}
                return response($p->load('category'), 201);
            } catch (QueryException $ex) {
                // Duplicate key — try again until max attempts
                // Look for unique constraint violations (duplicate SKU)
                if ($attempts >= $maxAttempts) {
                    throw $ex;
                }
                // otherwise loop to generate another SKU
            }
        } while ($attempts < $maxAttempts);

        abort(500, 'Unable to generate unique SKU');
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        if (! $request->user()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated', 'code' => 'UNAUTHENTICATED'], 401);
        }

        $tenantId = $request->user()?->tenant_id;
        if (! $tenantId || $product->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Not found', 'code' => 'NOT_FOUND'], 404);
        }
        $validated = $request->validated();
        // Ensure SKU is not updated
        unset($validated['sku']);

        // Update only allowed product base fields
        $allowed = ['name','price','description','category_id','image_url','cost','stock_min','custom_fields','is_active','barcode'];
        $updateData = array_intersect_key($validated, array_flip($allowed));
        $product->update($updateData);
        return $product->load('category');
    }

    public function destroy(Request $request, Product $product)
    {
        if (! $request->user()) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated', 'code' => 'UNAUTHENTICATED'], 401);
        }

        $tenantId = $request->user()?->tenant_id;
        if (! $tenantId || $product->tenant_id !== $tenantId) {
            return response()->json(['success' => false, 'message' => 'Not found', 'code' => 'NOT_FOUND'], 404);
        }

        $product->delete();
        return response('', 204);
    }
}
