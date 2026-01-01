<?php

namespace App\Policies;

use App\Models\Stock;
use App\Models\User;

class StockPolicy extends BasePolicy
{
    public function before(User $user, $ability)
    {
        if (method_exists($user, 'hasRole') && $user->hasRole('Super Admin')) {
            return true;
        }
    }

    public function viewAny(User $user)
    {
        // Allow any authenticated user with tenant_id to list stock from their tenant
        return $user->tenant_id !== null;
    }

    public function view(User $user, Stock $stock)
    {
        return $this->sameTenant($user, $stock);
    }

    public function create(User $user)
    {
        return $user->tenant_id !== null;
    }

    public function update(User $user, Stock $stock)
    {
        return $this->sameTenant($user, $stock);
    }

    public function delete(User $user, Stock $stock)
    {
        return $this->sameTenant($user, $stock);
    }
}
