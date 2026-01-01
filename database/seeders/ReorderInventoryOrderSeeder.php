<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\DB;
use App\Models\TenantModule;

class ReorderInventoryOrderSeeder extends Seeder
{
    public function run()
    {
        $tenants = TenantModule::select('tenant_id')->distinct()->pluck('tenant_id');
        foreach ($tenants as $tenantId) {
            DB::transaction(function() use($tenantId) {
                $product = TenantModule::where('tenant_id', $tenantId)->where('module_key', 'products')->first();
                $inventory = TenantModule::where('tenant_id', $tenantId)->where('module_key', 'inventory')->first();
                if (!$product || !$inventory) return;

                $prodOrder = (int) ($product->display_order ?? 0);
                $desired = $prodOrder + 1;

                // If inventory already at desired spot, nothing to do
                if (($inventory->display_order ?? 0) == $desired) return;

                // Shift up modules with order >= desired (except inventory) by +1 to make room
                TenantModule::where('tenant_id', $tenantId)
                    ->where('module_key', '!=', 'inventory')
                    ->where(function($q) use($desired) {
                        $q->whereNotNull('display_order')->where('display_order', '>=', $desired);
                    })->increment('display_order');

                // Set inventory order
                $inventory->display_order = $desired;
                $inventory->save();

                if ($this->command) {
                    $this->command->info("Tenant {$tenantId}: moved inventory to position {$desired}");
                }
            });
        }
    }
}
