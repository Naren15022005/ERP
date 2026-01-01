<?php

namespace App\Policies;

use App\Models\Sale;
use App\Models\User;

class InvoicePolicy extends BasePolicy
{
    public function before(User $user, $ability)
    {
        if (method_exists($user, 'hasRole') && $user->hasRole('Super Admin')) {
            return true;
        }
    }

    public function view(User $user, Sale $invoice)
    {
        return $this->sameTenant($user, $invoice) && $user->can('sales.view');
    }

    public function create(User $user)
    {
        return $user->tenant_id !== null && $user->can('sales.create');
    }

    public function update(User $user, Sale $invoice)
    {
        // Do not allow modifying paid invoices
        if ($invoice->status === 'paid') return false;
        return $this->sameTenant($user, $invoice) && $user->can('sales.update');
    }

    public function delete(User $user, Sale $invoice)
    {
        if ($invoice->status === 'paid') return false;
        return $this->sameTenant($user, $invoice) && $user->can('sales.delete');
    }
}
