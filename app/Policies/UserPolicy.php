<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy extends BasePolicy
{
    public function before(User $user, $ability)
    {
        if (method_exists($user, 'hasRole') && $user->hasRole('Super Admin')) {
            return true;
        }
    }

    public function viewAny(User $user)
    {
        return $user->tenant_id !== null && $user->can('users.view');
    }

    public function view(User $user, User $model)
    {
        return $this->sameTenant($user, $model) && $user->can('users.view');
    }

    public function create(User $user)
    {
        return $user->tenant_id !== null && $user->can('users.create');
    }

    public function update(User $user, User $model)
    {
        return $this->sameTenant($user, $model) && $user->can('users.update');
    }

    public function delete(User $user, User $model)
    {
        return $this->sameTenant($user, $model) && $user->can('users.delete');
    }
}
