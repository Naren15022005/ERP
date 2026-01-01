<?php

namespace App\Policies;

use App\Models\Sale;
use App\Models\User;
use App\Enums\SaleStatus;

class SalePolicy extends BasePolicy
{
    public function before(User $user, $ability)
    {
        if (method_exists($user, 'hasRole') && $user->hasRole('Super Admin')) {
            return true;
        }
    }

    public function viewAny(User $user)
    {
        return $user->tenant_id && $user->can('invoices.view');
    }

    public function view(User $user, Sale $sale)
    {
        return $this->sameTenant($user, $sale) && $user->can('sales.view');
    }

    public function create(User $user)
    {
        return $user->tenant_id && $user->can('sales.create');
    }

    public function update(User $user, Sale $sale)
    {
        // Prevent updates to finalized sales (business rule)
        if (!$sale->isEditable()) {
            return false;
        }

        return $this->sameTenant($user, $sale) && $user->can('sales.update');
    }

    public function delete(User $user, Sale $sale)
    {
        // For safety, disallow deleting paid sales
        if ($sale->status === SaleStatus::PAID) {
            return false;
        }
        return $this->sameTenant($user, $sale) && $user->can('sales.delete');
    }

    /**
     * Check if user can change sale status.
     */
    public function changeStatus(User $user, Sale $sale, SaleStatus $newStatus)
    {
        if (!$this->sameTenant($user, $sale)) {
            return false;
        }

        if (!$user->can('sales.update')) {
            return false;
        }

        // Validate state transition
        return $sale->canTransitionTo($newStatus);
    }
}
