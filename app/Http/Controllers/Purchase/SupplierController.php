<?php

namespace App\Http\Controllers\Purchase;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum')->except(['index']);
        $this->authorizeResource(\App\Models\Supplier::class, 'supplier');
    }
    public function index()
    {
        return response()->json(['message' => 'suppliers index']);
    }

    public function store(Request $request)
    {
        return response()->json(['message' => 'supplier created']);
    }
}
