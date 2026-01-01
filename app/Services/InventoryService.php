<?php

namespace App\Services;

use App\Models\Stock;
use App\Models\StockMovement;
use App\Models\Product;
use App\Events\ProductStockLow;
use Illuminate\Support\Facades\DB;

/**
 * InventoryService
 * 
 * Responsabilidades:
 * - Controlar stock real de productos
 * - Registrar movimientos de inventario (entrada, salida, ajuste, transferencia)
 * - Calcular stock actual basado en movimientos
 * - Detectar stock bajo comparando stock vs stock_min del producto
 * - NO modifica datos maestros del producto
 */
class InventoryService
{
    /**
     * Record a stock movement and update stock accordingly
     * 
     * @param int $tenantId
     * @param int $productId
     * @param int|null $warehouseId
     * @param float $quantity Positive for IN movements, negative for OUT movements
     * @param string $movementType 'in', 'out', 'adjustment', 'transfer', 'sale', 'return', etc.
     * @param string|null $referenceType Model class for polymorphic relation (Sale, Purchase, etc.)
     * @param int|null $referenceId ID of the reference model
     * @param int|null $userId
     * @param string|null $description
     * @return StockMovement
     * @throws \Exception
     */
    public function recordMovement(
        int $tenantId,
        int $productId,
        ?int $warehouseId,
        float $quantity,
        string $movementType,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?int $userId = null,
        ?string $description = null
    ): StockMovement {
        return DB::transaction(function () use (
            $tenantId,
            $productId,
            $warehouseId,
            $quantity,
            $movementType,
            $referenceType,
            $referenceId,
            $userId,
            $description
        ) {
            // Lock stock record for update
            $stock = Stock::where('tenant_id', $tenantId)
                ->where('product_id', $productId)
                ->where('warehouse_id', $warehouseId)
                ->lockForUpdate()
                ->first();

            if (!$stock) {
                // Create stock record if it doesn't exist
                $stock = Stock::create([
                    'tenant_id' => $tenantId,
                    'product_id' => $productId,
                    'warehouse_id' => $warehouseId,
                    'quantity' => 0,
                    'reserved' => 0,
                ]);
            }

            $beforeQty = (float) $stock->quantity;
            
            // For OUT movements, ensure quantity is negative
            if (in_array($movementType, ['out', 'sale']) && $quantity > 0) {
                $quantity = -abs($quantity);
            }
            
            $afterQty = $beforeQty + $quantity;

            // Prevent negative stock
            if ($afterQty < 0) {
                throw new \Exception("Insufficient stock for product ID {$productId}. Available: {$beforeQty}, Required: " . abs($quantity));
            }

            // Update stock
            $stock->quantity = $afterQty;
            $stock->save();

            // Record movement
            $movement = StockMovement::create([
                'tenant_id' => $tenantId,
                'product_id' => $productId,
                'warehouse_id' => $warehouseId,
                'movement_type' => $movementType,
                'quantity' => abs($quantity),
                'before_qty' => $beforeQty,
                'after_qty' => $afterQty,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'description' => $description,
                'created_by' => $userId,
            ]);

            // Check if stock is low and trigger event
            $this->checkStockLevel($productId, $afterQty);

            return $movement;
        });
    }

    /**
     * Get current stock for a product in a specific warehouse
     * 
     * @param int $tenantId
     * @param int $productId
     * @param int|null $warehouseId
     * @return array ['quantity' => float, 'reserved' => float, 'available' => float]
     */
    public function getCurrentStock(int $tenantId, int $productId, ?int $warehouseId = null): array
    {
        $query = Stock::where('tenant_id', $tenantId)
            ->where('product_id', $productId);

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        $stocks = $query->get();
        
        $totalQuantity = $stocks->sum('quantity');
        $totalReserved = $stocks->sum('reserved');
        $available = $totalQuantity - $totalReserved;

        return [
            'quantity' => (float) $totalQuantity,
            'reserved' => (float) $totalReserved,
            'available' => (float) $available,
        ];
    }

