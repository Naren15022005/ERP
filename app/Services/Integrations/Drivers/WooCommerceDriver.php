<?php

namespace App\Services\Integrations\Drivers;

use App\Models\ExternalConnection;
use App\Services\Integrations\Contracts\IntegrationDriverInterface;
use Illuminate\Support\Facades\Http;

class WooCommerceDriver implements IntegrationDriverInterface
{
    protected ExternalConnection $connection;
    protected array $credentials;
    protected string $baseUrl;

    public function __construct(ExternalConnection $connection)
    {
        $this->connection = $connection;
        $this->credentials = $connection->credentials;
        $this->baseUrl = rtrim($connection->api_url, '/');
    }

    public function testConnection(): bool
    {
        try {
            $response = $this->makeRequest('GET', '/wp-json/wc/v3/system_status');
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    public function fetchProducts(array $filters = []): array
    {
        $params = array_merge([
            'per_page' => 100,
            'page' => 1,
        ], $filters);

        $response = $this->makeRequest('GET', '/wp-json/wc/v3/products', $params);

        if (!$response->successful()) {
            throw new \Exception("Error al obtener productos: " . $response->body());
        }

        return $response->json();
    }

    public function pushProduct(array $productData): array
    {
        $mapped = $this->mapProductToWooCommerce($productData);

        if (isset($productData['external_id'])) {
            // Actualizar
            $response = $this->makeRequest(
                'PUT',
                "/wp-json/wc/v3/products/{$productData['external_id']}",
                $mapped
            );
        } else {
            // Crear
            $response = $this->makeRequest('POST', '/wp-json/wc/v3/products', $mapped);
        }

        if (!$response->successful()) {
            throw new \Exception("Error al crear/actualizar producto: " . $response->body());
        }

        return $response->json();
    }

    public function fetchOrders(array $filters = []): array
    {
        $params = array_merge([
            'per_page' => 100,
            'page' => 1,
            'status' => 'any',
        ], $filters);

        $response = $this->makeRequest('GET', '/wp-json/wc/v3/orders', $params);

        if (!$response->successful()) {
            throw new \Exception("Error al obtener pedidos: " . $response->body());
        }

        return $response->json();
    }

    public function updateOrderStatus(string $externalOrderId, string $status): bool
    {
        $statusMap = [
            'pending' => 'pending',
            'processing' => 'processing',
            'completed' => 'completed',
            'cancelled' => 'cancelled',
        ];

        $wooStatus = $statusMap[$status] ?? 'processing';

        $response = $this->makeRequest(
            'PUT',
            "/wp-json/wc/v3/orders/{$externalOrderId}",
            ['status' => $wooStatus]
        );

        return $response->successful();
    }

    public function syncInventory(array $inventoryData): bool
    {
        // WooCommerce maneja inventario por producto
        foreach ($inventoryData as $item) {
            if (!isset($item['external_id']) || !isset($item['stock'])) {
                continue;
            }

            $this->makeRequest(
                'PUT',
                "/wp-json/wc/v3/products/{$item['external_id']}",
                [
                    'stock_quantity' => $item['stock'],
                    'manage_stock' => true,
                ]
            );
        }

        return true;
    }

    public function fetchCustomers(array $filters = []): array
    {
        $params = array_merge([
            'per_page' => 100,
            'page' => 1,
        ], $filters);

        $response = $this->makeRequest('GET', '/wp-json/wc/v3/customers', $params);

        if (!$response->successful()) {
            throw new \Exception("Error al obtener clientes: " . $response->body());
        }

        return $response->json();
    }

    public function setupWebhook(string $webhookUrl, array $events): bool
    {
        foreach ($events as $event) {
            $this->makeRequest('POST', '/wp-json/wc/v3/webhooks', [
                'name' => "ERP Webhook - {$event}",
                'topic' => $event, // ej: 'order.created', 'product.updated'
                'delivery_url' => $webhookUrl,
                'secret' => $this->credentials['webhook_secret'] ?? '',
            ]);
        }

        return true;
    }

    protected function makeRequest(string $method, string $endpoint, array $data = [])
    {
        $url = $this->baseUrl . $endpoint;

        $request = Http::withBasicAuth(
            $this->credentials['consumer_key'] ?? '',
            $this->credentials['consumer_secret'] ?? ''
        )->timeout(30);

        return match (strtoupper($method)) {
            'GET' => $request->get($url, $data),
            'POST' => $request->post($url, $data),
            'PUT' => $request->put($url, $data),
            'DELETE' => $request->delete($url, $data),
            default => throw new \InvalidArgumentException("Método HTTP no soportado: {$method}"),
        };
    }

    protected function mapProductToWooCommerce(array $productData): array
    {
        return [
            'name' => $productData['name'] ?? '',
            'type' => $productData['type'] ?? 'simple',
            'regular_price' => (string)($productData['price'] ?? 0),
            'description' => $productData['description'] ?? '',
            'short_description' => $productData['short_description'] ?? '',
            'sku' => $productData['sku'] ?? '',
            'manage_stock' => true,
            'stock_quantity' => $productData['stock'] ?? 0,
            'categories' => $productData['categories'] ?? [],
            'images' => $productData['images'] ?? [],
        ];
    }
}
