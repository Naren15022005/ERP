<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use Illuminate\Http\Request;

class StockController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->authorizeResource(\App\Models\Stock::class, 'stock');
    }
    public function index()
    {
        $tenantId = auth()->user()?->tenant_id;
        if (! $tenantId) abort(403);
        return Stock::forTenant($tenantId)->with(['product','warehouse'])->paginate(25);
    }

    public function show(Request $request, Stock $stock)
    {
        $tenantId = $request->user()?->tenant_id;
        if (! $tenantId || $stock->tenant_id !== $tenantId) abort(404);
        return $stock->load(['product','warehouse']);
    }

    public function update(Request $request, Stock $stock)
    {
        $tenantId = $request->user()?->tenant_id;
        if (! $tenantId || $stock->tenant_id !== $tenantId) abort(404);
        $data = $request->validate(['quantity' => 'required|numeric','reserved' => 'nullable|numeric']);
        $stock->update($data);
        return $stock;
    }
}
