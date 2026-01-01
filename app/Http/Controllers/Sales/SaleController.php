<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSaleRequest;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Payment;
use App\Enums\SaleStatus;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    public function __construct(protected InventoryService $inventoryService)
    {
        $this->middleware(['auth:sanctum', \App\Http\Middleware\TenantMiddleware::class]);
        $this->authorizeResource(Sale::class, 'sale');
    }

    public function store(StoreSaleRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();

        $sale = DB::transaction(function () use ($data, $user) {
            $sale = Sale::create([
                'tenant_id' => $user->tenant_id,
                'customer_id' => $data['customer_id'] ?? null,
                'user_id' => $user->id,
                'invoice_number' => $data['invoice_number'] ?? 'INV-' . strtoupper(uniqid()),
                'subtotal' => $data['subtotal'],
                'tax' => $data['tax'] ?? 0,
                'discount' => $data['discount'] ?? 0,
                'total' => $data['total'],
                'status' => $data['status'] ?? SaleStatus::DRAFT,
                'sale_date' => $data['sale_date'] ?? now(),
            ]);

            foreach ($data['items'] as $item) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'tenant_id' => $user->tenant_id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'discount' => $item['discount'] ?? 0,
                    'subtotal' => ($item['price'] * $item['quantity']) - ($item['discount'] ?? 0),
                ]);

                // INVENTARIO: Registrar salida de stock con referencia a la venta
                // Buscar primer almacén disponible con stock
                $stock = \App\Models\Stock::where('tenant_id', $user->tenant_id)
                    ->where('product_id', $item['product_id'])
                    ->where('quantity', '>', 0)
                    ->first();

                if ($stock) {
                    // Usar InventoryService para registrar el movimiento con trazabilidad completa
                    $this->inventoryService->recordMovement(
                        tenantId: $user->tenant_id,
                        productId: $item['product_id'],
                        warehouseId: $stock->warehouse_id,
                        quantity: -abs($item['quantity']), // negativo para salida
                        movementType: 'sale',
                        referenceType: Sale::class, // Referencia polimórfica a la venta
                        referenceId: $sale->id,
                        userId: $user->id,
                        description: "Sale #{$sale->invoice_number}"
                    );
                }
            }

            // Record payment if provided
            if (isset($data['payment_method']) && isset($data['total'])) {
                Payment::create([
                    'tenant_id' => $user->tenant_id,
                    'sale_id' => $sale->id,
                    'method' => $data['payment_method'],
                    'amount' => $data['total'],
                    'reference' => $data['payment_reference'] ?? null,
                    'payment_date' => now(),
                ]);
            }

            return $sale;
        });

        return response()->json(['data' => $sale], 201);
    }
}

