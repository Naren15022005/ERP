<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;

class CategoryPolicy extends BasePolicy
{
    public function before(User $user, $ability)
    {
        if (method_exists($user, 'hasRole') && $user->hasRole('Super Admin')) {
            return true;
        }
    }

    public function viewAny(User $user)
    {
        // Allow any authenticated user with tenant_id to list categories from their tenant
        return $user->tenant_id !== null;
    }

    public function view(User $user, Category $category)
    {
        return $this->sameTenant($user, $category);
    }

    public function create(User $user)
    {
        return $user->tenant_id !== null;
    }

    public function update(User $user, Category $category)
    {
        return $this->sameTenant($user, $category);
    }

    public function delete(User $user, Category $category)
    {
        return $this->sameTenant($user, $category);
    }
}
