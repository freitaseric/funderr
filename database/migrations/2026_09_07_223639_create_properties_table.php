<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();

            $table->foreignId('beneficiary_id')
                ->constrained()
                ->restrictOnDelete();

            $table->string('denomination');

            $table->text('address');

            $table->enum('municipality', [
                'Alto Alegre',
                'Amajari',
                'Boa Vista',
                'Bonfim',
                'Cantá',
                'Caracaraí',
                'Caroebe',
                'Iracema',
                'Mucajaí',
                'Normandia',
                'Pacaraima',
                'Rorainópolis',
                'São João da Baliza',
                'São Luiz',
                'Uiramutã',
            ]);

            $table->string('state', 2)
                ->default('RR');

            $table->decimal(
                'total_area',
                12,
                4
            );

            $table->enum('occupancy_type', [
                'PROPRIA',
                'ARRENDADA',
                'POSSE',
                'COMODATO',
                'CONCESSAO',
                'ASSENTAMENTO',
            ]);

            $table->unsignedSmallInteger(
                'exploration_years'
            )->default(5);

            $table->enum('document_type', [
                'TITULO_DEFINITIVO',
                'ESCRITURA_PUBLICA',
                'CONTRATO_COMPRA_VENDA',
                'CONTRATO_ARRENDAMENTO',
                'TERMO_POSSE',
                'CCU',
                'OUTRO',
                'SEM_DOCUMENTO',
            ]);

            $table->decimal(
                'latitude',
                10,
                7
            )->nullable();

            $table->decimal(
                'longitude',
                10,
                7
            )->nullable();

            $table->timestamps();

            $table->index('beneficiary_id');
            $table->index('municipality');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};
