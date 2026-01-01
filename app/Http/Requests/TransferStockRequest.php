<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TransferStockRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'product_id' => ['required','exists:products,id'],
            'from_warehouse_id' => ['required','exists:warehouses,id'],
            'to_warehouse_id' => ['required','exists:warehouses,id','different:from_warehouse_id'],
            'quantity' => ['required','numeric','gt:0'],
            'description' => ['nullable','string'],
            'idempotency_key' => ['nullable','string','max:191'],
        ];
    }
}
