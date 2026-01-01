<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('daily_close_sales', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('daily_close_id')->index();
            $table->unsignedBigInteger('sale_id')->index();
            $table->timestamps();

            $table->foreign('daily_close_id')->references('id')->on('daily_closes')->onDelete('cascade');
            $table->foreign('sale_id')->references('id')->on('sales')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_close_sales');
    }
};
