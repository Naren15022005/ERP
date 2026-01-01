<?php

use Illuminate\Support\Facades\Route;

// Debug helper route (local only) to inspect kardex without auth when developing
if (app()->environment('local')) {
    Route::get('debug/kardex', function (\Illuminate\Http\Request $request) {
        // Login as first user for quick debug (local only)
        $user = \App\Models\User::first();
        if ($user) auth()->loginUsingId($user->id);

        try {
            // Let the container build the controller and its dependencies (use Class@method form)
            return app()->call('App\\Http\\Controllers\\Inventory\\StockController@kardex', ['request' => $request]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    });

    // Local helper to inspect incoming request headers (POST)
    Route::post('debug/inspect', function (\Illuminate\Http\Request $request) {
        $headers = $request->headers->all();
        \Log::info('DEBUG_REQUEST_HEADERS', $headers);
        return response()->json(['headers' => $headers]);
    });

    // Local helper to return a fresh personal access token for the first user.
    // This is intended for local development only so the frontend devserver
    // can be quickly authorized. Do NOT enable in non-local environments.
    Route::get('debug/token', function () {
        $user = \App\Models\User::first();
        if (! $user) {
            return response()->json(['error' => 'no user found'], 404);
        }
        $token = $user->createToken('debug_token')->plainTextToken;
        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
            ],
        ]);
    });

    // Local debug: return stock list without normal auth flow (logs in first user)
    Route::get('debug/stock', function (\Illuminate\Http\Request $request) {
        $user = \App\Models\User::first();
        if ($user) auth()->loginUsingId($user->id);
        try {
            $tenantId = $user?->tenant_id;
            if ($tenantId) {
                return \App\Models\Stock::forTenant($tenantId)->with(['product','warehouse'])->paginate(25);
            }
            return \App\Models\Stock::with(['product','warehouse'])->paginate(25);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    });

    // Local debug helper to create a product directly (bypasses policy/validation).
    Route::post('debug/create-product', function (\Illuminate\Http\Request $request) {
        // If tenant_id is provided, try to find a user for that tenant to impersonate
        $tenantRequested = $request->input('tenant_id');
        if ($tenantRequested) {
            $user = \App\Models\User::where('tenant_id', $tenantRequested)->first();
        } else {
            $user = \App\Models\User::first();
        }

        if (! $user) return response()->json(['error' => 'no user for requested tenant'], 404);
        // Impersonate chosen user for tenant context
        auth()->loginUsingId($user->id);
        $tenantId = $user->tenant_id;
        $payload = $request->only(['name','price','category_id','description','image_url']);
        $p = new \App\Models\Product();
        $p->tenant_id = $tenantId;
        $p->name = $payload['name'] ?? 'debug product';
        $p->price = $payload['price'] ?? 0;
        $p->category_id = $payload['category_id'] ?? null;
        $p->description = $payload['description'] ?? null;
        $p->image_url = $payload['image_url'] ?? null;
        $p->sku = \App\Models\Product::generateSku($tenantId);
        $p->save();
        return response()->json($p, 201);
    });
}

