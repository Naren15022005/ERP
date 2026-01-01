<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition()
    {
        return [
            'tenant_id' => 1,
            'category_id' => null,
            'sku' => strtoupper($this->faker->unique()->bothify('PRD-####')),
            'barcode' => $this->faker->optional()->ean13(),
            'name' => $this->faker->words(2, true),
            'description' => $this->faker->sentence(),
            'price' => $this->faker->randomFloat(2, 1, 1000),
            'cost' => $this->faker->randomFloat(2, 0.5, 800),
            'stock_min' => $this->faker->numberBetween(0, 10),
            'custom_fields' => null,
            'is_active' => true,
        ];
    }
}
