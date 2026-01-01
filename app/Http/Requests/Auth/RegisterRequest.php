<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'tenant_name' => ['required', 'string', 'max:255'],
            'business_type' => ['nullable', 'string', 'max:255'],
            'business_description' => ['nullable', 'string', 'max:1000'],
            'employees_count' => ['nullable', 'integer', 'min:1', 'max:5'],
            'size_category' => ['nullable', 'string', 'in:microempresa,pequena,mediana,grande,empresa,macroempresa,granempresa'],
            'modules' => ['nullable', 'array'],
            'modules.*' => ['string', 'in:dashboard,ventas,caja,products,roles,users,purchases,suppliers,accounting,reportes'],
        ];
    }
}
