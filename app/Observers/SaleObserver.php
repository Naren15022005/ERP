<?php

namespace App\Observers;

use App\Models\Sale;
use Illuminate\Support\Facades\Cache;

class SaleObserver
{
    protected function clearTenantReportCache(?int $tenantId)
    {
        if (! $tenantId) return;
        try {
            $store = Cache::getStore();
            if ($store instanceof \Illuminate\Cache\TaggableStore) {
                // Flush all report caches for this tenant
                Cache::tags(["reports:tenant:{$tenantId}"])->flush();
            } else {
                $keys = [
                    "reports:sales:{$tenantId}:0:0",
                    "reports:top-products:{$tenantId}:0:0:10",
                    "reports:sales-by-vendor:{$tenantId}:0:0",
                ];

                foreach ($keys as $k) {
                    try { Cache::forget($k); } catch (\Throwable $e) {}
                }
            }
        } catch (\Throwable $e) {
            // don't let cache issues break the app
        }
    }

    public function created(Sale $sale)
    {
        $this->clearTenantReportCache($sale->tenant_id);
    }

    public function updated(Sale $sale)
    {
        $this->clearTenantReportCache($sale->tenant_id);
    }

    public function deleted(Sale $sale)
    {
        $this->clearTenantReportCache($sale->tenant_id);
    }
}
