<?php

namespace App\Http\Controllers\Integrations;

use App\Http\Controllers\Controller;
use App\Models\ExternalConnection;
use App\Jobs\Integrations\SyncProductsJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ExternalConnectionController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->authorizeResource(\App\Models\ExternalConnection::class, 'external_connection');
    }
    public function index(Request $request)
    {
        $connections = ExternalConnection::where('tenant_id', $request->user()->tenant_id)
            ->with(['syncLogs' => function ($q) {
                $q->orderBy('created_at', 'desc')->limit(5);
            }])
            ->paginate(20);

        return response()->json($connections);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'platform_type' => 'required|in:woocommerce,shopify,magento,custom_api',
            'connection_name' => 'required|string|max:255',
            'api_url' => 'required|url',
            'credentials' => 'required|array',
            'config' => 'nullable|array',
            'sync_direction' => 'nullable|in:pull,push,bidirectional',
            'sync_interval_minutes' => 'nullable|integer|min:5',
            'sync_entities' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $connection = ExternalConnection::create([
            'tenant_id' => $request->user()->tenant_id,
            'platform_type' => $request->platform_type,
            'connection_name' => $request->connection_name,
            'api_url' => $request->api_url,
            'credentials' => $request->credentials,
            'config' => $request->config,
            'sync_direction' => $request->sync_direction ?? 'bidirectional',
            'sync_interval_minutes' => $request->sync_interval_minutes ?? 30,
            'sync_entities' => $request->sync_entities ?? ['products'],
            'is_active' => false, // Inactiva hasta test exitoso
        ]);

        return response()->json($connection, 201);
    }

    public function show(Request $request, ExternalConnection $connection)
    {
        if ($connection->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $connection->load(['syncLogs' => function ($q) {
            $q->orderBy('created_at', 'desc')->limit(10);
        }]);

        return response()->json($connection);
    }

    public function update(Request $request, ExternalConnection $connection)
    {
        if ($connection->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'connection_name' => 'nullable|string|max:255',
            'api_url' => 'nullable|url',
            'credentials' => 'nullable|array',
            'config' => 'nullable|array',
            'is_active' => 'nullable|boolean',
            'sync_direction' => 'nullable|in:pull,push,bidirectional',
            'sync_interval_minutes' => 'nullable|integer|min:5',
            'sync_entities' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $connection->update($request->only([
            'connection_name',
            'api_url',
            'credentials',
            'config',
            'is_active',
            'sync_direction',
            'sync_interval_minutes',
            'sync_entities',
        ]));

        return response()->json($connection);
    }

    public function destroy(Request $request, ExternalConnection $connection)
    {
        if ($connection->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $connection->delete();

        return response()->json(null, 204);
    }

    public function test(Request $request, ExternalConnection $connection)
    {
        if ($connection->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            $success = $connection->testConnection();

            return response()->json([
                'success' => $success,
                'message' => $success 
                    ? 'Conexión exitosa' 
                    : 'No se pudo conectar con el sistema externo',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al probar conexión',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function syncNow(Request $request, ExternalConnection $connection)
    {
        if ($connection->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $entity = $request->input('entity', 'products');
        $direction = $request->input('direction', 'bidirectional');

        try {
            $jobClass = match ($entity) {
                'products' => SyncProductsJob::class,
                'orders' => \App\Jobs\Integrations\SyncOrdersJob::class,
                'inventory' => \App\Jobs\Integrations\SyncInventoryJob::class,
                'customers' => \App\Jobs\Integrations\SyncCustomersJob::class,
                default => null,
            };

            if (!$jobClass) {
                return response()->json(['message' => 'Entidad no válida'], 400);
            }

            if (in_array($direction, ['inbound', 'bidirectional'])) {
                dispatch(new $jobClass($connection, 'inbound'));
            }

            if (in_array($direction, ['outbound', 'bidirectional'])) {
                dispatch(new $jobClass($connection, 'outbound'));
            }

            return response()->json([
                'message' => 'Sincronización iniciada',
                'entity' => $entity,
                'direction' => $direction,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al iniciar sincronización',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function syncLogs(Request $request, ExternalConnection $connection)
    {
        if ($connection->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $logs = $connection->syncLogs()
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($logs);
    }

    public function platforms()
    {
        $factory = app(\App\Services\Integrations\IntegrationDriverFactory::class);
        
        return response()->json([
            'platforms' => $factory->getSupportedPlatforms(),
        ]);
    }
}
