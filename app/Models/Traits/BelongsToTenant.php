<?php

namespace App\Models\Traits;

trait BelongsToTenant
{
    /**
     * Scope a query to a given tenant id.
     */
    public function scopeForTenant($query, $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    /**
     * Helper relation if model has tenant_id
     */
    public function tenant()
    {
        return $this->belongsTo(\App\Models\Tenant::class);
    }
}
