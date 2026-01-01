<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;

class CustomerController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->authorizeResource(\App\Models\Customer::class, 'customer');
    }
    // Listar clientes (paginado)
    public function index(Request $request)
    {
        $perPage = (int) $request->query('per_page', 15);
        $customers = Customer::withCount('sales')->paginate($perPage);
        return response()->json($customers);
    }

    // Crear cliente
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'tax_id' => 'nullable|string|max:100',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'zip_code' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
        ]);

        if (auth()->check() && isset(auth()->user()->tenant_id)) {
            $data['tenant_id'] = auth()->user()->tenant_id;
        }

        $customer = Customer::create($data);
        return response()->json($customer, 201);
    }

    // Mostrar cliente con historial de ventas
    public function show(Customer $customer)
    {
        $customer->load(['sales' => function ($q) {
            $q->with('items')->orderBy('sale_date', 'desc');
        }]);

        return response()->json($customer);
    }

    // Actualizar cliente
    public function update(Request $request, Customer $customer)
    {
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'tax_id' => 'nullable|string|max:100',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'zip_code' => 'nullable|string|max:20',
            'notes' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $customer->update($data);

        return response()->json($customer);
    }

    // Eliminar cliente (soft delete)
    public function destroy(Customer $customer)
    {
        $customer->delete();
        return response()->json(['message' => 'Customer deleted']);
    }
}
