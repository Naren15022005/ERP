<?php

namespace App\Jobs\Integrations;

use App\Models\ExternalConnection;
use App\Models\SyncLog;
use App\Models\Product;
use App\Models\ExternalEntityMapping;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SyncProductsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300; // 5 minutos
    public int $tries = 3;

    public function __construct(
        protected ExternalConnection $connection,
        protected string $direction = 'inbound', // 'inbound' o 'outbound'
        protected array $filters = []
    ) {}

    public function handle(): void
    {
        $syncLog = SyncLog::create([
            'external_connection_id' => $this->connection->id,
            'tenant_id' => $this->connection->tenant_id,
            'sync_type' => 'scheduled',
            'entity_type' => 'products',
            'direction' => $this->direction,
        ]);

        $syncLog->markStarted();

        try {
            if ($this->direction === 'inbound') {
                $result = $this->syncInbound();
            } else {
                $result = $this->syncOutbound();
            }

            $syncLog->markSuccess(
                $result['processed'],
                $result['success'],
                $result['failed'],
                $result['summary']
            );

            $this->connection->markSynced();

        } catch (\Exception $e) {
            $syncLog->markFailed($e->getMessage(), [
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString(),
            ]);

            Log::error('Error en sincronización de productos', [
                'connection_id' => $this->connection->id,
                'direction' => $this->direction,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    protected function syncInbound(): array
    {
        $driver = $this->connection->getDriver();
        $externalProducts = $driver->fetchProducts($this->filters);

        $processed = 0;
        $success = 0;
        $failed = 0;
        $summary = [
            'created' => 0,
            'updated' => 0,
            'skipped' => 0,
            'errors' => [],
        ];

        foreach ($externalProducts as $externalProduct) {
            $processed++;

            try {
                DB::transaction(function () use ($externalProduct, &$success, &$summary) {
                    $externalId = $this->getExternalId($externalProduct);
                    
                    // Buscar mapping existente
                    $mapping = ExternalEntityMapping::where('external_connection_id', $this->connection->id)
                        ->where('entity_type', 'product')
                        ->where('external_id', $externalId)
                        ->first();

                    // Verificar si cambió
                    if ($mapping && !$mapping->hasChanged($externalProduct)) {
                        $summary['skipped']++;
                        $success++;
                        return;
                    }

                    // Mapear datos
                    $productData = $this->mapExternalToLocal($externalProduct);

                    // Crear o actualizar producto
                    if ($mapping && $mapping->localEntity) {
                        // Actualizar
                        $mapping->localEntity->update($productData);
                        $summary['updated']++;
                    } else {
                        // Crear
                        // Create product assigning attributes explicitly to avoid mass-assignment of SKU
                        $product = new Product();
                        $product->tenant_id = $this->connection->tenant_id;
                        $product->name = $productData['name'] ?? 'Sin nombre';
                        $product->description = $productData['description'] ?? null;
                        $product->price = $productData['price'] ?? 0;
                        $product->cost = $productData['cost'] ?? null;
                        $product->barcode = $productData['barcode'] ?? null;
                        $product->stock_min = $productData['stock_min'] ?? 0;
                        $product->is_active = $productData['is_active'] ?? true;

                        // If external SKU provided, try to use it but ensure uniqueness per tenant
                        if (!empty($productData['sku'])) {
                            $candidate = $productData['sku'];
                            $suffix = 0;
                            while (Product::where('tenant_id', $this->connection->tenant_id)->where('sku', $candidate)->exists()) {
                                $suffix++;
                                $candidate = $productData['sku'] . '-EXT' . $suffix;
                                if ($suffix > 10) {
                                    $candidate = Product::generateSku($this->connection->tenant_id);
                                    break;
                                }
                            }
                            $product->sku = $candidate;
                        } else {
                            // Generate SKU using backend helper
                            $product->sku = Product::generateSku($this->connection->tenant_id);
                        }

                        $product->save();

                        // Crear mapping
                        $mapping = ExternalEntityMapping::create([
                            'external_connection_id' => $this->connection->id,
                            'tenant_id' => $this->connection->tenant_id,
                            'entity_type' => 'product',
                            'external_id' => $externalId,
                            'local_entity_type' => Product::class,
                            'local_entity_id' => $product->id,
                            'external_data' => $externalProduct,
                        ]);

                        $summary['created']++;
                    }

                    // Actualizar hash y timestamp
                    $mapping->updateHash($externalProduct);
                    $success++;
                });

            } catch (\Exception $e) {
                $failed++;
                $summary['errors'][] = [
                    'external_id' => $this->getExternalId($externalProduct),
                    'error' => $e->getMessage(),
                ];
                Log::warning('Error al sincronizar producto', [
                    'external_id' => $this->getExternalId($externalProduct),
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return compact('processed', 'success', 'failed', 'summary');
    }

    protected function syncOutbound(): array
    {
        $driver = $this->connection->getDriver();

        // Obtener productos locales que necesitan sincronización
        $products = Product::where('tenant_id', $this->connection->tenant_id)
            ->where('updated_at', '>', $this->connection->last_sync_at ?? now()->subDays(7))
            ->get();

        $processed = 0;
        $success = 0;
        $failed = 0;
        $summary = [
            'created' => 0,
            'updated' => 0,
            'errors' => [],
        ];

        foreach ($products as $product) {
            $processed++;

            try {
                // Buscar mapping
                $mapping = ExternalEntityMapping::where('external_connection_id', $this->connection->id)
                    ->where('local_entity_type', Product::class)
                    ->where('local_entity_id', $product->id)
                    ->first();

                $productData = $this->mapLocalToExternal($product);
                
                if ($mapping) {
                    $productData['external_id'] = $mapping->external_id;
                }

                // Push al sistema externo
                $externalProduct = $driver->pushProduct($productData);
                $externalId = $this->getExternalId($externalProduct);

                // Crear o actualizar mapping
                if ($mapping) {
                    $mapping->update([
                        'external_data' => $externalProduct,
                    ]);
                    $mapping->updateHash($externalProduct);
                    $summary['updated']++;
                } else {
                    ExternalEntityMapping::create([
                        'external_connection_id' => $this->connection->id,
                        'tenant_id' => $this->connection->tenant_id,
                        'entity_type' => 'product',
                        'external_id' => $externalId,
                        'local_entity_type' => Product::class,
                        'local_entity_id' => $product->id,
                        'external_data' => $externalProduct,
                        'content_hash' => hash('sha256', json_encode($externalProduct)),
                    ]);
                    $summary['created']++;
                }

                $success++;

            } catch (\Exception $e) {
                $failed++;
                $summary['errors'][] = [
                    'product_id' => $product->id,
                    'error' => $e->getMessage(),
                ];
                Log::warning('Error al enviar producto', [
                    'product_id' => $product->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return compact('processed', 'success', 'failed', 'summary');
    }

    protected function getExternalId(array $externalProduct): string
    {
        // Cada plataforma usa diferentes campos para ID
        return (string)(
            $externalProduct['id'] 
            ?? $externalProduct['product_id'] 
            ?? $externalProduct['external_id'] 
            ?? ''
        );
    }

    protected function mapExternalToLocal(array $externalProduct): array
    {
        // Mapeo básico - puede personalizarse por configuración
        $config = $this->connection->config['field_mapping'] ?? [];

        return [
            'name' => $externalProduct[$config['name'] ?? 'name'] ?? 'Sin nombre',
            'description' => $externalProduct[$config['description'] ?? 'description'] ?? null,
            'price' => (float)($externalProduct[$config['price'] ?? 'price'] ?? 0),
            'cost' => (float)($externalProduct[$config['cost'] ?? 'cost'] ?? 0),
            'sku' => $externalProduct[$config['sku'] ?? 'sku'] ?? null,
            'barcode' => $externalProduct[$config['barcode'] ?? 'barcode'] ?? null,
            'is_active' => (bool)($externalProduct[$config['is_active'] ?? 'status'] ?? true),
        ];
    }

    protected function mapLocalToExternal(Product $product): array
    {
        $config = $this->connection->config['field_mapping'] ?? [];

        return [
            'name' => $product->name,
            'description' => $product->description,
            'price' => $product->price,
            'cost' => $product->cost,
            'sku' => $product->sku,
            'barcode' => $product->barcode,
            'stock' => $product->stock_quantity ?? 0,
        ];
    }
}
