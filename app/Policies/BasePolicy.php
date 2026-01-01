<?php

namespace App\Policies;

use App\Models\User;

class BasePolicy
{
    protected function sameTenant(User $user, $model): bool
    {
        if (method_exists($user, 'hasRole') && $user->hasRole('Super Admin')) {
            return true;
        }

        if (! isset($user->tenant_id) || ! isset($model->tenant_id)) {
            return false;
        }

        return $user->tenant_id === $model->tenant_id;
    }
}
