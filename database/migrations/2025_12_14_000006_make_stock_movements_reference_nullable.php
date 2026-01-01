<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class MakeStockMovementsReferenceNullable extends Migration
{
    public function up()
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            if (Schema::hasColumn('stock_movements', 'reference_id')) {
                $table->unsignedBigInteger('reference_id')->nullable()->change();
            }
            if (Schema::hasColumn('stock_movements', 'reference_type')) {
                $table->string('reference_type')->nullable()->change();
            }
        });
    }

    public function down()
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            if (Schema::hasColumn('stock_movements', 'reference_id')) {
                $table->unsignedBigInteger('reference_id')->nullable(false)->change();
            }
            if (Schema::hasColumn('stock_movements', 'reference_type')) {
                $table->string('reference_type')->nullable(false)->change();
            }
        });
    }
}
