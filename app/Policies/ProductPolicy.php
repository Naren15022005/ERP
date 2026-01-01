<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy extends BasePolicy
{
    public function before(User $user, $ability)
    {
        if (method_exists($user, 'hasRole') && $user->hasRole('Super Admin')) {
            return true;
        }
    }

    public function viewAny(User $user)
    {
        // Allow any authenticated user with tenant_id to list products from their tenant
        return $user->tenant_id !== null;
    }

    public function view(User $user, Product $product)
    {
        return $this->sameTenant($user, $product) && $user->can('products.view');
    }

    public function create(User $user)
    {
        // In local development allow any authenticated tenant user to create products
        if (app()->environment('local')) {
            return $user->tenant_id !== null;
        }

        return $user->tenant_id && $user->can('products.create');
    }

    public function update(User $user, Product $product)
    {
        return $this->sameTenant($user, $product) && $user->can('products.update');
    }

    public function delete(User $user, Product $product)
    {
        return $this->sameTenant($user, $product) && $user->can('products.delete');
    }
}
