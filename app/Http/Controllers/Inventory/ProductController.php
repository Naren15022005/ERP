<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;

class ProductController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->authorizeResource(\App\Models\Product::class, 'product');
    }

    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        $q = Product::where('tenant_id', $tenantId)->with('category');

        if ($request->filled('category_id')) {
            $q->where('category_id', $request->query('category_id'));
        }

        if ($request->filled('q')) {
            $term = $request->query('q');
            $q->where(function ($s) use ($term) {
                $s->where('name', 'ilike', "%{$term}%")
                  ->orWhere('sku', 'ilike', "%{$term}%");
            });
        }

        if ($request->has('is_active')) {
            $q->where('is_active', (bool) $request->query('is_active'));
        }

        $perPage = (int) $request->query('per_page', 15);
        $products = $q->paginate($perPage)->appends($request->query());

        return ProductResource::collection($products);
    }

    public function show(Request $request, Product $product)
    {
        $product->load('category');
        return new ProductResource($product);
    }

    public function store(StoreProductRequest $request)
    {
        // Inventory module must NOT create products. Product creation belongs to the Products module.
        abort(405, 'Inventory module cannot create products');
    }

    public function update(UpdateProductRequest $request, Product $product)
    {
        // Inventory module must NOT update product master data (name, price, sku, etc.).
        abort(405, 'Inventory module cannot modify product master data');
    }

    public function destroy(Request $request, Product $product)
    {
        // Prevent deleting products from inventory context
        abort(405, 'Inventory module cannot delete products');
    }
}

