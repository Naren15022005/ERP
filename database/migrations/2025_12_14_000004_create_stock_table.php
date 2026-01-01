<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStockTable extends Migration
{
    public function up()
    {
        Schema::create('stock', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity', 14, 4)->default(0);
            $table->decimal('reserved', 14, 4)->default(0);
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'product_id', 'warehouse_id'], 'stock_tenant_product_warehouse_unique');
        });
    }

    public function down()
    {
        Schema::dropIfExists('stock');
    }
}
