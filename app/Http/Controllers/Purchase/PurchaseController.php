<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PurchaseController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->authorizeResource(\App\Models\PurchaseOrder::class, 'purchase_order');
    }
    public function index()
    {
        return response()->json(['message' => 'purchase orders index']);
    }

    public function store(Request $request)
    {
        return response()->json(['message' => 'purchase order created']);
    }
}
