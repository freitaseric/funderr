<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('beneficiary_references', function (Blueprint $table) {
            $table->id();

            $table->foreignId('beneficiary_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->unsignedTinyInteger('position');

            $table->string('name');
            $table->string('phone', 11);

            $table->timestamps();

            $table->unique([
                'beneficiary_id',
                'position',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('beneficiary_references');
    }
};
