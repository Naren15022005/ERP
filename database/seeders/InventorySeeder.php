<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Stock;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;

class InventorySeeder extends Seeder
{
    public function run()
    {
        // Create a few categories and warehouses
        $categories = Category::factory()->count(5)->create();
        $warehouses = Warehouse::factory()->count(2)->create();

        // Create some products and initial stock entries
        Product::factory()->count(20)->create()->each(function (Product $p) use ($warehouses, $categories) {
            // assign category randomly
            $p->category_id = $categories->random()->id;
            $p->save();

            // create stock in each warehouse
            foreach ($warehouses as $w) {
                Stock::factory()->create([
                    'product_id' => $p->id,
                    'warehouse_id' => $w->id,
                    'quantity' => rand(0, 200),
                ]);
            }
        });
    }
}
