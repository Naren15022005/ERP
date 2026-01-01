<?php

namespace App\Services\Integrations\Drivers;

use App\Models\ExternalConnection;
use App\Services\Integrations\Contracts\IntegrationDriverInterface;
use Illuminate\Support\Facades\Http;

/**
 * Driver para MedusaJS - Modern Node.js ecommerce
 * https://medusajs.com/
 */
class MedusaDriver implements IntegrationDriverInterface
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
            $response = $this->makeRequest('GET', '/store/products', ['limit' => 1]);
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    public function fetchProducts(array $filters = []): array
    {
        $params = array_merge([
            'limit' => 100,
            'offset' => 0,
        ], $filters);

        $response = $this->makeRequest('GET', '/admin/products', $params);

        if (!$response->successful()) {
            throw new \Exception("Error al obtener productos: " . $response->body());
        }

        return $response->json()['products'] ?? [];
    }

    public function pushProduct(array $productData): array
    {
        $mapped = $this->mapProductToMedusa($productData);

        if (isset($productData['external_id'])) {
            // Actualizar
            $response = $this->makeRequest(
                'POST',
                "/admin/products/{$productData['external_id']}",
                $mapped
            );
        } else {
            // Crear
            $response = $this->makeRequest('POST', '/admin/products', $mapped);
        }

        if (!$response->successful()) {
            throw new \Exception("Error al crear/actualizar producto: " . $response->body());
        }

        return $response->json()['product'] ?? [];
    }

    public function fetchOrders(array $filters = []): array
    {
        $params = array_merge([
            'limit' => 100,
            'offset' => 0,
        ], $filters);

        $response = $this->makeRequest('GET', '/admin/orders', $params);

        if (!$response->successful()) {
            throw new \Exception("Error al obtener pedidos: " . $response->body());
        }

        return $response->json()['orders'] ?? [];
    }

    public function updateOrderStatus(string $externalOrderId, string $status): bool
    {
        // Medusa usa fulfillment workflow
        $medusaStatus = match ($status) {
            'pending' => 'pending',
            'processing' => 'requires_action',
            'completed' => 'fulfilled',
            'cancelled' => 'canceled',
            default => 'pending',
        };

        $response = $this->makeRequest(
            'POST',
            "/admin/orders/{$externalOrderId}",
            ['status' => $medusaStatus]
        );

        return $response->successful();
    }

    public function syncInventory(array $inventoryData): bool
    {
        foreach ($inventoryData as $item) {
            if (!isset($item['external_id']) || !isset($item['stock'])) {
                continue;
            }

            // Medusa maneja inventory por variant
            $this->makeRequest(
                'POST',
                "/admin/variants/{$item['variant_id']}/inventory",
                [
                    'inventory_quantity' => $item['stock'],
                ]
            );
        }

        return true;
    }

    public function fetchCustomers(array $filters = []): array
    {
        $params = array_merge([
            'limit' => 100,
            'offset' => 0,
        ], $filters);

        $response = $this->makeRequest('GET', '/admin/customers', $params);

        if (!$response->successful()) {
            throw new \Exception("Error al obtener clientes: " . $response->body());
        }

        return $response->json()['customers'] ?? [];
    }

    public function setupWebhook(string $webhookUrl, array $events): bool
    {
        // Medusa no tiene endpoint de webhooks en API, se configura vía código o plugins
        // Retornamos true y documentamos la configuración manual
        return true;
    }

    protected function makeRequest(string $method, string $endpoint, array $data = [])
    {
        $url = $this->baseUrl . $endpoint;

        $request = Http::withHeaders([
            'x-medusa-access-token' => $this->credentials['api_token'] ?? '',
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

    protected function mapProductToMedusa(array $productData): array
    {
        return [
            'title' => $productData['name'] ?? '',
            'description' => $productData['description'] ?? '',
            'handle' => $productData['slug'] ?? str_slug($productData['name'] ?? ''),
            'is_giftcard' => false,
            'discountable' => true,
            'options' => [
                [
                    'title' => 'Default',
                ]
            ],
            'variants' => [
                [
                    'title' => 'Default Variant',
                    'prices' => [
                        [
                            'amount' => (int)(($productData['price'] ?? 0) * 100), // Centavos
                            'currency_code' => $this->credentials['currency'] ?? 'usd',
                        ]
                    ],
                    'sku' => $productData['sku'] ?? '',
                    'manage_inventory' => true,
                    'inventory_quantity' => $productData['stock'] ?? 0,
                ]
            ],
            'images' => array_map(fn($img) => ['url' => $img], $productData['images'] ?? []),
        ];
    }
}
