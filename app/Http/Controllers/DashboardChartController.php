<?php

namespace App\Http\Controllers;

use App\Models\TenantModule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardChartController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Return chart configuration based on enabled tenant modules.
     * Rules:
     * - If 'ventas' enabled => include 'ingresos'
     * - If 'purchases' enabled => include 'proveedores' and 'productos'
     * - If both enabled => include all
     */
    public function index(Request $request): JsonResponse
    {
        $tenant = $request->user()?->tenant;
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        $enabled = TenantModule::where('tenant_id', $tenant->id)
            ->where('enabled', true)
            ->pluck('enabled', 'module_key')
            ->keys()
            ->toArray();

        $hasVentas = in_array('ventas', $enabled, true) || in_array('ingresos', $enabled, true);
        $hasCompras = in_array('purchases', $enabled, true) || in_array('suppliers', $enabled, true);

        $charts = [];
        if ($hasVentas) {
            $charts[] = [
                'key' => 'ingresos',
                'title' => 'Ingresos',
                'endpoint' => '/api/reports/sales',
                'priority' => 1,
            ];
        }
        if ($hasCompras) {
            $charts[] = [
                'key' => 'proveedores',
                'title' => 'Proveedores',
                'endpoint' => '/api/suppliers',
                'priority' => 2,
            ];
            $charts[] = [
                'key' => 'productos',
                'title' => 'Productos',
                'endpoint' => '/api/products',
                'priority' => 3,
            ];
        }

        usort($charts, fn($a, $b) => ($a['priority'] ?? 0) <=> ($b['priority'] ?? 0));

        return response()->json([
            'charts' => $charts,
        ]);
    }

    /**
     * Return charts plus aggregated data for enabled charts.
     * This bundles the most important datasets into one response to reduce client requests.
     */
    public function data(Request $request): JsonResponse
    {
        $tenant = $request->user()?->tenant;
        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        // reuse index logic to compute which charts to include
        $chartsResponse = $this->index($request)->getData(true);
        $charts = $chartsResponse['charts'] ?? [];

        $collected = [];

        foreach ($charts as $c) {
            $key = $c['key'] ?? $c['key'];
            try {
                if ($key === 'ingresos') {
                    $res = app(\App\Http\Controllers\Reports\ReportController::class)->salesByPeriod($request);
                    $payload = $res instanceof \Illuminate\Http\JsonResponse ? $res->getData(true) : $res;
                    $collected[$key] = $payload;
                } elseif ($key === 'proveedores') {
                    $res = app(\App\Http\Controllers\Purchase\SupplierController::class)->index($request);
                    $payload = $res instanceof \Illuminate\Http\JsonResponse ? $res->getData(true) : $res;
                    $collected[$key] = $payload;
                } elseif ($key === 'productos') {
                    $res = app(\App\Http\Controllers\Inventory\ProductController::class)->index($request);
                    $payload = $res instanceof \Illuminate\Http\JsonResponse ? $res->getData(true) : $res;
                    $collected[$key] = $payload;
                } else {
                    // unknown key: skip or return empty
                    $collected[$key] = null;
                }
            } catch (\Throwable $e) {
                \Log::warning('DashboardChartController:data fetch failed for ' . $key . ': ' . $e->getMessage());
                $collected[$key] = null;
            }
        }

        return response()->json([
            'charts' => $charts,
            'data' => $collected,
        ]);
    }
}
