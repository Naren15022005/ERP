<?php

namespace App\Services\Integrations\Drivers;

use App\Models\ExternalConnection;
use App\Services\Integrations\Contracts\IntegrationDriverInterface;
use Illuminate\Support\Facades\Http;

class ShopifyDriver implements IntegrationDriverInterface
{
    protected ExternalConnection $connection;
    protected array $credentials;
    protected string $baseUrl;

    public function __construct(ExternalConnection $connection)
    {
        $this->connection = $connection;
        $this->credentials = $connection->credentials;
        
        // Shopify URL: https://{shop-name}.myshopify.com
        $this->baseUrl = rtrim($connection->api_url, '/');
    }

    public function testConnection(): bool
    {
        try {
            $response = $this->makeRequest('GET', '/admin/api/2024-01/shop.json');
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    public function fetchProducts(array $filters = []): array
    {
        $params = array_merge([
            'limit' => 250,
        ], $filters);

        $response = $this->makeRequest('GET', '/admin/api/2024-01/products.json', $params);

        if (!$response->successful()) {
            throw new \Exception("Error al obtener productos: " . $response->body());
        }

        return $response->json()['products'] ?? [];
    }

    public function pushProduct(array $productData): array
    {
        $mapped = $this->mapProductToShopify($productData);

        if (isset($productData['external_id'])) {
            // Actualizar
            $response = $this->makeRequest(
                'PUT',
                "/admin/api/2024-01/products/{$productData['external_id']}.json",
                ['product' => $mapped]
            );
        } else {
            // Crear
            $response = $this->makeRequest(
                'POST',
                '/admin/api/2024-01/products.json',
                ['product' => $mapped]
            );
        }

        if (!$response->successful()) {
            throw new \Exception("Error al crear/actualizar producto: " . $response->body());
        }

        return $response->json()['product'] ?? [];
    }

    public function fetchOrders(array $filters = []): array
    {
        $params = array_merge([
            'limit' => 250,
            'status' => 'any',
        ], $filters);

        $response = $this->makeRequest('GET', '/admin/api/2024-01/orders.json', $params);

        if (!$response->successful()) {
            throw new \Exception("Error al obtener pedidos: " . $response->body());
        }

        return $response->json()['orders'] ?? [];
    }

    public function updateOrderStatus(string $externalOrderId, string $status): bool
    {
        // Shopify maneja estados vía fulfillment
        $response = $this->makeRequest(
            'POST',
            "/admin/api/2024-01/orders/{$externalOrderId}/fulfillments.json",
            [
                'fulfillment' => [
                    'status' => $status,
                ]
            ]
        );

        return $response->successful();
    }

    public function syncInventory(array $inventoryData): bool
    {
        // Shopify requiere inventory_item_id para actualizar stock
        foreach ($inventoryData as $item) {
            if (!isset($item['inventory_item_id']) || !isset($item['stock'])) {
                continue;
            }

            $this->makeRequest(
                'POST',
                '/admin/api/2024-01/inventory_levels/set.json',
                [
                    'location_id' => $item['location_id'] ?? $this->credentials['default_location_id'],
                    'inventory_item_id' => $item['inventory_item_id'],
                    'available' => $item['stock'],
                ]
            );
        }

        return true;
    }

    public function fetchCustomers(array $filters = []): array
    {
        $params = array_merge([
            'limit' => 250,
        ], $filters);

        $response = $this->makeRequest('GET', '/admin/api/2024-01/customers.json', $params);

        if (!$response->successful()) {
            throw new \Exception("Error al obtener clientes: " . $response->body());
        }

        return $response->json()['customers'] ?? [];
    }

    public function setupWebhook(string $webhookUrl, array $events): bool
    {
        foreach ($events as $event) {
            $this->makeRequest('POST', '/admin/api/2024-01/webhooks.json', [
                'webhook' => [
                    'topic' => $event, // ej: 'orders/create', 'products/update'
                    'address' => $webhookUrl,
                    'format' => 'json',
                ]
            ]);
        }

        return true;
    }

    protected function makeRequest(string $method, string $endpoint, array $data = [])
    {
        $url = $this->baseUrl . $endpoint;

        $request = Http::withHeaders([
            'X-Shopify-Access-Token' => $this->credentials['access_token'] ?? '',
            'Content-Type' => 'application/json',
        ])->timeout(30);

        return match (strtoupper($method)) {
            'GET' => $request->get($url, $data),
            'POST' => $request->post($url, $data),
            'PUT' => $request->put($url, $data),
            'DELETE' => $request->delete($url, $data),
            default => throw new \InvalidArgumentException("Método HTTP no soportado: {$method}"),
        };
    }

    protected function mapProductToShopify(array $productData): array
    {
        return [
            'title' => $productData['name'] ?? '',
            'body_html' => $productData['description'] ?? '',
            'vendor' => $productData['vendor'] ?? 'Default',
            'product_type' => $productData['category'] ?? '',
            'variants' => [
                [
                    'sku' => $productData['sku'] ?? '',
                    'price' => (string)($productData['price'] ?? 0),
                    'inventory_quantity' => $productData['stock'] ?? 0,
                    'inventory_management' => 'shopify',
                ]
            ],
            'images' => $productData['images'] ?? [],
        ];
    }
}
