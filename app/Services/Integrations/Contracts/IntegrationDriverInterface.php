<?php

namespace App\Services\Integrations\Contracts;

interface IntegrationDriverInterface
{
    /**
     * Probar la conexión con el sistema externo
     */
    public function testConnection(): bool;

    /**
     * Obtener productos del sistema externo
     */
    public function fetchProducts(array $filters = []): array;

    /**
     * Crear/actualizar producto en el sistema externo
     */
    public function pushProduct(array $productData): array;

    /**
     * Obtener pedidos del sistema externo
     */
    public function fetchOrders(array $filters = []): array;

    /**
     * Actualizar estado de pedido en el sistema externo
     */
    public function updateOrderStatus(string $externalOrderId, string $status): bool;

    /**
     * Sincronizar inventario
     */
    public function syncInventory(array $inventoryData): bool;

    /**
     * Obtener clientes del sistema externo
     */
    public function fetchCustomers(array $filters = []): array;

    /**
     * Configurar webhook en el sistema externo
     */
    public function setupWebhook(string $webhookUrl, array $events): bool;
}
