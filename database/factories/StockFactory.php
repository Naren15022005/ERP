<?php

namespace Database\Factories;

use App\Models\Stock;
use Illuminate\Database\Eloquent\Factories\Factory;

class StockFactory extends Factory
{
    protected $model = Stock::class;

    public function definition()
    {
        return [
            'tenant_id' => 1,
            'product_id' => 1,
            'warehouse_id' => 1,
            'quantity' => $this->faker->randomFloat(4, 0, 1000),
            'reserved' => 0,
            'meta' => null,
        ];
    }
}
