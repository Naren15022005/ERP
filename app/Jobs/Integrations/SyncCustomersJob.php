<?php

namespace App\Jobs\Integrations;

use App\Models\ExternalConnection;
use App\Models\SyncLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SyncCustomersJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;
    public int $tries = 3;

    public function __construct(
        protected ExternalConnection $connection,
        protected string $direction = 'inbound',
        protected array $filters = []
    ) {}

    public function handle(): void
    {
        $syncLog = SyncLog::create([
            'external_connection_id' => $this->connection->id,
            'tenant_id' => $this->connection->tenant_id,
            'sync_type' => 'scheduled',
            'entity_type' => 'customers',
            'direction' => $this->direction,
        ]);

        $syncLog->markStarted();

        try {
            // TODO: Implementar sincronización de clientes
            
            $syncLog->markSuccess(0, 0, 0, ['message' => 'Implementación pendiente']);
        } catch (\Exception $e) {
            $syncLog->markFailed($e->getMessage());
            throw $e;
        }
    }
}
