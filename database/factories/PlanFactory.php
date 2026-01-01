<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

class PlanFactory extends Factory
{
    protected $model = Plan::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->word(),
            'display_name' => $this->faker->words(2, true),
            'description' => $this->faker->sentence(),
            'price_monthly' => $this->faker->randomFloat(2, 0, 500),
            'price_yearly' => $this->faker->randomFloat(2, 0, 5000),
            'limits' => [
                'products' => $this->faker->numberBetween(10, 1000),
                'users' => $this->faker->numberBetween(1, 50),
                'sales_per_month' => $this->faker->numberBetween(100, 10000),
            ],
            'is_active' => true,
        ];
    }
}
