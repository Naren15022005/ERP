<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Customer;


/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Sale>
 */
class SaleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Ensure tenant exists
        $tenant = Tenant::first() ?? Tenant::factory()->create();

        // Ensure there's a user for that tenant
        $user = User::where('tenant_id', $tenant->id)->first() ?? User::factory()->create(['tenant_id' => $tenant->id]);

        // Ensure there's a customer for that tenant
        $customer = Customer::where('tenant_id', $tenant->id)->first() ?? Customer::factory()->create(['tenant_id' => $tenant->id]);

        $subtotal = $this->faker->randomFloat(2, 10, 1000);
        $tax = 0.00;
        $discount = 0.00;
        $total = $subtotal + $tax - $discount;

        return [
            'tenant_id' => $tenant->id,
            'customer_id' => $customer->id,
            'user_id' => $user->id,
            'invoice_number' => 'INV-' . strtoupper($this->faker->bothify('??###??###')),
            'subtotal' => $subtotal,
            'tax' => $tax,
            'discount' => $discount,
            'total' => $total,
            'status' => \App\Enums\SaleStatus::CONFIRMED,
            'notes' => null,
        ];
    }
}
