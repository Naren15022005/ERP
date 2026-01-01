<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\TenantModule;

class AddInventoryModulesSeeder extends Seeder
{
    public function run()
    {
        $tenants = Tenant::all();
        foreach ($tenants as $t) {
            $hasProducts = TenantModule::where('tenant_id', $t->id)->where('module_key', 'products')->exists();
            $hasInv = TenantModule::where('tenant_id', $t->id)->where('module_key', 'inventory')->exists();
            if ($hasProducts && !$hasInv) {
                $order = TenantModule::where('tenant_id', $t->id)->max('display_order') ?? 0;
                TenantModule::create([
                    'tenant_id' => $t->id,
                    'module_key' => 'inventory',
                    'enabled' => true,
                    'display_order' => ($order + 1),
                ]);
                if ($this->command) {
                    $this->command->info("Added inventory for tenant {$t->id}");
                }
            }
        }
    }
}
