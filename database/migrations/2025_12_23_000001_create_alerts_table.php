<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable()->index();
            $table->string('title');
            $table->text('message')->nullable();
            $table->string('level')->default('info')->index();
            $table->boolean('read')->default(false)->index();
            $table->json('data')->nullable();
            $table->timestamps();

            // if tenants table exists, use foreign key when possible
            try {
                $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            } catch (\Throwable $e) {
                // ignore if tenants table not present yet in migration order
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('alerts');
    }
};
