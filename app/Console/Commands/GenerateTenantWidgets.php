<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\DashboardService;
use Illuminate\Console\Command;

class GenerateTenantWidgets extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tenant:generate-widgets {tenant_id? : The ID of the tenant (optional, generates for all if omitted)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate default dashboard widgets for tenant(s)';

    /**
     * Execute the console command.
     */
    public function handle(DashboardService $service): int
    {
        $tenantId = $this->argument('tenant_id');

        if ($tenantId) {
            $tenant = Tenant::find($tenantId);
            if (!$tenant) {
                $this->error("Tenant with ID {$tenantId} not found.");
                return 1;
            }

            $this->info("Generating widgets for tenant: {$tenant->name}");
            $service->generateDefaultWidgets($tenant);
            $this->info("✓ Widgets generated successfully.");
        } else {
            $tenants = Tenant::all();
            $this->info("Generating widgets for " . $tenants->count() . " tenant(s)...");

            foreach ($tenants as $tenant) {
                $this->info("Processing tenant: {$tenant->name} (ID: {$tenant->id})");
                $service->generateDefaultWidgets($tenant);
            }

            $this->info("✓ All tenant widgets generated successfully.");
        }

        return 0;
    }
}
