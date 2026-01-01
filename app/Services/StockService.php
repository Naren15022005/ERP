<?php

namespace App\Services;

use App\Models\Stock;
use App\Models\StockMovement;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use App\Events\ProductStockLow;

/**
 * StockService (deprecated - use InventoryService instead)
 * 
 * This service is maintained for backward compatibility.
 * New code should use InventoryService for better separation of concerns.
 */
class StockService
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Adjust stock for a product in a warehouse (positive or negative)
     * 
     * @deprecated Use InventoryService::recordMovement() instead
     */
    public function adjustStock(int $tenantId, int $productId, ?int $warehouseId, float $quantity, string $movementType, ?int $userId = null, ?string $description = null, ?string $idempotencyKey = null)
    {
        // Check idempotency
        if ($idempotencyKey) {
            $exists = StockMovement::where('tenant_id', $tenantId)
                ->where('description', $idempotencyKey)
                ->exists();
            if ($exists) return null;
        }

        // Delegate to InventoryService
        try {
            return $this->inventoryService->recordMovement(
                $tenantId,
                $productId,
                $warehouseId,
                $movementType === 'out' ? -abs($quantity) : abs($quantity),
                $movementType,
                null, // referenceType
                null, // referenceId
                $userId,
                $idempotencyKey ?? $description
            );
        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * Transfer stock between warehouses
     * 
     * @deprecated Use InventoryService::transferStock() instead
     */
    public function transferStock(int $tenantId, int $productId, int $fromWarehouseId, int $toWarehouseId, float $quantity, ?int $userId = null, ?string $description = null, ?string $idempotencyKey = null)
    {
        // Check idempotency
        if ($idempotencyKey) {
            $debitKey = $idempotencyKey . ':debit';
            $creditKey = $idempotencyKey . ':credit';
            
            $debitExists = StockMovement::where('tenant_id', $tenantId)
                ->where('description', $debitKey)
                ->exists();
            $creditExists = StockMovement::where('tenant_id', $tenantId)
                ->where('description', $creditKey)
                ->exists();
                
            if ($debitExists && $creditExists) {
                return ['debit' => null, 'credit' => null];
            }
        }

        // Delegate to InventoryService
        $result = $this->inventoryService->transferStock(
            $tenantId,
            $productId,
            $fromWarehouseId,
            $toWarehouseId,
            $quantity,
            $userId,
            $description
        );

        return ['debit' => $result['out'], 'credit' => $result['in']];
    }
}