    /**
     * Calculate stock status for a product
     * Status is CALCULATED, not stored in database
     * 
     * @param int $tenantId
     * @param int $productId
     * @param int|null $warehouseId
     * @return array ['status' => string, 'quantity' => float, 'stock_min' => int]
     */
    public function getStockStatus(int $tenantId, int $productId, ?int $warehouseId = null): array
    {
        $product = Product::where('tenant_id', $tenantId)->find($productId);
        
        if (!$product) {
            throw new \Exception("Product not found");
        }

        $stockInfo = $this->getCurrentStock($tenantId, $productId, $warehouseId);
        $stockMin = (int) $product->stock_min;
        $quantity = $stockInfo['quantity'];

        // Calculate status
        if ($quantity <= 0) {
            $status = 'OUT_OF_STOCK';
        } elseif ($quantity < $stockMin) {
            $status = 'LOW_STOCK';
        } else {
            $status = 'OK';
        }

        return [
            'status' => $status,
            'quantity' => $quantity,
            'available' => $stockInfo['available'],
            'reserved' => $stockInfo['reserved'],
            'stock_min' => $stockMin,
        ];
    }

    /**
     * Get stock movement history for a product
     * 
     * @param int $tenantId
     * @param int $productId
     * @param int|null $warehouseId
     * @param string|null $dateFrom
     * @param string|null $dateTo
     * @param string $orderBy 'asc' or 'desc'
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getStockHistory(
        int $tenantId,
        int $productId,
        ?int $warehouseId = null,
        ?string $dateFrom = null,
        ?string $dateTo = null,
        string $orderBy = 'desc'
    ) {
        $query = StockMovement::where('tenant_id', $tenantId)
            ->where('product_id', $productId)
            ->with(['user', 'warehouse', 'reference', 'product']);

        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        if ($dateFrom) {
            $query->where('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->where('created_at', '<=', $dateTo);
        }

        $query->orderBy('created_at', $orderBy === 'asc' ? 'asc' : 'desc');

        return $query->get();
    }

    /**
     * Transfer stock between warehouses
     * 
     * @param int $tenantId
     * @param int $productId
     * @param int $fromWarehouseId
     * @param int $toWarehouseId
     * @param float $quantity
     * @param int|null $userId
     * @param string|null $description
     * @return array ['out' => StockMovement, 'in' => StockMovement]
     */
    public function transferStock(
        int $tenantId,
        int $productId,
        int $fromWarehouseId,
        int $toWarehouseId,
        float $quantity,
        ?int $userId = null,
        ?string $description = null
    ): array {
        $description = $description ?? "Transfer from warehouse {$fromWarehouseId} to {$toWarehouseId}";

        $out = $this->recordMovement(
            $tenantId,
            $productId,
            $fromWarehouseId,
            -abs($quantity),
            'transfer_out',
            null,
            null,
            $userId,
            $description
        );

        $in = $this->recordMovement(
            $tenantId,
            $productId,
            $toWarehouseId,
            abs($quantity),
            'transfer_in',
            null,
            null,
            $userId,
            $description
        );

        return ['out' => $out, 'in' => $in];
    }

    /**
     * Get products with low stock
     * 
     * @param int $tenantId
     * @return \Illuminate\Support\Collection
     */
    public function getLowStockProducts(int $tenantId)
    {
        // Get all products with stock_min > 0
        $products = Product::where('tenant_id', $tenantId)
            ->where('stock_min', '>', 0)
            ->get();

        return $products->map(function ($product) use ($tenantId) {
            $stockInfo = $this->getCurrentStock($tenantId, $product->id);
            $status = $this->getStockStatus($tenantId, $product->id);
            
            return [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'sku' => $product->sku,
                'current_stock' => $stockInfo['quantity'],
                'stock_min' => $product->stock_min,
                'status' => $status['status'],
            ];
        })->filter(function ($item) {
            return in_array($item['status'], ['LOW_STOCK', 'OUT_OF_STOCK']);
        })->values();
    }

    /**
     * Check stock level and trigger low stock event if needed
     * 
     * @param int $productId
     * @param float $currentQuantity
     * @return void
     */
    protected function checkStockLevel(int $productId, float $currentQuantity): void
    {
        $product = Product::find($productId);
        
        if ($product && $product->stock_min > 0 && $currentQuantity < $product->stock_min) {
            event(new ProductStockLow($product));
        }
    }
}
