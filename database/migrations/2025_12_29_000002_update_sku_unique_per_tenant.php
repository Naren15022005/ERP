<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateSkuUniquePerTenant extends Migration
{
    public function up()
    {
        Schema::table('products', function (Blueprint $table) {
            // Drop global unique on sku and replace with tenant-scoped unique
            try {
                $table->dropUnique(['sku']);
            } catch (\Exception $e) {
                // ignore if it doesn't exist
            }

            $table->unique(['tenant_id', 'sku']);
        });
    }

    public function down()
    {
        Schema::table('products', function (Blueprint $table) {
            try {
                $table->dropUnique(['tenant_id', 'sku']);
            } catch (\Exception $e) {
                // ignore
            }
            $table->unique('sku');
        });
    }
}
