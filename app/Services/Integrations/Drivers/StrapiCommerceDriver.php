<?php

namespace App\Services\Integrations\Drivers;

use App\Models\ExternalConnection;
use App\Services\Integrations\Contracts\IntegrationDriverInterface;
use Illuminate\Support\Facades\Http;

/**
 * Driver para Strapi Commerce - Headless CMS con capacidades de ecommerce
 * https://strapi.io/
 */
class StrapiCommerceDriver implements IntegrationDriverInterface
{
    protected ExternalConnection $connection;
    protected array $credentials;
    protected string $baseUrl;
    protected array $config;

    public function __construct(ExternalConnection $connection)
    {
        $this->connection = $connection;
        $this->credentials = $connection->credentials;
        $this->baseUrl = rtrim($connection->api_url, '/');
        $this->config = $connection->config ?? [];
    }

    public function testConnection(): bool
    {
        try {
            $response = $this->makeRequest('GET', '/api/products', ['pagination[limit]' => 1]);
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    public function fetchProducts(array $filters = []): array
    {
        $collectionName = $this->config['product_collection'] ?? 'products';
        
        $params = array_merge([
            'pagination[limit]' => 100,
            'pagination[start]' => 0,
            'populate' => '*',
        ], $filters);

        $response = $this->makeRequest('GET', "/api/{$collectionName}", $params);

        if (!$response->successful()) {
            throw new \Exception("Error al obtener productos: " . $response->body());
        }

        return $response->json()['data'] ?? [];
    }

    public function pushProduct(array $productData): array
    {
        $collectionName = $this->config['product_collection'] ?? 'products';
        $mapped = $this->mapProductToStrapi($productData);

        if (isset($productData['external_id'])) {
            // Actualizar
            $response = $this->makeRequest(
                'PUT',
                "/api/{$collectionName}/{$productData['external_id']}",
                ['data' => $mapped]
            );
        } else {
            // Crear
            $response = $this->makeRequest(
                'POST',
                "/api/{$collectionName}",
                ['data' => $mapped]
            );
        }

        if (!$response->successful()) {
            throw new \Exception("Error al crear/actualizar producto: " . $response->body());
        }

        return $response->json()['data'] ?? [];
    }

    public function fetchOrders(array $filters = []): array
    {
        $collectionName = $this->config['order_collection'] ?? 'orders';
        
        $params = array_merge([
            'pagination[limit]' => 100,
            'pagination[start]' => 0,
            'populate' => '*',
        ], $filters);

        $response = $this->makeRequest('GET', "/api/{$collectionName}", $params);

        if (!$response->successful()) {
            throw new \Exception("Error al obtener pedidos: " . $response->body());
        }

        return $response->json()['data'] ?? [];
    }

    public function updateOrderStatus(string $externalOrderId, string $status): bool
    {
        $collectionName = $this->config['order_collection'] ?? 'orders';
        
        $response = $this->makeRequest(
            'PUT',
            "/api/{$collectionName}/{$externalOrderId}",
            [
                'data' => [
                    'status' => $status,
                    'updatedAt' => now()->toIso8601String(),
                ]
            ]
        );

        return $response->successful();
    }

    public function syncInventory(array $inventoryData): bool
    {
        $collectionName = $this->config['product_collection'] ?? 'products';

        foreach ($inventoryData as $item) {
            if (!isset($item['external_id']) || !isset($item['stock'])) {
                continue;
            }

            $this->makeRequest(
                'PUT',
                "/api/{$collectionName}/{$item['external_id']}",
                [
                    'data' => [
                        'stock' => $item['stock'],
                        'inStock' => $item['stock'] > 0,
                    ]
                ]
            );
        }

        return true;
    }

    public function fetchCustomers(array $filters = []): array
    {
        // Strapi usa users-permissions plugin
        $params = array_merge([
            'pagination[limit]' => 100,
            'pagination[start]' => 0,
        ], $filters);

        $response = $this->makeRequest('GET', '/api/users', $params);

        if (!$response->successful()) {
            throw new \Exception("Error al obtener clientes: " . $response->body());
        }

        return $response->json() ?? [];
    }

    public function setupWebhook(string $webhookUrl, array $events): bool
    {
        // Strapi webhooks se configuran via admin panel o plugins
        // Retornamos true y documentamos configuración manual
        return true;
    }

    protected function makeRequest(string $method, string $endpoint, array $data = [])
    {
        $url = $this->baseUrl . $endpoint;

        $request = Http::withHeaders([
            'Authorization' => 'Bearer ' . ($this->credentials['api_token'] ?? ''),
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

    protected function mapProductToStrapi(array $productData): array
    {
        // El esquema de Strapi es completamente personalizable
        // Este es un mapeo genérico que debe adaptarse al schema del cliente
        $fieldMapping = $this->config['field_mapping'] ?? [];

        return [
            $fieldMapping['name'] ?? 'name' => $productData['name'] ?? '',
            $fieldMapping['description'] ?? 'description' => $productData['description'] ?? '',
            $fieldMapping['price'] ?? 'price' => $productData['price'] ?? 0,
            $fieldMapping['sku'] ?? 'sku' => $productData['sku'] ?? '',
            $fieldMapping['stock'] ?? 'stock' => $productData['stock'] ?? 0,
            $fieldMapping['active'] ?? 'publishedAt' => $productData['is_active'] ?? true ? now()->toIso8601String() : null,
        ];
    }
}
