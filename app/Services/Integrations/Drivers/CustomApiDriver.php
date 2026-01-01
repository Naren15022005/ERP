<?php

namespace App\Services\Integrations\Drivers;

use App\Models\ExternalConnection;
use App\Services\Integrations\Contracts\IntegrationDriverInterface;
use Illuminate\Support\Facades\Http;

/**
 * Driver genérico para APIs REST personalizadas
 */
class CustomApiDriver implements IntegrationDriverInterface
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
            $testEndpoint = $this->config['test_endpoint'] ?? '/health';
            $response = $this->makeRequest('GET', $testEndpoint);
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    public function fetchProducts(array $filters = []): array
    {
        $endpoint = $this->config['endpoints']['products']['list'] ?? '/products';
        $response = $this->makeRequest('GET', $endpoint, $filters);

        if (!$response->successful()) {
            throw new \Exception("Error al obtener productos: " . $response->body());
        }

        // El path del array de productos puede variar según la API
        $dataPath = $this->config['response_paths']['products'] ?? 'data';
        return data_get($response->json(), $dataPath, []);
    }

    public function pushProduct(array $productData): array
    {
        if (isset($productData['external_id'])) {
            $endpoint = str_replace(
                '{id}',
                $productData['external_id'],
                $this->config['endpoints']['products']['update'] ?? '/products/{id}'
            );
            $response = $this->makeRequest('PUT', $endpoint, $productData);
        } else {
            $endpoint = $this->config['endpoints']['products']['create'] ?? '/products';
            $response = $this->makeRequest('POST', $endpoint, $productData);
        }

        if (!$response->successful()) {
            throw new \Exception("Error al crear/actualizar producto: " . $response->body());
        }

        return $response->json();
    }

    public function fetchOrders(array $filters = []): array
    {
        $endpoint = $this->config['endpoints']['orders']['list'] ?? '/orders';
        $response = $this->makeRequest('GET', $endpoint, $filters);

        if (!$response->successful()) {
            throw new \Exception("Error al obtener pedidos: " . $response->body());
        }

        $dataPath = $this->config['response_paths']['orders'] ?? 'data';
        return data_get($response->json(), $dataPath, []);
    }

    public function updateOrderStatus(string $externalOrderId, string $status): bool
    {
        $endpoint = str_replace(
            '{id}',
            $externalOrderId,
            $this->config['endpoints']['orders']['update_status'] ?? '/orders/{id}/status'
        );

        $response = $this->makeRequest('PUT', $endpoint, ['status' => $status]);
        return $response->successful();
    }

    public function syncInventory(array $inventoryData): bool
    {
        $endpoint = $this->config['endpoints']['inventory']['sync'] ?? '/inventory/sync';
        $response = $this->makeRequest('POST', $endpoint, $inventoryData);
        return $response->successful();
    }

    public function fetchCustomers(array $filters = []): array
    {
        $endpoint = $this->config['endpoints']['customers']['list'] ?? '/customers';
        $response = $this->makeRequest('GET', $endpoint, $filters);

        if (!$response->successful()) {
            throw new \Exception("Error al obtener clientes: " . $response->body());
        }

        $dataPath = $this->config['response_paths']['customers'] ?? 'data';
        return data_get($response->json(), $dataPath, []);
    }

    public function setupWebhook(string $webhookUrl, array $events): bool
    {
        $endpoint = $this->config['endpoints']['webhooks']['setup'] ?? '/webhooks';
        
        $response = $this->makeRequest('POST', $endpoint, [
            'url' => $webhookUrl,
            'events' => $events,
            'secret' => $this->credentials['webhook_secret'] ?? '',
        ]);

        return $response->successful();
    }

    protected function makeRequest(string $method, string $endpoint, array $data = [])
    {
        $url = $this->baseUrl . $endpoint;

        $request = Http::timeout(30);

        // Configurar autenticación según tipo
        $authType = $this->credentials['auth_type'] ?? 'bearer';
        
        switch ($authType) {
            case 'bearer':
                $request->withToken($this->credentials['token'] ?? '');
                break;
            case 'basic':
                $request->withBasicAuth(
                    $this->credentials['username'] ?? '',
                    $this->credentials['password'] ?? ''
                );
                break;
            case 'api_key':
                $keyHeader = $this->credentials['api_key_header'] ?? 'X-API-Key';
                $request->withHeaders([
                    $keyHeader => $this->credentials['api_key'] ?? '',
                ]);
                break;
        }

        // Headers adicionales
        if (isset($this->config['headers'])) {
            $request->withHeaders($this->config['headers']);
        }

        return match (strtoupper($method)) {
            'GET' => $request->get($url, $data),
            'POST' => $request->post($url, $data),
            'PUT' => $request->put($url, $data),
            'DELETE' => $request->delete($url, $data),
            default => throw new \InvalidArgumentException("Método HTTP no soportado: {$method}"),
        };
    }
}
