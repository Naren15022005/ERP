<?php

namespace App\Models\Concerns;

trait TenantScoped
{
    /**
     * Scope a query to a given tenant id.
     */
    public function scopeForTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}
