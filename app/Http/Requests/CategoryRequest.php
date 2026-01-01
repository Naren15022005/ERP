<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Rules\BelongsToTenant;
use App\Models\Category;

class CategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Authorization handled by controller policies (authorizeResource)
        return true;
    }

    public function rules(): array
    {
        $rules = [
            'name' => 'required|string|max:255',
            'parent_id' => ['nullable', 'exists:categories,id', new BelongsToTenant(Category::class)],
        ];

        if ($this->isMethod('put') || $this->isMethod('patch')) {
            $rules['name'] = 'sometimes|required|string|max:255';
            // prevent self-parenting
            if ($this->route('category')) {
                $rules['parent_id'][] = Rule::notIn([$this->route('category')->id]);
            }
        }

        return $rules;
    }
}
