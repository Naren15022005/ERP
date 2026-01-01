<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('external_connection_id')->constrained()->onDelete('cascade');
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            
            // Tipo de sincronización
            $table->enum('sync_type', ['manual', 'scheduled', 'webhook'])->default('manual');
            
            // Entidad sincronizada: 'products', 'orders', 'inventory', 'customers'
            $table->string('entity_type', 50);
            
            // Dirección: 'inbound' (externo → ERP) o 'outbound' (ERP → externo)
            $table->enum('direction', ['inbound', 'outbound']);
            
            // Estado
            $table->enum('status', ['pending', 'processing', 'success', 'failed', 'partial'])->default('pending');
            
            // Resumen de la operación
            $table->integer('records_processed')->default(0);
            $table->integer('records_success')->default(0);
            $table->integer('records_failed')->default(0);
            
            // Detalles y errores
            $table->json('summary')->nullable(); // Resumen estructurado de la operación
            $table->text('error_message')->nullable();
            $table->json('error_details')->nullable(); // Stack trace, contexto
            
            // Tiempos
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            
            $table->timestamps();
            
            $table->index(['external_connection_id', 'created_at']);
            $table->index(['tenant_id', 'status']);
            $table->index(['entity_type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sync_logs');
    }
};
