<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('credit_lines', function (Blueprint $table): void {
            $table->boolean('requires_guarantor')->default(false);
        });

        Schema::create('guarantees', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('proposal_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('guarantor_name')->nullable();
            $table->string('guarantor_cpf', 11)->nullable();
            $table->string('guarantor_phone', 11)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('guarantees');
        Schema::table('credit_lines', function (Blueprint $table): void {
            $table->dropColumn('requires_guarantor');
        });
    }
};
