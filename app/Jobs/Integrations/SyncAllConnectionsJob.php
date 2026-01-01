<?php

namespace App\Jobs\Integrations;

use App\Models\ExternalConnection;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SyncAllConnectionsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        // Obtener todas las conexiones que necesitan sincronización
        $connections = ExternalConnection::needingSync()->get();

        foreach ($connections as $connection) {
            $entities = $connection->sync_entities ?? ['products'];

            foreach ($entities as $entity) {
                $this->dispatchSyncJob($connection, $entity);
            }
        }
    }

    protected function dispatchSyncJob(ExternalConnection $connection, string $entity): void
    {
        $jobClass = match ($entity) {
            'products' => SyncProductsJob::class,
            'orders' => SyncOrdersJob::class,
            'inventory' => SyncInventoryJob::class,
            'customers' => SyncCustomersJob::class,
            default => null,
        };

        if (!$jobClass) {
            return;
        }

        // Dispatch bidireccional si está configurado
        if (in_array($connection->sync_direction, ['bidirectional', 'pull'])) {
            dispatch(new $jobClass($connection, 'inbound'));
        }

        if (in_array($connection->sync_direction, ['bidirectional', 'push'])) {
            dispatch(new $jobClass($connection, 'outbound'));
        }
    }
}
