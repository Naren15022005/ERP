<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoryRequest;
use App\Models\Category;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['index']);
        $this->authorizeResource(Category::class, 'category');
    }

    // Listar categorías (árbol jerárquico)
    public function index()
    {
        $categories = Category::with('children')->whereNull('parent_id')->get();
        return response()->json($categories);
    }

    // Crear categoría
    public function store(CategoryRequest $request)
    {
        $validated = $request->validated();
        $category = Category::create($validated);
        return response()->json($category, 201);
    }

    // Actualizar categoría
    public function update(CategoryRequest $request, Category $category)
    {
        $validated = $request->validated();
        $category->update($validated);
        return response()->json($category);
    }

    // Eliminar categoría
    public function destroy(Category $category)
    {
        $category->delete();
        return response()->json(['message' => 'Categoría eliminada']);
    }
}
