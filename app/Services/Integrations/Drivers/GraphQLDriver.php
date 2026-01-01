<?php

namespace App\Services\Integrations\Drivers;

use App\Models\ExternalConnection;
use App\Services\Integrations\Contracts\IntegrationDriverInterface;
use Illuminate\Support\Facades\Http;

/**
 * Driver genérico para APIs GraphQL
 * Compatible con: Saleor, Commerce.js, Vendure, Apollo Server, etc.
 */
class GraphQLDriver implements IntegrationDriverInterface
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
            $query = $this->config['test_query'] ?? '{ __typename }';
            $response = $this->makeQuery($query);
            return isset($response['data']);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function fetchProducts(array $filters = []): array
    {
        $query = $this->config['queries']['products'] ?? $this->getDefaultProductsQuery();
        
        $variables = [
            'first' => $filters['limit'] ?? 100,
            'after' => $filters['cursor'] ?? null,
        ];

        $response = $this->makeQuery($query, $variables);

        // El path depende del schema GraphQL específico
        $dataPath = $this->config['response_paths']['products'] ?? 'data.products.edges';
        return data_get($response, $dataPath, []);
    }

    public function pushProduct(array $productData): array
    {
        if (isset($productData['external_id'])) {
            $mutation = $this->config['mutations']['update_product'] ?? $this->getDefaultUpdateProductMutation();
        } else {
            $mutation = $this->config['mutations']['create_product'] ?? $this->getDefaultCreateProductMutation();
        }

        $variables = $this->mapProductToGraphQL($productData);
        $response = $this->makeQuery($mutation, $variables);

        $dataPath = $this->config['response_paths']['product'] ?? 'data.productCreate.product';
        return data_get($response, $dataPath, []);
    }

    public function fetchOrders(array $filters = []): array
    {
        $query = $this->config['queries']['orders'] ?? $this->getDefaultOrdersQuery();
        
        $variables = [
            'first' => $filters['limit'] ?? 100,
            'after' => $filters['cursor'] ?? null,
        ];

        $response = $this->makeQuery($query, $variables);

        $dataPath = $this->config['response_paths']['orders'] ?? 'data.orders.edges';
        return data_get($response, $dataPath, []);
    }

    public function updateOrderStatus(string $externalOrderId, string $status): bool
    {
        $mutation = $this->config['mutations']['update_order'] ?? $this->getDefaultUpdateOrderMutation();
        
        $variables = [
            'id' => $externalOrderId,
            'status' => $status,
        ];

        $response = $this->makeQuery($mutation, $variables);
        return isset($response['data']);
    }

    public function syncInventory(array $inventoryData): bool
    {
        $mutation = $this->config['mutations']['update_inventory'] ?? $this->getDefaultUpdateInventoryMutation();

        foreach ($inventoryData as $item) {
            if (!isset($item['external_id']) || !isset($item['stock'])) {
                continue;
            }

            $this->makeQuery($mutation, [
                'productId' => $item['external_id'],
                'quantity' => $item['stock'],
            ]);
        }

        return true;
    }

    public function fetchCustomers(array $filters = []): array
    {
        $query = $this->config['queries']['customers'] ?? $this->getDefaultCustomersQuery();
        
        $variables = [
            'first' => $filters['limit'] ?? 100,
            'after' => $filters['cursor'] ?? null,
        ];

        $response = $this->makeQuery($query, $variables);

        $dataPath = $this->config['response_paths']['customers'] ?? 'data.customers.edges';
        return data_get($response, $dataPath, []);
    }

    public function setupWebhook(string $webhookUrl, array $events): bool
    {
        $mutation = $this->config['mutations']['create_webhook'] ?? null;
        
        if (!$mutation) {
            return true; // Configuración manual requerida
        }

        $response = $this->makeQuery($mutation, [
            'url' => $webhookUrl,
            'events' => $events,
        ]);

        return isset($response['data']);
    }

    protected function makeQuery(string $query, array $variables = []): array
    {
        $response = Http::withHeaders([
            'Authorization' => $this->getAuthorizationHeader(),
            'Content-Type' => 'application/json',
        ])
        ->timeout(30)
        ->post($this->baseUrl, [
            'query' => $query,
            'variables' => $variables,
        ]);

        if (!$response->successful()) {
            throw new \Exception("GraphQL Error: " . $response->body());
        }

        $data = $response->json();

        if (isset($data['errors'])) {
            throw new \Exception("GraphQL Errors: " . json_encode($data['errors']));
        }

        return $data;
    }

    protected function getAuthorizationHeader(): string
    {
        $authType = $this->credentials['auth_type'] ?? 'bearer';

        return match ($authType) {
            'bearer' => 'Bearer ' . ($this->credentials['token'] ?? ''),
            'api_key' => $this->credentials['api_key'] ?? '',
            default => '',
        };
    }

    protected function mapProductToGraphQL(array $productData): array
    {
        return [
            'input' => [
                'name' => $productData['name'] ?? '',
                'description' => $productData['description'] ?? '',
                'price' => $productData['price'] ?? 0,
                'sku' => $productData['sku'] ?? '',
                'stock' => $productData['stock'] ?? 0,
            ]
        ];
    }

    // Queries por defecto (estilo Saleor/Commerce Layer)
    protected function getDefaultProductsQuery(): string
    {
        return <<<'GQL'
        query Products($first: Int, $after: String) {
            products(first: $first, after: $after) {
                edges {
                    node {
                        id
                        name
                        description
                        pricing {
                            priceRange {
                                start {
                                    gross {
                                        amount
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        GQL;
    }

    protected function getDefaultOrdersQuery(): string
    {
        return <<<'GQL'
        query Orders($first: Int, $after: String) {
            orders(first: $first, after: $after) {
                edges {
                    node {
                        id
                        number
                        status
                        total {
                            gross {
                                amount
                            }
                        }
                    }
                }
            }
        }
        GQL;
    }

    protected function getDefaultCustomersQuery(): string
    {
        return <<<'GQL'
        query Customers($first: Int, $after: String) {
            customers(first: $first, after: $after) {
                edges {
                    node {
                        id
                        email
                        firstName
                        lastName
                    }
                }
            }
        }
        GQL;
    }

    protected function getDefaultCreateProductMutation(): string
    {
        return <<<'GQL'
        mutation CreateProduct($input: ProductInput!) {
            productCreate(input: $input) {
                product {
                    id
                    name
                }
            }
        }
        GQL;
    }

    protected function getDefaultUpdateProductMutation(): string
    {
        return <<<'GQL'
        mutation UpdateProduct($id: ID!, $input: ProductInput!) {
            productUpdate(id: $id, input: $input) {
                product {
                    id
                    name
                }
            }
        }
        GQL;
    }

    protected function getDefaultUpdateOrderMutation(): string
    {
        return <<<'GQL'
        mutation UpdateOrder($id: ID!, $status: String!) {
            orderUpdate(id: $id, input: { status: $status }) {
                order {
                    id
                    status
                }
            }
        }
        GQL;
    }

    protected function getDefaultUpdateInventoryMutation(): string
    {
        return <<<'GQL'
        mutation UpdateInventory($productId: ID!, $quantity: Int!) {
            productVariantStocksUpdate(
                productId: $productId
                stocks: [{ quantity: $quantity }]
            ) {
                productVariant {
                    id
                }
            }
        }
        GQL;
    }
}
