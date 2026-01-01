<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SaleItem>
 */
class SaleItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tenant_id' => \App\Models\Tenant::factory(),
            'sale_id' => \App\Models\Sale::factory(),
            'product_id' => \App\Models\Product::factory(),
            'quantity' => fake()->numberBetween(1, 10),
            'price' => fake()->randomFloat(2, 10, 1000),
            'discount' => 0,
            'subtotal' => function (array $attributes) {
                return ($attributes['price'] ?? 100) * ($attributes['quantity'] ?? 1);
            },
        ];
    }
}
