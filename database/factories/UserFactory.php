<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function configure(): static
    {
        return $this->afterCreating(function (User $user) {
            // Assign a default tenant admin role for test users when the role exists
            try {
                // Ensure essential permissions and role exist in the test DB
                $permProductCreate = Permission::firstOrCreate(['name' => 'products.create', 'guard_name' => 'web']);
                $permSalesCreate = Permission::firstOrCreate(['name' => 'sales.create', 'guard_name' => 'web']);
                $permSalesView = Permission::firstOrCreate(['name' => 'sales.view', 'guard_name' => 'web']);
                $permCustomerCreate = Permission::firstOrCreate(['name' => 'customers.create', 'guard_name' => 'web']);
                $permCustomerView = Permission::firstOrCreate(['name' => 'customers.view', 'guard_name' => 'web']);

                $role = Role::firstOrCreate(['name' => 'Admin Empresa', 'guard_name' => 'web']);
                // Give essential perms to role (idempotent)
                $role->syncPermissions([$permProductCreate, $permSalesCreate, $permSalesView, $permCustomerCreate, $permCustomerView]);

                $user->assignRole($role);
                // Also assign the essential permissions directly to the user to avoid any
                // caching/role-resolution timing issues in tests.
                $user->givePermissionTo([$permProductCreate, $permSalesCreate, $permSalesView, $permCustomerCreate, $permCustomerView]);
            } catch (\Throwable $e) {
                // ignore in case permissions package not available in some contexts
            }
        });
    }
}
