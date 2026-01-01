<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained()->cascadeOnDelete();
            $table->enum('method', ['cash', 'card', 'transfer', 'check', 'other'])->default('cash');
            $table->decimal('amount', 12, 2);
            $table->string('reference')->nullable(); // número de transacción, cheque, etc.
            $table->text('notes')->nullable();
            $table->timestamp('payment_date')->useCurrent();
            $table->timestamps();
            $table->index('sale_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
