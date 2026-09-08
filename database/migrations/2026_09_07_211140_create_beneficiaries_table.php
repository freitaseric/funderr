<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('beneficiaries', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('nickname')->nullable();

            $table->string('cpf', 11)->unique();
            $table->string('rg')->nullable();
            $table->string('phone', 11);

            $table->date('birth_date');

            $table->string('place_of_birth');

            $table->enum('marital_status', [
                'SOLTEIRO',
                'CASADO',
                'UNIAO_ESTAVEL',
                'DIVORCIADO',
                'SEPARADO',
                'VIUVO',
            ]);

            $table->enum('education_level', [
                'SEM_ESCOLARIDADE',
                'FUNDAMENTAL_INCOMPLETO',
                'FUNDAMENTAL_COMPLETO',
                'MEDIO_INCOMPLETO',
                'MEDIO_COMPLETO',
                'SUPERIOR_INCOMPLETO',
                'SUPERIOR_COMPLETO',
                'POS_GRADUACAO',
            ]);

            $table->unsignedSmallInteger('dependents');

            $table->text('address');

            $table->string('spouse_name')->nullable();
            $table->string('spouse_cpf', 11)->nullable();
            $table->string('spouse_rg')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beneficiaries');
    }
};