Route::middleware([\App\Http\Middleware\TenantScope::class])->group(function () {
    Route::prefix('auth')->group(function () {
        // Apply basic rate limiting to protect against brute-force
        Route::post('register', [\App\Http\Controllers\Auth\AuthController::class, 'register'])
            ->middleware('throttle:5,1');
        Route::post('login', [\App\Http\Controllers\Auth\AuthController::class, 'login'])
            ->middleware('throttle:10,1');
        Route::get('me', [\App\Http\Controllers\Auth\AuthController::class, 'me'])->middleware('auth:sanctum');
        Route::post('logout', [\App\Http\Controllers\Auth\AuthController::class, 'logout'])->middleware('auth:sanctum');
        Route::post('refresh', [\App\Http\Controllers\Auth\AuthController::class, 'refresh'])->middleware('auth:sanctum');
    });

    // Users management (protected)
    Route::middleware(['auth:sanctum', \App\Http\Middleware\TenantMiddleware::class])->group(function () {
        Route::apiResource('users', \App\Http\Controllers\UserController::class);
            Route::apiResource('customers', \App\Http\Controllers\CustomerController::class);
        // Invoices endpoints
        Route::get('invoices', [\App\Http\Controllers\InvoiceController::class, 'index']);
        Route::get('invoices/{invoice}', [\App\Http\Controllers\InvoiceController::class, 'show']);
        Route::get('invoices/{invoice}/pdf', [\App\Http\Controllers\InvoiceController::class, 'pdf']);
        Route::post('invoices/{invoice}/email', [\App\Http\Controllers\InvoiceController::class, 'email']);
        // POS: crear venta (protegido)
        Route::post('sales', [\App\Http\Controllers\Sales\SaleController::class, 'store']);
        Route::post('users/{user}/roles', [\App\Http\Controllers\UserController::class, 'assignRoles'])
            ->middleware('permission:manage users');

        // Roles listing and assignment
        Route::get('roles', [\App\Http\Controllers\RoleController::class, 'index'])
            ->middleware('permission:manage users');
        Route::post('roles/{user}', [\App\Http\Controllers\RoleController::class, 'assign'])
            ->middleware('permission:manage users');

        // Audit logs (only for authorized users)
        Route::get('audit-logs', [\App\Http\Controllers\AuditLogController::class, 'index'])
            ->middleware(['permission:view audit logs']);
    });

    // Purchases / Suppliers
    Route::apiResource('suppliers', \App\Http\Controllers\Purchase\SupplierController::class)->only(['index','store']);
    Route::apiResource('purchase-orders', \App\Http\Controllers\Purchase\PurchaseController::class)->only(['index','store']);

    // Accounting
    Route::get('accounting/journal', [\App\Http\Controllers\Accounting\JournalController::class, 'index']);

    // Reports
    Route::get('reports/sales', [\App\Http\Controllers\Reports\ReportController::class, 'salesByPeriod']);
    Route::get('reports/top-products', [\App\Http\Controllers\Reports\ReportController::class, 'topProducts']);
    Route::get('reports/sales-by-vendor', [\App\Http\Controllers\Reports\ReportController::class, 'salesByVendor']);

    // Settings per tenant
    Route::middleware(['auth:sanctum', \App\Http\Middleware\TenantMiddleware::class])->group(function () {
        Route::get('settings', [\App\Http\Controllers\SettingController::class, 'show']);
        Route::put('settings', [\App\Http\Controllers\SettingController::class, 'update']);
        Route::post('settings/logo', [\App\Http\Controllers\SettingController::class, 'uploadLogo']);
        
        // Tenant modules management
        Route::get('tenant/modules', [\App\Http\Controllers\TenantModuleController::class, 'index']);
        Route::post('tenant/modules', [\App\Http\Controllers\TenantModuleController::class, 'update']);
    });

    // Dashboard widgets management
    Route::middleware(['auth:sanctum', \App\Http\Middleware\TenantMiddleware::class])->prefix('dashboard')->group(function () {
        Route::get('widgets', [\App\Http\Controllers\DashboardWidgetController::class, 'index']);
        Route::get('widgets/available', [\App\Http\Controllers\DashboardWidgetController::class, 'available']);
        Route::post('widgets', [\App\Http\Controllers\DashboardWidgetController::class, 'update']);
        // Charts config derived from tenant modules
        Route::get('charts', [\App\Http\Controllers\DashboardChartController::class, 'index']);
        Route::get('charts/data', [\App\Http\Controllers\DashboardChartController::class, 'data']);
    });

    // Alerts: tenant-scoped alerts management
    Route::middleware(['auth:sanctum', \App\Http\Middleware\TenantMiddleware::class])->group(function () {
        Route::get('alerts', [\App\Http\Controllers\AlertsController::class, 'index']);
        Route::get('alerts/count', [\App\Http\Controllers\AlertsController::class, 'count']);
        Route::post('alerts/{alert}/read', [\App\Http\Controllers\AlertsController::class, 'markRead']);
    });


    // Inventory API (protected) - use API controllers for product master operations
    Route::middleware(['auth:sanctum', \App\Http\Middleware\TenantMiddleware::class])->group(function () {
        // Use Api\ProductController so frontend can create/update master products
        Route::apiResource('products', \App\Http\Controllers\Api\ProductController::class);
        Route::apiResource('categories', \App\Http\Controllers\Inventory\CategoryController::class);
    });

    // Uploads (images/files) - tenant scoped
    Route::middleware(['auth:sanctum', \App\Http\Middleware\TenantMiddleware::class])->group(function () {
        Route::post('uploads/images', [\App\Http\Controllers\Api\UploadController::class, 'image']);
    });

    // Stock control endpoints
    Route::middleware(['auth:sanctum', \App\Http\Middleware\TenantMiddleware::class])->group(function () {
        Route::get('stock', [\App\Http\Controllers\Inventory\StockController::class, 'index']);
        Route::get('stock/low', [\App\Http\Controllers\Inventory\StockController::class, 'low']);
        Route::get('stock/status', [\App\Http\Controllers\Inventory\StockController::class, 'status']); // Nuevo: estado calculado
        Route::post('stock/adjust', [\App\Http\Controllers\Inventory\StockController::class, 'adjust']);
        Route::post('stock/transfer', [\App\Http\Controllers\Inventory\StockController::class, 'transfer']);
        Route::post('stock/movement', [\App\Http\Controllers\Inventory\StockController::class, 'recordMovement']); // Nuevo: registrar movimiento
        Route::get('kardex', [\App\Http\Controllers\Inventory\StockController::class, 'kardex']);
    });

    // Caja routes (daily cash / POS related)
    Route::prefix('caja')->middleware(['auth:sanctum', \App\Http\Middleware\TenantMiddleware::class])->group(function () {
        // Cierre diario: listar, ver, crear cierre a partir de ventas del día
        Route::get('cierre-diario', [\App\Http\Controllers\Caja\CierreDiarioController::class, 'index']);
        Route::get('cierre-diario/{dailyClose}', [\App\Http\Controllers\Caja\CierreDiarioController::class, 'show']);
        Route::post('cierre-diario', [\App\Http\Controllers\Caja\CierreDiarioController::class, 'store']);
    });

    // Integrations - External Connections Management
    Route::middleware(['auth:sanctum', \App\Http\Middleware\TenantMiddleware::class])->prefix('integrations')->group(function () {
        // Listar plataformas soportadas
        Route::get('platforms', [\App\Http\Controllers\Integrations\ExternalConnectionController::class, 'platforms']);
        
        // CRUD de conexiones
        Route::apiResource('connections', \App\Http\Controllers\Integrations\ExternalConnectionController::class);
        
        // Acciones especiales de conexiones
        Route::post('connections/{connection}/test', [\App\Http\Controllers\Integrations\ExternalConnectionController::class, 'test']);
        Route::post('connections/{connection}/sync', [\App\Http\Controllers\Integrations\ExternalConnectionController::class, 'syncNow']);
        Route::get('connections/{connection}/logs', [\App\Http\Controllers\Integrations\ExternalConnectionController::class, 'syncLogs']);
    });

    // Webhook receiver (sin autenticación - verifica firma internamente)
    Route::post('integrations/webhooks/{connection}/receive', [\App\Http\Controllers\Integrations\WebhookController::class, 'receive']);
    
    // Dev inventory CRUD (debugging endpoints)
    Route::prefix('dev/inventory')->middleware(['auth:sanctum', \App\Http\Middleware\TenantMiddleware::class])->group(function () {
        Route::apiResource('categories', \App\Http\Controllers\Api\CategoryController::class);
        Route::apiResource('warehouses', \App\Http\Controllers\Api\WarehouseController::class);
        Route::get('stock', [\App\Http\Controllers\Api\StockController::class, 'index']);
        Route::get('stock/{stock}', [\App\Http\Controllers\Api\StockController::class, 'show']);
        Route::patch('stock/{stock}', [\App\Http\Controllers\Api\StockController::class, 'update']);
        Route::get('stock-movements', [\App\Http\Controllers\Api\StockMovementController::class, 'index']);
        Route::post('stock-movements', [\App\Http\Controllers\Api\StockMovementController::class, 'store']);
    });
});
