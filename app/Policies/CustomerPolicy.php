<?php

namespace App\Policies;

use App\Models\Customer;
use App\Models\User;

class CustomerPolicy extends BasePolicy
{
    public function before(User $user, $ability)
    {
        if (method_exists($user, 'hasRole') && $user->hasRole('Super Admin')) {
            return true;
        }
    }

    public function viewAny(User $user)
    {
        return $user->tenant_id && $user->can('customers.view');
    }

    public function view(User $user, Customer $customer)
    {
        return $this->sameTenant($user, $customer) && $user->can('customers.view');
    }

    public function create(User $user)
    {
        return $user->tenant_id && $user->can('customers.create');
    }

    public function update(User $user, Customer $customer)
    {
        return $this->sameTenant($user, $customer) && $user->can('customers.update');
    }

    public function delete(User $user, Customer $customer)
    {
        return $this->sameTenant($user, $customer) && $user->can('customers.delete');
    }
}
