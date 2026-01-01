<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Rules\BelongsToTenant;
use App\Models\Category;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // policies handle authorization
    }

    public function rules(): array
    {
        return [
            'category_id' => ['nullable', 'exists:categories,id', new BelongsToTenant(Category::class)],
            'barcode' => 'nullable|string|max:128',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'image_url' => 'nullable|string|max:2048',
            'price' => 'required|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'stock_min' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
        ];
    }
}
