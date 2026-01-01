<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function salesByPeriod(Request $request)
    {
        $from = $request->query('date_from');
        $to = $request->query('date_to');
        $tenantId = $request->user()?->tenant_id ?? $request->query('tenant_id');

        $format = strtolower($request->query('format', 'json'));

        $cacheKey = 'reports:sales:'.($tenantId?:'all').':'.($from?:'0').':'.($to?:'0');

        $tags = ['reports:type:sales'];
        if ($tenantId) $tags[] = "reports:tenant:{$tenantId}";

        if (Cache::getStore() instanceof \Illuminate\Cache\TaggableStore) {
            $data = Cache::tags($tags)->remember($cacheKey, 600, function() use ($from, $to, $tenantId) {
                $query = Sale::query()->select([
                    DB::raw("DATE(sale_date) as date"),
                    DB::raw('COUNT(*) as sales_count'),
                    DB::raw('SUM(total) as total_amount')
                ]);

                if ($tenantId) $query->where('tenant_id', $tenantId);
                if ($from) $query->whereDate('sale_date', '>=', $from);
                if ($to) $query->whereDate('sale_date', '<=', $to);

                return $query->groupBy(DB::raw('DATE(sale_date)'))->orderBy('date')->get();
            });
        } else {
            $data = Cache::remember($cacheKey, 600, function() use ($from, $to, $tenantId) {
                $query = Sale::query()->select([
                    DB::raw("DATE(sale_date) as date"),
                    DB::raw('COUNT(*) as sales_count'),
                    DB::raw('SUM(total) as total_amount')
                ]);

                if ($tenantId) $query->where('tenant_id', $tenantId);
                if ($from) $query->whereDate('sale_date', '>=', $from);
                if ($to) $query->whereDate('sale_date', '<=', $to);

                return $query->groupBy(DB::raw('DATE(sale_date)'))->orderBy('date')->get();
            });
        }

        if ($format === 'excel') {
            $rows = $data->map(function($r){
                return [
                    'date' => $r->date,
                    'sales_count' => $r->sales_count,
                    'total_amount' => $r->total_amount,
                ];
            })->toArray();

            return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\SalesReportExport($rows), 'sales_report.xlsx');
        }

        if ($format === 'pdf') {
            $html = '<h2>Sales report</h2><table border="1" cellpadding="4"><thead><tr><th>Date</th><th>Sales</th><th>Total</th></tr></thead><tbody>';
            foreach ($data as $r) {
                $html .= "<tr><td>{$r->date}</td><td>{$r->sales_count}</td><td>{$r->total_amount}</td></tr>";
            }
            $html .= '</tbody></table>';

            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)->setPaper('a4','portrait');
            return response($pdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="sales_report.pdf"'
            ]);
        }

        return response()->json($data);
    }

    public function topProducts(Request $request)
    {
        $from = $request->query('date_from');
        $to = $request->query('date_to');
        $limit = (int) $request->query('limit', 10);
        $tenantId = $request->user()?->tenant_id ?? $request->query('tenant_id');

        $cacheKey = 'reports:top-products:'.($tenantId?:'all').':'.($from?:'0').':'.($to?:'0').':'.$limit;

        $tags = ['reports:type:top-products'];
        if ($tenantId) $tags[] = "reports:tenant:{$tenantId}";

        if (Cache::getStore() instanceof \Illuminate\Cache\TaggableStore) {
            $data = Cache::tags($tags)->remember($cacheKey, 600, function() use ($from, $to, $limit, $tenantId) {
                $q = SaleItem::query()
                    ->select('product_id', DB::raw('SUM(quantity) as qty_sold'), DB::raw('SUM(sale_items.subtotal) as revenue'))
                    ->join('sales', 'sale_items.sale_id', '=', 'sales.id');

                if ($tenantId) $q->where('sales.tenant_id', $tenantId);
                if ($from) $q->whereDate('sales.sale_date', '>=', $from);
                if ($to) $q->whereDate('sales.sale_date', '<=', $to);

                $q->groupBy('product_id')->orderByDesc('qty_sold')->limit($limit);

                $rows = $q->get();

                // attach product info
                $productIds = $rows->pluck('product_id')->all();
                $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

                return $rows->map(function($r) use ($products) {
                    return [
                        'product_id' => $r->product_id,
                        'name' => $products[$r->product_id]->name ?? null,
                        'qty_sold' => (int) $r->qty_sold,
                        'revenue' => (float) $r->revenue,
                    ];
                });
            });
        } else {
            $data = Cache::remember($cacheKey, 600, function() use ($from, $to, $limit, $tenantId) {
                $q = SaleItem::query()
                    ->select('product_id', DB::raw('SUM(quantity) as qty_sold'), DB::raw('SUM(sale_items.subtotal) as revenue'))
                    ->join('sales', 'sale_items.sale_id', '=', 'sales.id');

                if ($tenantId) $q->where('sales.tenant_id', $tenantId);
                if ($from) $q->whereDate('sales.sale_date', '>=', $from);
                if ($to) $q->whereDate('sales.sale_date', '<=', $to);

                $q->groupBy('product_id')->orderByDesc('qty_sold')->limit($limit);

                $rows = $q->get();

                // attach product info
                $productIds = $rows->pluck('product_id')->all();
                $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

                return $rows->map(function($r) use ($products) {
                    return [
                        'product_id' => $r->product_id,
                        'name' => $products[$r->product_id]->name ?? null,
                        'qty_sold' => (int) $r->qty_sold,
                        'revenue' => (float) $r->revenue,
                    ];
                });
            });
        }

        return response()->json($data);
    }

    public function salesByVendor(Request $request)
    {
        $from = $request->query('date_from');
        $to = $request->query('date_to');
        $tenantId = $request->user()?->tenant_id ?? $request->query('tenant_id');

        $cacheKey = 'reports:sales-by-vendor:'.($tenantId?:'all').':'.($from?:'0').':'.($to?:'0');

        $tags = ['reports:type:sales-by-vendor'];
        if ($tenantId) $tags[] = "reports:tenant:{$tenantId}";

        if (Cache::getStore() instanceof \Illuminate\Cache\TaggableStore) {
            $data = Cache::tags($tags)->remember($cacheKey, 600, function() use ($from, $to, $tenantId) {
                $q = Sale::query()
                    ->select('user_id', DB::raw('COUNT(*) as sales_count'), DB::raw('SUM(total) as total_amount'));

                if ($tenantId) $q->where('tenant_id', $tenantId);
                if ($from) $q->whereDate('sale_date', '>=', $from);
                if ($to) $q->whereDate('sale_date', '<=', $to);

                $rows = $q->groupBy('user_id')->orderByDesc('total_amount')->get();

                $userIds = $rows->pluck('user_id')->all();
                $users = \App\Models\User::whereIn('id', $userIds)->get()->keyBy('id');

                return $rows->map(function($r) use ($users) {
                    return [
                        'user_id' => $r->user_id,
                        'name' => $users[$r->user_id]->name ?? null,
                        'sales_count' => (int) $r->sales_count,
                        'total_amount' => (float) $r->total_amount,
                    ];
                });
            });
        } else {
            $data = Cache::remember($cacheKey, 600, function() use ($from, $to, $tenantId) {
                $q = Sale::query()
                    ->select('user_id', DB::raw('COUNT(*) as sales_count'), DB::raw('SUM(total) as total_amount'));

                if ($tenantId) $q->where('tenant_id', $tenantId);
                if ($from) $q->whereDate('sale_date', '>=', $from);
                if ($to) $q->whereDate('sale_date', '<=', $to);

                $rows = $q->groupBy('user_id')->orderByDesc('total_amount')->get();

                $userIds = $rows->pluck('user_id')->all();
                $users = \App\Models\User::whereIn('id', $userIds)->get()->keyBy('id');

                return $rows->map(function($r) use ($users) {
                    return [
                        'user_id' => $r->user_id,
                        'name' => $users[$r->user_id]->name ?? null,
                        'sales_count' => (int) $r->sales_count,
                        'total_amount' => (float) $r->total_amount,
                    ];
                });
            });
        }

        return response()->json($data);
    }
}

