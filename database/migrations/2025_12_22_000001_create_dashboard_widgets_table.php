<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dashboard_widgets', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // e.g., 'sales_today', 'products_low_stock'
            $table->string('name'); // Display name
            $table->string('module'); // ventas, productos, compras, etc.
            $table->text('description')->nullable();
            $table->string('component'); // Frontend component name
            $table->enum('min_plan', ['free', 'basic', 'pro'])->default('free');
            $table->boolean('is_active')->default(true);
            $table->json('metadata')->nullable(); // Extra config (size, refresh interval, etc.)
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dashboard_widgets');
    }
};
