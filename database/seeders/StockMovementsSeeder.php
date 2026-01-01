<?php

namespace Database\Seeders;

use App\Models\StockMovement;
use App\Models\Stock;
use Illuminate\Database\Seeder;

class StockMovementsSeeder extends Seeder
{
    public function run()
    {
        // Create movements for existing stock rows
        $stocks = Stock::query()->limit(50)->get();
        foreach ($stocks as $s) {
            StockMovement::factory()->create([
                'tenant_id' => $s->tenant_id,
                'product_id' => $s->product_id,
                'warehouse_id' => $s->warehouse_id,
                'movement_type' => 'in',
                'quantity' => min(10, max(1, round($s->quantity * 0.1))),
                'before_qty' => max(0, $s->quantity - 5),
                'after_qty' => $s->quantity,
                'created_by' => null,
            ]);
        }
    }
}
