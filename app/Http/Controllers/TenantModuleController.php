<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\TenantModule;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TenantModuleController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }
    public function index(Request $request)
    {
        $tenant = $request->user()?->tenant;
        if (!$tenant) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $enabled = TenantModule::where('tenant_id', $tenant->id)
            ->orderBy('display_order')
            ->get()
            ->keyBy('module_key');

        // Determine mandatory modules based on tenant config
        \Log::info('TenantModuleController: checking config', [
            'tenant_id' => $tenant->id,
            'config' => $tenant->config,
            'config_type' => gettype($tenant->config),
            'employees_count' => $tenant->config['employees_count'] ?? 'not set'
        ]);
        
        $isSingleUser = isset($tenant->config['employees_count']) && $tenant->config['employees_count'] === 1;
        $mandatory = $isSingleUser ? ['dashboard'] : ['dashboard', 'roles', 'users'];
        
        \Log::info('TenantModuleController: mandatory modules', [
            'isSingleUser' => $isSingleUser,
            'mandatory' => $mandatory
        ]);

        $catalog = config('modules.catalog', []);
        $manifests = config('modules.manifests', []);

        $result = [];
        foreach ($catalog as $key) {
            // For single-user tenants, skip roles and users modules entirely
            if ($isSingleUser && in_array($key, ['roles', 'users'])) {
                continue;
            }
            
            $m = $enabled->get($key);
            // Mandatory modules are always enabled
            $isEnabled = in_array($key, $mandatory) ? true : ($m ? (bool) $m->enabled : false);
            $order = $m?->display_order ?? null;

            $manifest = $manifests[$key] ?? ['title' => $this->humanTitle($key), 'route' => '/' . $key];

            $result[] = array_merge($manifest, [
                'key' => $key,
                'enabled' => $isEnabled,
                'order' => $order,
            ]);
        }

        // Only return enabled modules to the public UI consumer (but keep order)
        $filtered = array_values(array_filter($result, fn($r) => $r['enabled']));

        usort($filtered, function ($a, $b) {
            return ($a['order'] ?? 0) <=> ($b['order'] ?? 0);
        });

        return response()->json($filtered);
    }

    public function update(Request $request)
    {
        $tenant = $request->user()?->tenant;
        if (!$tenant) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $data = $request->validate([
            'modules' => ['required', 'array'],
            'modules.*.module_key' => ['required', 'string'],
            'modules.*.enabled' => ['required', 'boolean'],
            'modules.*.display_order' => ['nullable', 'integer'],
        ]);

        // Determine mandatory modules based on tenant config
        $isSingleUser = isset($tenant->config['employees_count']) && $tenant->config['employees_count'] === 1;
        $mandatory = $isSingleUser ? ['dashboard'] : ['dashboard', 'roles', 'users'];
        foreach ($data['modules'] as $item) {
            $key = $item['module_key'];
            $enabled = in_array($key, $mandatory) ? true : (bool) $item['enabled'];
            TenantModule::updateOrCreate(
                ['tenant_id' => $tenant->id, 'module_key' => $key],
                ['enabled' => $enabled, 'display_order' => $item['display_order'] ?? null]
            );
        }

        // Return updated enabled modules
        return $this->index($request);
    }

    private function humanTitle(string $key): string
    {
        $map = [
            'dashboard' => 'Dashboard',
            'ventas' => 'Ventas',
            'caja' => 'Caja Diaria',
            'ingresos' => 'Ingresos',
            'egresos' => 'Egresos',
            'products' => 'Productos',
            'inventory' => 'Inventario',
            'roles' => 'Roles',
            'users' => 'Usuarios',
            'purchases' => 'Compras',
            'suppliers' => 'Proveedores',
            'accounting' => 'Contabilidad',
        ];

        return $map[$key] ?? Str::title(str_replace(['_', '-'], ' ', $key));
    }
}
