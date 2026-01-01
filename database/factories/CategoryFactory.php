<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition()
    {
        return [
            'tenant_id' => 1,
            'name' => $this->faker->unique()->word(),
            'description' => $this->faker->sentence(),
            'is_active' => true,
        ];
    }
}
