<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DashboardWidgetController extends Controller
{
    public function __construct(
        private DashboardService $dashboardService
    ) {
        $this->middleware('auth:sanctum');
    }

    /**
     * Get widgets for authenticated tenant
     */
    public function index(Request $request): JsonResponse
    {
        $tenant = $request->user()->tenant;

        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        $widgets = $this->dashboardService->getWidgetsForTenant($tenant);

        return response()->json($widgets);
    }

    /**
     * Get available widgets (including locked ones)
     */
    public function available(Request $request): JsonResponse
    {
        $tenant = $request->user()->tenant;

        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        $widgets = $this->dashboardService->getAvailableWidgets($tenant);

        return response()->json($widgets);
    }

    /**
     * Update tenant widgets
     */
    public function update(Request $request): JsonResponse
    {
        $tenant = $request->user()->tenant;

        if (!$tenant) {
            return response()->json(['message' => 'Tenant not found'], 404);
        }

        $validated = $request->validate([
            'widgets' => 'required|array',
            'widgets.*.widget_id' => 'required|exists:dashboard_widgets,id',
            'widgets.*.position' => 'required|integer|min:1',
            'widgets.*.is_enabled' => 'required|boolean',
        ]);

        try {
            $this->dashboardService->updateTenantWidgets($tenant, $validated['widgets']);
            $widgets = $this->dashboardService->getWidgetsForTenant($tenant);

            return response()->json([
                'message' => 'Widgets updated successfully',
                'widgets' => $widgets,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update widgets',
                'error' => $e->getMessage(),
            ], 422);
        }
    }
}
