<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\TenantPlan;
use Illuminate\Support\Facades\Cache;

class PlanLimitService
{
    /**
     * Check if tenant has reached a specific limit.
     *
     * @param Tenant $tenant
     * @param string $resource (e.g., 'products', 'users', 'sales_per_month')
     * @param int $currentCount Current count of the resource
     * @return bool
     */
    public function hasReachedLimit(Tenant $tenant, string $resource, int $currentCount): bool
    {
        $limit = $this->getLimit($tenant, $resource);

        // No limit means unlimited
        if ($limit === null || $limit < 0) {
            return false;
        }

        return $currentCount >= $limit;
    }

    /**
     * Get the effective limit for a tenant resource.
     *
     * @param Tenant $tenant
     * @param string $resource
     * @return int|null Null means unlimited
     */
    public function getLimit(Tenant $tenant, string $resource): ?int
    {
        $cacheKey = "tenant_limit:{$tenant->id}:{$resource}";

        return Cache::remember($cacheKey, now()->addHours(1), function () use ($tenant, $resource) {
            $activePlan = TenantPlan::where('tenant_id', $tenant->id)
                ->where('is_active', true)
                ->whereNull('expires_at')
                ->orWhere('expires_at', '>', now())
                ->with('plan')
                ->first();

            if (!$activePlan) {
                // Default free plan limits (restrictivo)
                return $this->getDefaultLimit($resource);
            }

            return $activePlan->getEffectiveLimit($resource);
        });
    }

    /**
     * Get default limits for free/no-plan tenants.
     */
    protected function getDefaultLimit(string $resource): ?int
    {
        $defaults = [
            'products' => 50,
            'users' => 2,
            'sales_per_month' => 100,
            'customers' => 100,
            'warehouses' => 1,
        ];

        return $defaults[$resource] ?? null;
    }

    /**
     * Clear cached limits for a tenant.
     */
    public function clearCache(Tenant $tenant): void
    {
        $resources = ['products', 'users', 'sales_per_month', 'customers', 'warehouses'];
        
        foreach ($resources as $resource) {
            Cache::forget("tenant_limit:{$tenant->id}:{$resource}");
        }
    }

    /**
     * Validate if tenant can create a new resource.
     *
     * @throws \Exception if limit exceeded
     */
    public function validateOrFail(Tenant $tenant, string $resource, int $currentCount): void
    {
        if ($this->hasReachedLimit($tenant, $resource, $currentCount)) {
            $limit = $this->getLimit($tenant, $resource);
            throw new \Exception("Plan limit reached for {$resource}. Current limit: {$limit}");
        }
    }
}
