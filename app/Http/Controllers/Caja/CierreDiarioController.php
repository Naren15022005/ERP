<?php

namespace App\Http\Controllers\Caja;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\DailyClose;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;

class CierreDiarioController extends Controller
{
    public function index(Request $request)
    {
        $query = DailyClose::query()->withCount('sales')->orderBy('date', 'desc');
        if ($request->has('date')) {
            $query->whereDate('date', $request->get('date'));
        }
        $perPage = $request->get('per_page', 25);
        return response()->json($query->paginate($perPage));
    }

    public function show(DailyClose $dailyClose)
    {
        $dailyClose->load('sales');
        return response()->json($dailyClose);
    }

    /**
     * Create a daily close for given date (or today) by aggregating sales.
     */
    public function store(Request $request)
    {
        $date = $request->get('date', now()->toDateString());

        // Aggregate sales for the date
        $sales = Sale::whereDate('sale_date', $date)->get();

        $total = $sales->sum('total');
        $count = $sales->count();

        // Attempt to compute cash/card breakdown if payments exist
        $cashTotal = 0;
        $cardTotal = 0;
        foreach ($sales as $s) {
            if ($s->payments && $s->payments->count()) {
                foreach ($s->payments as $p) {
                    $method = strtolower($p->method ?? 'other');
                    if (str_contains($method, 'cash')) $cashTotal += $p->amount;
                    elseif (str_contains($method, 'card') || str_contains($method, 'credit') || str_contains($method, 'debit')) $cardTotal += $p->amount;
                    else $cashTotal += $p->amount; // fallback
                }
            }
        }

        // Create DailyClose inside a transaction
        $dailyClose = null;
        DB::transaction(function () use ($date, $total, $count, $cashTotal, $cardTotal, $sales, &$dailyClose, $request) {
            $dailyClose = DailyClose::create([
                'date' => $date,
                'total_sales' => $total,
                'cash_total' => $cashTotal,
                'card_total' => $cardTotal,
                'transactions_count' => $count,
                'created_by' => optional($request->user())->id,
            ]);

            if ($sales->count()) {
                $dailyClose->sales()->attach($sales->pluck('id')->toArray());
            }
        });

        return response()->json($dailyClose->load('sales'));
    }
}
