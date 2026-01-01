<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Stock;
use App\Services\StockService;
use App\Services\InventoryService;
use App\Http\Requests\AdjustStockRequest;
use App\Http\Requests\TransferStockRequest;

class StockController extends Controller
{
    protected $service;
    protected $inventoryService;

    public function __construct(StockService $service, InventoryService $inventoryService)
    {
        $this->middleware('auth:sanctum');
        $this->authorizeResource(\App\Models\Stock::class, 'stock');
        $this->service = $service;
        $this->inventoryService = $inventoryService;
    }

    /**
     * List stock records
     */
    public function index(Request $request)
    {
        $tenantId = $request->user()?->tenant_id;
        if (! $tenantId) abort(403);

        $q = Stock::forTenant($tenantId)->with(['product','warehouse']);

        if ($request->filled('product_id')) $q->where('product_id', $request->query('product_id'));
        if ($request->filled('warehouse_id')) $q->where('warehouse_id', $request->query('warehouse_id'));
        if ($request->filled('q')) {
            $term = $request->query('q');
            $q->whereHas('product', function ($s) use ($term) {
                $s->where('name', 'ilike', "%{$term}%")
                  ->orWhere('sku', 'ilike', "%{$term}%")
                  ->orWhere('id', $term);
            });
        }

        $perPage = (int) $request->query('per_page', 25);
        return $q->paginate($perPage)->appends($request->query());
    }

    /**
     * Get products with low stock (calculated, not stored)
     */
    public function low(Request $request)
    {
        $tenantId = $request->user()?->tenant_id;
        if (! $tenantId) abort(403);

        $lowStockProducts = $this->inventoryService->getLowStockProducts($tenantId);

        return response()->json(['data' => $lowStockProducts]);
    }

    /**
     * Get stock status for a product (calculated in real-time)
     */
    public function status(Request $request)
    {
        $tenantId = $request->user()?->tenant_id;
        if (! $tenantId) abort(403);

        $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'warehouse_id' => 'nullable|integer|exists:warehouses,id',
        ]);

        $productId = (int) $request->query('product_id');
        $warehouseId = $request->filled('warehouse_id') ? (int) $request->query('warehouse_id') : null;

        $status = $this->inventoryService->getStockStatus($tenantId, $productId, $warehouseId);

        return response()->json($status);
    }

    /**
     * Get stock movement history (kardex)
     */
    public function kardex(Request $request)
    {
        $tenantId = $request->user()?->tenant_id;
        if (! $tenantId) abort(403);

        $q = \App\Models\StockMovement::forTenant($tenantId)->with(['user','warehouse','product','reference']);

        if ($request->filled('product_id')) $q->where('product_id', $request->query('product_id'));
        if ($request->filled('warehouse_id')) $q->where('warehouse_id', $request->query('warehouse_id'));

        if ($request->filled('date_from')) {
            $q->where('created_at', '>=', $request->query('date_from'));
        }
        if ($request->filled('date_to')) {
            $q->where('created_at', '<=', $request->query('date_to'));
        }

        $order = $request->query('order', 'desc');
        $q->orderBy('created_at', $order === 'asc' ? 'asc' : 'desc');

        $perPage = (int) $request->query('per_page', 25);
        $pag = $q->paginate($perPage)->appends($request->query());

        return \App\Http\Resources\StockMovementResource::collection($pag);
    }

    /**
     * Adjust stock (manual adjustment)
     */
    public function adjust(AdjustStockRequest $request)
    {
        $tenantId = $request->user()?->tenant_id;
        $userId = $request->user()?->id;
        if (! $tenantId) abort(403);

        $movement = $this->service->adjustStock(
            $tenantId,
            $request->validated()['product_id'],
            $request->validated()['warehouse_id'] ?? null,
            (float) $request->validated()['quantity'],
            $request->validated()['movement_type'],
            $userId,
            $request->validated()['description'] ?? null,
            $request->validated()['idempotency_key'] ?? null
        );

        return response()->json($movement, $movement ? 201 : 200);
    }

    /**
     * Transfer stock between warehouses
     */
    public function transfer(TransferStockRequest $request)
    {
        $tenantId = $request->user()?->tenant_id;
        $userId = $request->user()?->id;
        if (! $tenantId) abort(403);

        $res = $this->service->transferStock(
            $tenantId,
            $request->validated()['product_id'],
            $request->validated()['from_warehouse_id'],
            $request->validated()['to_warehouse_id'],
            (float) $request->validated()['quantity'],
            $userId,
            $request->validated()['description'] ?? null,
            $request->validated()['idempotency_key'] ?? null
        );

        return response()->json($res, 201);
    }

    /**
     * Record a new inventory movement
     */
    public function recordMovement(Request $request)
    {
        $tenantId = $request->user()?->tenant_id;
        $userId = $request->user()?->id;
        if (! $tenantId) abort(403);

        $data = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'warehouse_id' => 'nullable|integer|exists:warehouses,id',
            'quantity' => 'required|numeric',
            'movement_type' => 'required|string|in:in,out,adjustment,transfer_in,transfer_out,sale,return,purchase',
            'description' => 'nullable|string|max:500',
        ]);

        $movement = $this->inventoryService->recordMovement(
            tenantId: $tenantId,
            productId: $data['product_id'],
            warehouseId: $data['warehouse_id'] ?? null,
            quantity: (float) $data['quantity'],
            movementType: $data['movement_type'],
            referenceType: null,
            referenceId: null,
            userId: $userId,
            description: $data['description'] ?? null
        );

        return response()->json($movement, 201);
    }
}
