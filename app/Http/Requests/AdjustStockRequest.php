<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdjustStockRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'product_id' => ['required','exists:products,id'],
            'warehouse_id' => ['nullable','exists:warehouses,id'],
            'movement_type' => ['required','in:in,out'],
            'quantity' => ['required','numeric'],
            'description' => ['nullable','string'],
            'idempotency_key' => ['nullable','string','max:191'],
        ];
    }
}
