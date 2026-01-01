<?php

namespace Database\Factories;

use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Factories\Factory;

class StockMovementFactory extends Factory
{
    protected $model = StockMovement::class;

    public function definition()
    {
        return [
            'tenant_id' => 1,
            'product_id' => 1,
            'warehouse_id' => 1,
            'movement_type' => 'in',
            'quantity' => $this->faker->randomFloat(4, 1, 50),
            'before_qty' => null,
            'after_qty' => null,
            'description' => $this->faker->sentence(),
            'created_by' => 1,
        ];
    }
}
