<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('guarantees');
    }

    public function down(): void
    {
        Schema::create('guarantees', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('proposal_id')->constrained()->cascadeOnDelete();
            $table->string('type')->nullable();
            $table->text('description')->nullable();
            $table->string('guarantor_name')->nullable();
            $table->string('guarantor_cpf', 11)->nullable();
            $table->string('guarantor_phone', 11)->nullable();
            $table->decimal('estimated_value', 15, 2)->nullable();
            $table->timestamps();
        });
    }
};
