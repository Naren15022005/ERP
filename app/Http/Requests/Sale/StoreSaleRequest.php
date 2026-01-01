<?php

namespace App\Http\Requests\Sale;

use Illuminate\Foundation\Http\FormRequest;

class StoreSaleRequest extends FormRequest
{
    public function authorize()
    {
        // Authorization handled by controllers/middleware (roles/permissions)
        return true;
    }

    public function rules()
    {
        return [
            'customer_id' => ['nullable', 'exists:customers,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.price' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['nullable', 'string'],
            'payment_reference' => ['nullable', 'string'],
            'tax_rate' => ['nullable', 'numeric'],
            'discount_total' => ['nullable', 'numeric'],
        ];
    }

    public function messages()
    {
        return [
            'items.required' => 'La venta debe contener al menos un item.',
            'items.*.product_id.exists' => 'El producto indicado no existe.',
            'items.*.quantity.min' => 'La cantidad mínima por item es 1.',
        ];
    }

    protected function prepareForValidation()
    {
        // Extract Idempotency-Key from header into payload if present
        if ($this->header('Idempotency-Key')) {
            $this->merge(['idempotency_key' => $this->header('Idempotency-Key')]);
        }
    }
}
