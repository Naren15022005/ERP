<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Tenant;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Customer>
 */
class CustomerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Ensure there is a tenant to associate
        $tenant = Tenant::first();
        if (! $tenant) {
            $tenant = Tenant::create([
                'name' => $this->faker->company(),
                'slug' => $this->faker->unique()->slug(),
            ]);
        }

        return [
            'tenant_id' => $tenant->id,
            'name' => $this->faker->company(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'tax_id' => $this->faker->optional()->bothify('??########'),
            'address' => $this->faker->optional()->address(),
            'city' => $this->faker->city(),
            'state' => $this->faker->state(),
            'country' => $this->faker->country(),
            'zip_code' => $this->faker->postcode(),
            'notes' => $this->faker->optional()->sentence(),
            'is_active' => true,
        ];
    }
}
