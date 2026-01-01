<?php

namespace App\Console\Commands;

use App\Jobs\Integrations\SyncAllConnectionsJob;
use Illuminate\Console\Command;

class SyncExternalConnections extends Command
{
    protected $signature = 'integrations:sync {--connection= : ID de conexión específica} {--entity= : Entidad a sincronizar}';
    
    protected $description = 'Sincronizar datos con sistemas externos conectados';

    public function handle(): int
    {
        $this->info('Iniciando sincronización de conexiones externas...');

        if ($connectionId = $this->option('connection')) {
            $this->syncSpecificConnection($connectionId);
        } else {
            SyncAllConnectionsJob::dispatch();
            $this->info('✓ Jobs de sincronización despachados para todas las conexiones activas');
        }

        return self::SUCCESS;
    }

    protected function syncSpecificConnection(int $connectionId): void
    {
        $connection = \App\Models\ExternalConnection::find($connectionId);

        if (!$connection) {
            $this->error("Conexión #{$connectionId} no encontrada");
            return;
        }

        if (!$connection->is_active) {
            $this->warn("Conexión #{$connectionId} está inactiva");
            return;
        }

        $entity = $this->option('entity') ?? 'products';
        
        $jobClass = match ($entity) {
            'products' => \App\Jobs\Integrations\SyncProductsJob::class,
            'orders' => \App\Jobs\Integrations\SyncOrdersJob::class,
            'inventory' => \App\Jobs\Integrations\SyncInventoryJob::class,
            'customers' => \App\Jobs\Integrations\SyncCustomersJob::class,
            default => null,
        };

        if (!$jobClass) {
            $this->error("Entidad '{$entity}' no válida");
            return;
        }

        dispatch(new $jobClass($connection, 'bidirectional'));
        
        $this->info("✓ Sincronización de {$entity} iniciada para conexión: {$connection->connection_name}");
    }
}
