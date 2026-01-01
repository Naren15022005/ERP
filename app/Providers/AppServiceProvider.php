<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Observers\AuditObserver;
use App\Observers\SaleObserver;
use App\Models\User;
use App\Models\Tenant;
use App\Models\Setting;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Registrar observadores de auditoría para modelos críticos
        User::observe(AuditObserver::class);
        Tenant::observe(AuditObserver::class);
        Setting::observe(AuditObserver::class);
        // Observe sales to invalidate reports cache
        Sale::observe(SaleObserver::class);

        // Temporary: log slow queries to help diagnose latency during development
        if ($this->app->environment('local')) {
            DB::listen(function ($query) {
                // $query->time is in milliseconds
                try {
                    $time = $query->time ?? 0;
                    if ($time > 50) { // log queries slower than 50ms
                        // include request context when available to map slow queries to endpoints
                        $context = [];
                        try {
                            if (app()->bound('request')) {
                                $req = request();
                                $context['method'] = $req->method();
                                $context['path'] = $req->path();
                                $context['full_url'] = $req->fullUrl();
                                $context['ip'] = $req->ip();
                                $context['route'] = optional($req->route())->getName();
                                $context['controller'] = optional(optional($req->route())->getAction())['controller'] ?? null;
                            }
                        } catch (\Throwable $_) {
                            // ignore request inspection errors
                        }

                        Log::warning('Slow Query', array_merge([
                            'sql' => $query->sql,
                            'bindings' => $query->bindings,
                            'time_ms' => $time,
                        ], $context));
                    }
                } catch (\Throwable $e) {
                    // avoid breaking boot in case of logging issues
                }
            });
        }
    }
}
