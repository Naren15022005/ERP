<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardWidgetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $widgets = config('dashboard.widgets');
        $now = Carbon::now();

        $data = [];
        foreach ($widgets as $key => $config) {
            $data[] = [
                'key' => $key,
                'name' => $config['name'],
                'module' => $config['module'],
                'description' => $config['description'],
                'component' => $config['component'],
                'min_plan' => $config['min_plan'],
                'is_active' => true,
                'metadata' => json_encode($config['metadata'] ?? []),
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        DB::table('dashboard_widgets')->insert($data);
        
        $this->command->info('Dashboard widgets seeded successfully: ' . count($data) . ' widgets');
    }
}
