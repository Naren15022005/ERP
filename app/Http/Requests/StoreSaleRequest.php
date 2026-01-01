<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use App\Rules\BelongsToTenant;
use App\Models\Product;
use App\Models\Customer;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['nullable','exists:customers,id', new BelongsToTenant(Customer::class)],
            'items' => 'required|array|min:1',
            'items.*.product_id' => ['required','exists:products,id', new BelongsToTenant(Product::class)],
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'subtotal' => 'required|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'total' => 'required|numeric|min:0',
            'sale_date' => 'nullable|date',
            'payment_method' => 'nullable|string|in:cash,card,transfer,other',
            'payment_reference' => 'nullable|string|max:255',
        ];
    }
}
