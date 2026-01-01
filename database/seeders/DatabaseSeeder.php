<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Ensure dev tenant exists before creating test user
        $this->call(CreateDevTenantSeeder::class);

        if (! User::where('email', 'test@example.com')->exists()) {
            User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
                'tenant_id' => 1,
            ]);
        }

        // Core seeders
        $this->call(RolesAndPermissionsSeeder::class);
        $this->call(PlansSeeder::class);
        
        // Inventory seed for development
        $this->call(InventorySeeder::class);
        $this->call(StockMovementsSeeder::class);
    }
}
