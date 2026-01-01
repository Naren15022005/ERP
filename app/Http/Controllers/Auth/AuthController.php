<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\TenantModule;
use Illuminate\Support\Arr;
use App\Models\ExternalConnection;
use App\Services\DashboardService;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $data = $request->validated();

        $tenantName = $data['tenant_name'] ?? ($data['email'] ?? 'tenant');
        // collect optional business data into tenant config
        $tenantConfig = [];
        foreach (['business_type','business_description','employees_count','size_category'] as $k) {
            if (array_key_exists($k, $data)) {
                $tenantConfig[$k] = $data[$k];
            }
        }

        $tenant = Tenant::create([
            'name' => $tenantName,
            'slug' => Str::slug($tenantName) ?: 'tenant-'.time(),
            'config' => $tenantConfig,
        ]);

        // Enable default modules for this tenant based on size_category and business_type
        try {
            $size = $tenantConfig['size_category'] ?? null;
            $btype = isset($tenantConfig['business_type']) ? Str::lower($tenantConfig['business_type']) : null;

            // If user provided explicit modules during registration, respect them (sanitize)
            if (!empty($data['modules']) && is_array($data['modules'])) {
                $catalog = config('modules.catalog', []);
                $modules = array_values(array_intersect($catalog, $data['modules']));
            } else {
                $defaultBySize = config('modules.defaults.size_category.' . ($size ?? ''), []);
                $byType = $btype ? (config('modules.defaults.business_type.' . $btype, [])) : [];

                $modules = array_values(array_unique(array_merge($defaultBySize, $byType)));

                // Fallback: if no modules resolved, enable a minimal set
                if (empty($modules)) {
                    $modules = ['dashboard', 'products'];
                }
            }

            // Ensure default mandatory modules are always present regardless of input
            $mandatory = ['dashboard', 'roles', 'users'];
            foreach ($mandatory as $m) {
                if (!in_array($m, $modules)) {
                    array_unshift($modules, $m);
                }
            }
            $modules = array_values(array_unique($modules));

            // If tenant requested products, also enable inventory module by default
            if (in_array('products', $modules) && !in_array('inventory', $modules)) {
                $modules[] = 'inventory';
            }

            $order = 1;
            foreach ($modules as $key) {
                TenantModule::create([
                    'tenant_id' => $tenant->id,
                    'module_key' => $key,
                    'enabled' => true,
                    'display_order' => $order++,
                ]);
            }
        } catch (\Throwable $e) {
            // don't block registration if module seeding fails
        }

        // Generate default dashboard widgets for the tenant
        try {
            app(DashboardService::class)->generateDefaultWidgets($tenant);
        } catch (\Throwable $e) {
            // don't block registration if widget generation fails
            \Log::warning('Failed to generate dashboard widgets for tenant ' . $tenant->id . ': ' . $e->getMessage());
        }

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'tenant_id' => $tenant->id,
        ]);

        try {
            if (method_exists($user, 'assignRole')) {
                $user->assignRole('admin');
            }
        } catch (\Throwable $e) {
            // ignore role assignment errors (roles may not be seeded yet)
        }



        $token = $user->createToken('auth_token')->plainTextToken;

        // Attach tenant widgets and initial charts data to user payload for instant dashboard loading
        try {
            $widgets = app(\App\Services\DashboardService::class)->getWidgetsForTenant($tenant)->toArray();
            $userPayload = $user->toArray();
            $userPayload['tenant'] = $tenant->toArray();
            $userPayload['tenant']['widgets'] = $widgets;
            // Attach the modules list we created so frontend can show menus immediately
            $userPayload['tenant']['config']['modules'] = $modules;

            try {
                $chartsResp = app(\App\Http\Controllers\DashboardChartController::class)->data(request());
                $chartsData = $chartsResp instanceof \Illuminate\Http\JsonResponse ? $chartsResp->getData(true) : (array)$chartsResp;
                // attach charts merged with initial data
                $charts = $chartsData['charts'] ?? [];
                $dataMap = $chartsData['data'] ?? [];
                foreach ($charts as &$c) {
                    $key = $c['key'] ?? null;
                    if ($key && isset($dataMap[$key])) {
                        $c['initial_data'] = $dataMap[$key];
                    }
                }
                $userPayload['tenant']['charts'] = $charts;
            } catch (\Throwable $e) {
                // don't block registration
            }
        } catch (\Throwable $e) {
            $userPayload = $user->toArray();
            $userPayload['tenant'] = $tenant->toArray();
            $userPayload['tenant']['config']['modules'] = $modules ?? [];
        }

        return response()->json([
            'user' => $userPayload,
            'token' => $token,
            'tenant' => $tenant,
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $credentials = $request->only('email', 'password');

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $user = Auth::user();
        $token = $user->createToken('auth_token')->plainTextToken;

        // attach widgets for instant rendering
        $userPayload = $user->toArray();
            if ($user->tenant) {
            try {
                $widgets = app(\App\Services\DashboardService::class)->getWidgetsForTenant($user->tenant)->toArray();
                $userPayload['tenant'] = $user->tenant->toArray();
                $userPayload['tenant']['widgets'] = $widgets;
                    // attach enabled modules for tenant so frontend can render menus
                    try {
                        $enabled = TenantModule::where('tenant_id', $user->tenant->id)->where('enabled', true)->pluck('module_key')->toArray();
                        $userPayload['tenant']['config']['modules'] = $enabled;
                    } catch (\Throwable $e) {
                        $userPayload['tenant']['config']['modules'] = [];
                    }
                try {
                    $chartsResp = app(\App\Http\Controllers\DashboardChartController::class)->data(request());
                    $chartsData = $chartsResp instanceof \Illuminate\Http\JsonResponse ? $chartsResp->getData(true) : (array)$chartsResp;
                    $charts = $chartsData['charts'] ?? [];
                    $dataMap = $chartsData['data'] ?? [];
                    foreach ($charts as &$c) {
                        $key = $c['key'] ?? null;
                        if ($key && isset($dataMap[$key])) {
                            $c['initial_data'] = $dataMap[$key];
                        }
                    }
                    $userPayload['tenant']['charts'] = $charts;
                } catch (\Throwable $e) {
                    // ignore
                }
            } catch (\Throwable $e) {
                $userPayload['tenant'] = $user->tenant->toArray();
                try {
                    $enabled = TenantModule::where('tenant_id', $user->tenant->id)->where('enabled', true)->pluck('module_key')->toArray();
                    $userPayload['tenant']['config']['modules'] = $enabled;
                } catch (\Throwable $e) {
                    $userPayload['tenant']['config']['modules'] = [];
                }
            }
        }

        return response()->json([
            'user' => $userPayload,
            'token' => $token,
            'tenant' => $user->tenant,
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return response()->json(null, 204);
    }

    public function me(Request $request)
    {
        $user = $request->user();

        $userPayload = $user->toArray();
        if ($user->tenant) {
            try {
                $widgets = app(\App\Services\DashboardService::class)->getWidgetsForTenant($user->tenant)->toArray();
                $userPayload['tenant'] = $user->tenant->toArray();
                $userPayload['tenant']['widgets'] = $widgets;
                try {
                    $chartsResp = app(\App\Http\Controllers\DashboardChartController::class)->data($request);
                    $chartsData = $chartsResp instanceof \Illuminate\Http\JsonResponse ? $chartsResp->getData(true) : (array)$chartsResp;
                    $charts = $chartsData['charts'] ?? [];
                    $dataMap = $chartsData['data'] ?? [];
                    foreach ($charts as &$c) {
                        $key = $c['key'] ?? null;
                        if ($key && isset($dataMap[$key])) {
                            $c['initial_data'] = $dataMap[$key];
                        }
                    }
                    $userPayload['tenant']['charts'] = $charts;
                } catch (\Throwable $e) {
                    // ignore
                }
            } catch (\Throwable $e) {
                $userPayload['tenant'] = $user->tenant->toArray();
            }
        }

        return response()->json([
            'user' => $userPayload,
            'tenant' => $user->tenant,
        ]);
    }

    public function refresh(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $current = $user->currentAccessToken();
        if ($current) {
            $current->delete();
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        $userPayload = $user->toArray();
            if ($user->tenant) {
            try {
                $widgets = app(\App\Services\DashboardService::class)->getWidgetsForTenant($user->tenant)->toArray();
                $userPayload['tenant'] = $user->tenant->toArray();
                $userPayload['tenant']['widgets'] = $widgets;
                    try {
                        $enabled = TenantModule::where('tenant_id', $user->tenant->id)->where('enabled', true)->pluck('module_key')->toArray();
                        $userPayload['tenant']['config']['modules'] = $enabled;
                    } catch (\Throwable $e) {
                        $userPayload['tenant']['config']['modules'] = [];
                    }
            } catch (\Throwable $e) {
                $userPayload['tenant'] = $user->tenant->toArray();
            }
        }

        return response()->json([
            'user' => $userPayload,
            'token' => $token,
            'tenant' => $user->tenant,
        ]);
    }
}

