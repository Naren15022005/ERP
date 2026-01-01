<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = [
            'products',
            'categories',
            'customers',
            'sales',
            'sale_items',
            'payments',
            'stock',
            'stock_movements',
            'warehouses',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $table) {
                    if (!Schema::hasColumn($table->getTable(), 'created_by')) {
                        $table->foreignId('created_by')->nullable()->after('id')->constrained('users')->nullOnDelete();
                    }
                    if (!Schema::hasColumn($table->getTable(), 'updated_by')) {
                        $table->foreignId('updated_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
                    }
                });
            }
        }
    }

    public function down(): void
    {
        $tables = [
            'products',
            'categories',
            'customers',
            'sales',
            'sale_items',
            'payments',
            'stock',
            'stock_movements',
            'warehouses',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $table) {
                    if (Schema::hasColumn($table->getTable(), 'created_by')) {
                        $table->dropForeign(['created_by']);
                        $table->dropColumn('created_by');
                    }
                    if (Schema::hasColumn($table->getTable(), 'updated_by')) {
                        $table->dropForeign(['updated_by']);
                        $table->dropColumn('updated_by');
                    }
                });
            }
        }
    }
};
