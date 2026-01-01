<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('external_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->onDelete('cascade');
            
            // Tipo de sistema externo: 'woocommerce', 'shopify', 'magento', 'custom_api', etc.
            $table->string('platform_type', 50);
            
            // Nombre descriptivo dado por el usuario
            $table->string('connection_name');
            
            // URL base de la API del sistema externo
            $table->string('api_url');
            
            // Credenciales encriptadas (API key, tokens, oauth, etc.)
            $table->text('credentials'); // JSON encriptado
            
            // Configuración específica de la plataforma (mapping de campos, etc.)
            $table->json('config')->nullable();
            
            // Estado de la conexión
            $table->boolean('is_active')->default(true);
            
            // Última sincronización exitosa
            $table->timestamp('last_sync_at')->nullable();
            
            // Dirección de sincronización: 'pull', 'push', 'bidirectional'
            $table->enum('sync_direction', ['pull', 'push', 'bidirectional'])->default('bidirectional');
            
            // Frecuencia de sincronización automática (minutos)
            $table->integer('sync_interval_minutes')->default(30);
            
            // Mapeo de entidades: qué sincronizar
            $table->json('sync_entities')->nullable(); // ['products', 'orders', 'inventory', 'customers']
            
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['tenant_id', 'platform_type']);
            $table->index(['tenant_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('external_connections');
    }
};
