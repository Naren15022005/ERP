<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;


class CategoryController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['index']);
        $this->authorizeResource(\App\Models\Category::class, 'category');
    }
    public function index()
    {
        $tenantId = auth()->user()?->tenant_id;
        if (! $tenantId) abort(403);
        return Category::forTenant($tenantId)->get();
    }

    public function show(Request $request, Category $category)
    {
        $tenantId = $request->user()?->tenant_id;
        if (! $tenantId || $category->tenant_id !== $tenantId) abort(404);
        return $category;
    }

    public function store(Request $request)
    {
        $tenantId = $request->user()?->tenant_id;
        if (! $tenantId) abort(403);
        $data = $request->validate(['name' => 'required|string|max:255','description' => 'nullable|string']);
        $data['tenant_id'] = $tenantId;
        $cat = Category::create($data);
        return response($cat, 201);
    }

    public function update(Request $request, Category $category)
    {
        $tenantId = $request->user()?->tenant_id;
        if (! $tenantId || $category->tenant_id !== $tenantId) abort(404);
        $data = $request->validate(['name' => 'required|string|max:255','description' => 'nullable|string']);
        $category->update($data);
        return $category;
    }

    public function destroy(Request $request, Category $category)
    {
        $tenantId = $request->user()?->tenant_id;
        if (! $tenantId || $category->tenant_id !== $tenantId) abort(404);
        $category->delete();
        return response('', 204);
    }
}
