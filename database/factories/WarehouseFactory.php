<?php

namespace Database\Factories;

use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

class WarehouseFactory extends Factory
{
    protected $model = Warehouse::class;

    public function definition()
    {
        return [
            'tenant_id' => 1,
            'name' => $this->faker->company . ' Bodega',
            'code' => strtoupper($this->faker->unique()->lexify('WH??')),
            'address' => $this->faker->address(),
            'is_active' => true,
        ];
    }
}
