<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class TenantScope
{
    public function handle(Request $request, Closure $next)
    {
        $tenant = $request->user()?->tenant;

        if ($tenant) {
            // Register tenant instance in the container for easy access
            try {
                app()->instance('current_tenant', $tenant);
            } catch (\Throwable $e) {
                // ignore
            }

            // Add a conservative global scope keyed by 'tenant'
            Model::addGlobalScope('tenant', function ($query) use ($tenant) {
                // Only apply when model has tenant_id column to avoid errors
                try {
                    $query->where($query->getModel()->getTable() . '.tenant_id', $tenant->id);
                } catch (\Exception $e) {
                    // Ignore models without tenant_id
                }
            });
        } else {
            // If no tenant and an authenticated user exists, log unexpected state
            if ($request->user()) {
                Log::warning('Authenticated user without tenant in TenantScope middleware', ['user_id' => $request->user()->id]);
            }
        }

        return $next($request);
    }
}
