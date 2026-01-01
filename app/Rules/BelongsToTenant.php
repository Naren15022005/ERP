<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class BelongsToTenant implements Rule
{
    protected $modelClass;

    public function __construct(string $modelClass)
    {
        $this->modelClass = $modelClass;
    }

    public function passes($attribute, $value)
    {
        if (! $value) return false;

        $modelClass = $this->modelClass;

        if (! class_exists($modelClass)) return false;

        $model = $modelClass::find($value);

        if (! $model) return false;

        $user = Auth::user();
        if (! $user) return false;

        // Super admin bypass
        if (method_exists($user, 'hasRole') && $user->hasRole('Super Admin')) {
            return true;
        }

        return isset($model->tenant_id) && $model->tenant_id === $user->tenant_id;
    }

    public function message()
    {
        return 'The referenced resource does not belong to your tenant.';
    }
}
