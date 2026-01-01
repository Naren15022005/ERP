<?php

namespace App\Services;

use App\Models\DashboardWidget;
use App\Models\Tenant;
use App\Models\TenantDashboardWidget;
use App\Models\TenantModule;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class DashboardService
{
    /**
     * Generate default widgets for a tenant based on active modules
     */
    public function generateDefaultWidgets(Tenant $tenant): void
    {
        // Get active modules for tenant
        $activeModules = TenantModule::where('tenant_id', $tenant->id)
            ->where('enabled', true)
            ->pluck('module_key')
            ->toArray();

        if (empty($activeModules)) {
            // If no modules, use a minimal default set so widgets can be generated in dev
            $activeModules = ['dashboard', 'products'];
        }

        // Get tenant plan (default to free)
        $plan = $tenant->config['plan'] ?? 'free';
        $maxWidgets = config('dashboard.plan_limits.' . $plan, 3);

        // Collect widgets from active modules
        $widgetsToAdd = collect();
        foreach ($activeModules as $module) {
            $moduleWidgets = config('dashboard.modules.' . $module . '.widgets', []);
            foreach ($moduleWidgets as $widgetKey) {
                $widgetConfig = config('dashboard.widgets.' . $widgetKey);
                if ($widgetConfig && $this->isWidgetAllowedForPlan($widgetConfig['min_plan'], $plan)) {
                    $widgetsToAdd->push($widgetKey);
                }
            }
        }

        // Limit by plan
        $widgetsToAdd = $widgetsToAdd->take($maxWidgets);

        // Create widget records if they don't exist
        $this->ensureWidgetsExist($widgetsToAdd);

        // Assign widgets to tenant
        $position = 1;
        foreach ($widgetsToAdd as $widgetKey) {
            $widget = DashboardWidget::where('key', $widgetKey)->first();
            if ($widget) {
                TenantDashboardWidget::updateOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'widget_id' => $widget->id,
                    ],
                    [
                        'position' => $position++,
                        'is_enabled' => true,
                    ]
                );
            }
        }
    }

    /**
     * Get widgets for a specific tenant
     */
    public function getWidgetsForTenant(Tenant $tenant): Collection
    {
        $tenantWidgets = TenantDashboardWidget::forTenant($tenant->id)
            ->enabled()
            ->ordered()
            ->with('widget')
            ->get();

        $widgetKeys = $tenantWidgets->map(fn($tw) => $tw->widget->key)->unique()->values()->all();
        $batchData = $this->loadWidgetsDataBatch($tenant, $widgetKeys);

        return $tenantWidgets->map(function ($tenantWidget) use ($batchData) {
            $widgetKey = $tenantWidget->widget->key;
            $initialData = $batchData[$widgetKey] ?? null;

            return [
                'id' => $tenantWidget->widget->id,
                'key' => $widgetKey,
                'name' => $tenantWidget->widget->name,
                'module' => $tenantWidget->widget->module,
                'description' => $tenantWidget->widget->description,
                'component' => $tenantWidget->widget->component,
                'position' => $tenantWidget->position,
                'metadata' => $tenantWidget->widget->metadata,
                'initial_data' => $initialData,
            ];
        });
    }

    /**
     * Load initial_data for multiple widgets in a small number of queries.
     * Returns an associative array keyed by widget key.
     */
    private function loadWidgetsDataBatch(Tenant $tenant, array $widgetKeys): array
    {
        $tenantId = $tenant->id;
        $results = [];

        $ttl = config('dashboard.cache_ttl', 30);
        $cacheKey = "tenant:{$tenantId}:widget_initial:batch:" . md5(implode(',', $widgetKeys));

        return Cache::store('file')->remember($cacheKey, $ttl, function () use ($tenantId, $widgetKeys) {
            $out = [];

            // Sales aggregates (today, week, month) in one query
            $needSales = collect($widgetKeys)->intersect(['sales_today','sales_week','sales_month'])->isNotEmpty();
            if ($needSales) {
                $row = \DB::table('sales')
                    ->selectRaw("\n                        COALESCE(SUM(total) FILTER (WHERE sale_date::date = current_date AND status IN ('confirmed','paid')),0) as sales_today_total,\n                        COALESCE(COUNT(*) FILTER (WHERE sale_date::date = current_date AND status IN ('confirmed','paid')),0) as sales_today_count,\n                        COALESCE(SUM(total) FILTER (WHERE sale_date >= current_date - interval '7 days' AND status IN ('confirmed','paid')),0) as sales_week_total,\n                        COALESCE(COUNT(*) FILTER (WHERE sale_date >= current_date - interval '7 days' AND status IN ('confirmed','paid')),0) as sales_week_count,\n                        COALESCE(SUM(total) FILTER (WHERE date_trunc('month', sale_date) = date_trunc('month', current_date) AND status IN ('confirmed','paid')),0) as sales_month_total,\n                        COALESCE(COUNT(*) FILTER (WHERE date_trunc('month', sale_date) = date_trunc('month', current_date) AND status IN ('confirmed','paid')),0) as sales_month_count\n                    ")
                    ->where('tenant_id', $tenantId)
                    ->first();

                $out['sales_today'] = ['total' => (float) ($row->sales_today_total ?? 0), 'transactions' => (int) ($row->sales_today_count ?? 0)];
                $out['sales_week'] = ['total' => (float) ($row->sales_week_total ?? 0), 'transactions' => (int) ($row->sales_week_count ?? 0)];
                $out['sales_month'] = ['total' => (float) ($row->sales_month_total ?? 0), 'transactions' => (int) ($row->sales_month_count ?? 0)];
            }

            // Products totals
            if (in_array('products_total', $widgetKeys, true)) {
                $count = \DB::table('products')->where('tenant_id', $tenantId)->count();
                $out['products_total'] = ['total' => (int) $count, 'active' => (int) $count];
            }

            if (in_array('products_low_stock', $widgetKeys, true)) {
                $row = \DB::table('products as p')
                    ->selectRaw('COUNT(*) as low_stock_count')
                    ->where('p.tenant_id', $tenantId)
                    ->whereRaw("COALESCE((SELECT SUM(quantity) FROM stock WHERE tenant_id = ? AND product_id = p.id),0) <= p.stock_min", [$tenantId])
                    ->first();

                $out['products_low_stock'] = ['count' => (int) ($row->low_stock_count ?? 0)];
            }

            // Inventory value
            if (in_array('inventory_value', $widgetKeys, true)) {
                $row = \DB::table('stock as s')
                    ->join('products as p', 'p.id', '=', 's.product_id')
                    ->where('s.tenant_id', $tenantId)
                    ->selectRaw('COALESCE(SUM(s.quantity * p.cost),0) as total_value, COALESCE(SUM(s.quantity),0) as units')
                    ->first();

                $out['inventory_value'] = ['total' => (float) ($row->total_value ?? 0), 'units' => (float) ($row->units ?? 0)];
            }

            return $out;
        });
    }

    /**
     * Load light-weight data for a widget to allow instant rendering.
     * Returns null if no precomputed data is available for the widget.
     */
    private function loadWidgetData(Tenant $tenant, string $widgetKey): ?array
    {
        $tenantId = $tenant->id;

        $ttl = config('dashboard.cache_ttl', 30);
        $cacheKey = "tenant:{$tenantId}:widget_initial:{$widgetKey}";

        return Cache::store('file')->remember($cacheKey, $ttl, function () use ($tenantId, $widgetKey) {
            switch ($widgetKey) {
            case 'sales_today':
                $row = \DB::table('sales')
                    ->selectRaw('COALESCE(SUM(total),0) as total, COUNT(*) as transactions')
                    ->where('tenant_id', $tenantId)
                    ->whereRaw("sale_date::date = current_date")
                    ->whereIn('status', ['confirmed','paid'])
                    ->first();

                return [
                    'total' => (float) ($row->total ?? 0),
                    'transactions' => (int) ($row->transactions ?? 0),
                ];

            case 'sales_week':
                $row = \DB::table('sales')
                    ->selectRaw('COALESCE(SUM(total),0) as total, COUNT(*) as transactions')
                    ->where('tenant_id', $tenantId)
                    ->whereRaw("sale_date >= current_date - interval '7 days'")
                    ->whereIn('status', ['confirmed','paid'])
                    ->first();

                return [
                    'total' => (float) ($row->total ?? 0),
                    'transactions' => (int) ($row->transactions ?? 0),
                ];

            case 'sales_month':
                $row = \DB::table('sales')
                    ->selectRaw('COALESCE(SUM(total),0) as total, COUNT(*) as transactions')
                    ->where('tenant_id', $tenantId)
                    ->whereRaw("date_trunc('month', sale_date) = date_trunc('month', current_date)")
                    ->whereIn('status', ['confirmed','paid'])
                    ->first();

                return [
                    'total' => (float) ($row->total ?? 0),
                    'transactions' => (int) ($row->transactions ?? 0),
                ];

            case 'products_total':
                $count = \DB::table('products')
                    ->where('tenant_id', $tenantId)
                    ->count();

                return ['total' => (int) $count, 'active' => (int) $count];

            case 'products_low_stock':
                $row = \DB::table('products as p')
                    ->selectRaw('COUNT(*) as low_stock_count')
                    ->where('p.tenant_id', $tenantId)
                    ->whereRaw("COALESCE((SELECT SUM(quantity) FROM stock WHERE tenant_id = ? AND product_id = p.id),0) <= p.stock_min", [$tenantId])
                    ->first();

                return ['count' => (int) ($row->low_stock_count ?? 0)];

            case 'inventory_value':
                $row = \DB::table('stock as s')
                    ->join('products as p', 'p.id', '=', 's.product_id')
                    ->where('s.tenant_id', $tenantId)
                    ->selectRaw('COALESCE(SUM(s.quantity * p.cost),0) as total_value, COALESCE(SUM(s.quantity),0) as units')
                    ->first();

                return ['total' => (float) ($row->total_value ?? 0), 'units' => (float) ($row->units ?? 0)];

            default:
                return null;
            }
        });
    }

    /**
     * Get available widgets for a tenant (including locked ones)
     */
    public function getAvailableWidgets(Tenant $tenant): Collection
    {
        // Get active modules
        $activeModules = TenantModule::where('tenant_id', $tenant->id)
            ->where('enabled', true)
            ->pluck('module_key')
            ->toArray();

        if (empty($activeModules)) {
            return collect();
        }

        $plan = $tenant->config['plan'] ?? 'free';

        // Get all widgets for active modules
        $allWidgets = DashboardWidget::active()
            ->whereIn('module', $activeModules)
            ->get();

        // Get current tenant widgets
        $enabledWidgetIds = TenantDashboardWidget::forTenant($tenant->id)
            ->pluck('widget_id')
            ->toArray();

        return $allWidgets->map(function ($widget) use ($plan, $enabledWidgetIds) {
            $isAllowed = $this->isWidgetAllowedForPlan($widget->min_plan, $plan);
            return [
                'id' => $widget->id,
                'key' => $widget->key,
                'name' => $widget->name,
                'module' => $widget->module,
                'description' => $widget->description,
                'component' => $widget->component,
                'min_plan' => $widget->min_plan,
                'is_enabled' => in_array($widget->id, $enabledWidgetIds),
                'is_locked' => !$isAllowed,
            ];
        });
    }

    /**
     * Update tenant widgets
     */
    public function updateTenantWidgets(Tenant $tenant, array $widgets): bool
    {
        $plan = $tenant->config['plan'] ?? 'free';
        $maxWidgets = config('dashboard.plan_limits.' . $plan, 3);

        // Count enabled widgets
        $enabledCount = collect($widgets)->where('is_enabled', true)->count();
        if ($enabledCount > $maxWidgets) {
            throw new \Exception("Plan {$plan} only allows {$maxWidgets} widgets.");
        }

        // Validate widgets belong to active modules
        $activeModules = TenantModule::where('tenant_id', $tenant->id)
            ->where('enabled', true)
            ->pluck('module_key')
            ->toArray();

        foreach ($widgets as $widgetData) {
            $widget = DashboardWidget::find($widgetData['widget_id']);
            if (!$widget || !in_array($widget->module, $activeModules)) {
                throw new \Exception("Widget not available for this tenant.");
            }

            if ($widgetData['is_enabled'] && !$this->isWidgetAllowedForPlan($widget->min_plan, $plan)) {
                throw new \Exception("Widget '{$widget->name}' requires plan '{$widget->min_plan}' or higher.");
            }

            TenantDashboardWidget::updateOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'widget_id' => $widgetData['widget_id'],
                ],
                [
                    'position' => $widgetData['position'] ?? 0,
                    'is_enabled' => $widgetData['is_enabled'] ?? true,
                ]
            );
        }

        return true;
    }

    /**
     * Check if widget is allowed for given plan
     */
    private function isWidgetAllowedForPlan(string $widgetMinPlan, string $userPlan): bool
    {
        $planHierarchy = ['free' => 1, 'basic' => 2, 'pro' => 3];
        $widgetLevel = $planHierarchy[$widgetMinPlan] ?? 1;
        $userLevel = $planHierarchy[$userPlan] ?? 1;

        return $userLevel >= $widgetLevel;
    }

    /**
     * Ensure widgets exist in database
     */
    private function ensureWidgetsExist(Collection $widgetKeys): void
    {
        foreach ($widgetKeys as $key) {
            $config = config('dashboard.widgets.' . $key);
            if ($config) {
                DashboardWidget::firstOrCreate(
                    ['key' => $key],
                    [
                        'name' => $config['name'],
                        'module' => $config['module'],
                        'description' => $config['description'] ?? '',
                        'component' => $config['component'],
                        'min_plan' => $config['min_plan'] ?? 'free',
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}
