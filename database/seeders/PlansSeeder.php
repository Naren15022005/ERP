<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlansSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'starter',
                'display_name' => 'Plan Starter',
                'description' => 'Ideal para pequeños negocios que están comenzando',
                'price_monthly' => 29.99,
                'price_yearly' => 299.99,
                'limits' => [
                    'products' => 100,
                    'users' => 3,
                    'sales_per_month' => 500,
                    'customers' => 200,
                    'warehouses' => 1,
                ],
                'is_active' => true,
            ],
            [
                'name' => 'professional',
                'display_name' => 'Plan Professional',
                'description' => 'Para negocios en crecimiento con necesidades avanzadas',
                'price_monthly' => 79.99,
                'price_yearly' => 799.99,
                'limits' => [
                    'products' => 1000,
                    'users' => 10,
                    'sales_per_month' => 5000,
                    'customers' => 2000,
                    'warehouses' => 5,
                ],
                'is_active' => true,
            ],
            [
                'name' => 'enterprise',
                'display_name' => 'Plan Enterprise',
                'description' => 'Sin límites para empresas grandes',
                'price_monthly' => 199.99,
                'price_yearly' => 1999.99,
                'limits' => [
                    'products' => -1, // unlimited
                    'users' => -1,
                    'sales_per_month' => -1,
                    'customers' => -1,
                    'warehouses' => -1,
                ],
                'is_active' => true,
            ],
        ];

        foreach ($plans as $planData) {
            Plan::updateOrCreate(
                ['name' => $planData['name']],
                $planData
            );
        }
    }
}
