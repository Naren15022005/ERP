<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStockMovementsTable extends Migration
{
    public function up()
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('warehouse_id')->nullable()->constrained()->nullOnDelete();
            $table->string('movement_type', 32); // in, out, adjustment, transfer, etc.
            $table->decimal('quantity', 14, 4);
            $table->decimal('before_qty', 14, 4)->nullable();
            $table->decimal('after_qty', 14, 4)->nullable();
            $table->morphs('reference'); // referenceable model (invoice, purchase, transfer...)
            $table->text('description')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['tenant_id', 'product_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('stock_movements');
    }
}
