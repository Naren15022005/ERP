<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockMovement;
use Illuminate\Http\Request;

class StockMovementController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->authorizeResource(\App\Models\StockMovement::class, 'stock_movement');
    }
    public function index()
    {
        $tenantId = auth()->user()?->tenant_id;
        if (! $tenantId) abort(403);
        return StockMovement::forTenant($tenantId)->latest()->paginate(25);
    }

    public function store(Request $request)
    {
        $tenantId = $request->user()?->tenant_id;
        $userId = $request->user()?->id;
        if (! $tenantId) abort(403);
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'movement_type' => 'required|string',
            'quantity' => 'required|numeric',
            'description' => 'nullable|string'
        ]);
        $data['tenant_id'] = $tenantId;
        $data['created_by'] = $userId;
        $m = StockMovement::create($data);
        return response($m, 201);
    }
}
