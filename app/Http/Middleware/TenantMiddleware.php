<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TenantMiddleware
{
    /**
     * Ensure requests to private routes have an authenticated user and tenant context.
     */
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated', 'code' => 'UNAUTHENTICATED'], 401);
        }

        // Super-admin may operate across tenants but must be explicit and will be logged
        if (method_exists($user, 'hasRole') && $user->hasRole('Super Admin')) {
            // Optionally allow bypass; log for audit
            Log::info('Super Admin bypassing tenant enforcement', ['user_id' => $user->id]);
            // still register tenant if present
            if ($user->tenant) app()->instance('current_tenant', $user->tenant);
            return $next($request);
        }

        if (! $user->tenant_id) {
            Log::warning('User without tenant attempted to access protected route', ['user_id' => $user->id]);
            return response()->json(['success' => false, 'message' => 'Tenant not assigned to user', 'code' => 'TENANT_MISSING'], 403);
        }

        // Register current tenant globally for scopes and services
        try {
            app()->instance('current_tenant', $user->tenant);
        } catch (\Throwable $e) {
            // ignore
        }

        return $next($request);
    }
}
