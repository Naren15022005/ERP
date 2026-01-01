<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // 'starter', 'professional', 'enterprise'
            $table->string('display_name');
            $table->text('description')->nullable();
            $table->decimal('price_monthly', 10, 2)->default(0);
            $table->decimal('price_yearly', 10, 2)->default(0);
            $table->json('limits')->nullable(); // {products: 100, users: 5, sales_per_month: 1000}
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('tenant_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained()->cascadeOnDelete();
            $table->json('limits_override')->nullable(); // override para este tenant específico
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['tenant_id', 'plan_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_plans');
        Schema::dropIfExists('plans');
    }
};
