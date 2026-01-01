<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Customer;
use App\Models\User;
use App\Policies\ProductPolicy;
use App\Policies\SalePolicy;
use App\Policies\CustomerPolicy;
use App\Policies\UserPolicy;
use App\Policies\InvoicePolicy;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Product::class => ProductPolicy::class,
        Sale::class => SalePolicy::class,
        Customer::class => CustomerPolicy::class,
        User::class => UserPolicy::class,
        Sale::class => InvoicePolicy::class,
    ];

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->registerPolicies();

        // Additional gate examples (kept minimal)
        Gate::define('manage-products', function ($user) {
            return $user->can('products.manage');
        });
    }
}
