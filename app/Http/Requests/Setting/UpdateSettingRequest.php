<?php

namespace App\Http\Requests\Setting;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'company' => ['sometimes', 'array'],
            'company.name' => ['sometimes', 'string', 'max:255'],
            'company.rfc' => ['sometimes', 'string', 'max:100'],
            'company.address' => ['sometimes', 'string', 'max:1000'],

            'currency' => ['sometimes', 'string', 'max:10'],
            'timezone' => ['sometimes', 'string', 'max:100'],

            'taxes' => ['sometimes', 'array'],
            'taxes.vat' => ['sometimes', 'numeric'],
            'taxes.withholding' => ['sometimes', 'numeric'],

            'modules' => ['sometimes', 'array'],
            'modules.*' => ['string'],
        ];
    }
}
