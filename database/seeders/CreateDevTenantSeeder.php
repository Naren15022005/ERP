<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreateDevTenantSeeder extends Seeder
{
    public function run()
    {
        // Insert a tenant with id=1 if none exists
        $exists = DB::table('tenants')->where('id', 1)->exists();
        if (! $exists) {
            DB::table('tenants')->insert([
                'id' => 1,
                'name' => 'Default Tenant',
                'slug' => 'default',
                'domain' => null,
                'config' => json_encode([]),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Ensure default widgets are generated for the dev tenant (id=1)
        try {
            $tenant = \App\Models\Tenant::find(1);
            if ($tenant) {
                app(\App\Services\DashboardService::class)->generateDefaultWidgets($tenant);
            }
        } catch (\Throwable $e) {
            \Log::warning('Failed to generate default widgets for dev tenant: ' . $e->getMessage());
        }
    }
}
