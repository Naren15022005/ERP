<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->authorizeResource(\App\Models\Warehouse::class, 'warehouse');
    }
    public function index()
    {
        $tenantId = auth()->user()?->tenant_id;
        if (! $tenantId) abort(403);
        return Warehouse::forTenant($tenantId)->get();
    }

    public function show(Request $request, Warehouse $warehouse)
    {
        $tenantId = $request->user()?->tenant_id;
        if (! $tenantId || $warehouse->tenant_id !== $tenantId) abort(404);
        return $warehouse;
    }

    public function store(Request $request)
    {
        $tenantId = $request->user()?->tenant_id;
        if (! $tenantId) abort(403);
        $data = $request->validate(['name' => 'required|string|max:255','code' => 'nullable|string']);
        $data['tenant_id'] = $tenantId;
        $w = Warehouse::create($data);
        return response($w, 201);
    }

    public function update(Request $request, Warehouse $warehouse)
    {
        $tenantId = $request->user()?->tenant_id;
        if (! $tenantId || $warehouse->tenant_id !== $tenantId) abort(404);
        $data = $request->validate(['name' => 'required|string|max:255','code' => 'nullable|string']);
        $warehouse->update($data);
        return $warehouse;
    }

    public function destroy(Request $request, Warehouse $warehouse)
    {
        $tenantId = $request->user()?->tenant_id;
        if (! $tenantId || $warehouse->tenant_id !== $tenantId) abort(404);
        $warehouse->delete();
        return response('', 204);
    }
}
