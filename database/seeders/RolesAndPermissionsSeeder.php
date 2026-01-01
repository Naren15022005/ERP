<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'Super Admin',
            'Admin Empresa',
            'Gerente',
            'Vendedor',
            'Almacenero',
            'Contador',
        ];

        $permissions = [
            'users.view', 'users.create', 'users.update', 'users.delete',
            'products.view', 'products.create', 'products.update', 'products.delete',
            'sales.view', 'sales.create', 'sales.update', 'sales.delete',
            'customers.view', 'customers.create', 'customers.update', 'customers.delete',
            'reports.view', 'reports.export',
            'settings.update',
            'view audit logs',
            'manage users', // convenience alias used in controllers
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        $roleModels = [];
        foreach ($roles as $roleName) {
            // Normalize role name casing to keep consistency
            $normalized = $roleName;
            $roleModels[$roleName] = Role::firstOrCreate(['name' => $normalized, 'guard_name' => 'web']);
        }

        $allPerms = Permission::all();

        // Assign permissions per role (idempotent)
        $roleModels['Super Admin']->syncPermissions($allPerms);
        $roleModels['Admin Empresa']->syncPermissions($allPerms->filter(function ($p) {
            return $p->name !== 'reports.export';
        }));
        $roleModels['Gerente']->syncPermissions(Permission::whereIn('name', ['reports.view', 'reports.export', 'sales.view'])->get());
        $roleModels['Vendedor']->syncPermissions(Permission::whereIn('name', ['sales.create', 'sales.view'])->get());
        $roleModels['Almacenero']->syncPermissions(Permission::whereIn('name', ['products.view', 'products.create', 'products.update'])->get());
        $roleModels['Contador']->syncPermissions(Permission::whereIn('name', ['sales.view', 'reports.view'])->get());

        // Create a demo tenant and initial admin user if none exists (idempotent)
        try {
            $tenantModel = \App\Models\Tenant::firstOrCreate([
                'slug' => 'demo',
            ], [
                'name' => 'Demo Tenant',
                'domain' => null,
                'config' => null,
                'is_active' => true,
            ]);

            $adminEmail = env('DEMO_ADMIN_EMAIL', 'admin@demo.local');
            $admin = \App\Models\User::where('email', $adminEmail)->first();
            if (! $admin) {
                $admin = \App\Models\User::create([
                    'name' => 'Demo Super Admin',
                    'email' => $adminEmail,
                    'email_verified_at' => now(),
                    'password' => \Illuminate\Support\Facades\Hash::make(env('DEMO_ADMIN_PASSWORD', 'password')),
                    'tenant_id' => $tenantModel->id,
                ]);
            } else {
                // ensure tenant set
                if (! $admin->tenant_id) {
                    $admin->tenant_id = $tenantModel->id;
                    $admin->save();
                }
            }

            // Assign Super Admin role to the demo admin
            if (! $admin->hasRole('Super Admin')) {
                $admin->assignRole($roleModels['Super Admin']);
            }
        } catch (\Throwable $e) {
            // ignore seeding tenant/admin when models are not available (e.g., partial setup)
        }
    }
}
