<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('credit_lines', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->boolean('active')->default(true);
            $table->decimal('financing_limit', 15, 2);
            $table->decimal('annual_interest_rate', 7, 4);
            $table->unsignedSmallInteger('max_term_years');
            $table->unsignedSmallInteger('max_grace_years');
            $table->decimal('max_financeable_percentage', 7, 4);
            $table->decimal('default_ater_percentage', 7, 4);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
        Schema::create('proposals', function (Blueprint $table): void {
            $table->id();
            $table->string('number')->unique();
            $table->date('proposal_date');
            $table->foreignId('beneficiary_id')->constrained()->restrictOnDelete();
            $table->foreignId('property_id')->constrained()->restrictOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('activity')->nullable();
            $table->text('purpose')->nullable();
            $table->string('iater_unit')->nullable();
            $table->string('current_step')->default('INITIAL');
            $table->string('status')->default('RASCUNHO')->index();
            $table->json('completed_steps')->nullable();
            $table->unsignedInteger('revision')->default(0);
            $table->timestamps();
        });
        Schema::create('patrimony_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('proposal_id')->constrained()->cascadeOnDelete();
            $table->string('category');
            $table->string('description')->nullable();
            $table->string('unit', 30)->nullable();
            $table->decimal('quantity', 14, 4)->nullable();
            $table->decimal('unit_value', 15, 2)->nullable();
            $table->timestamps();
        });
        Schema::create('patrimony_debts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('proposal_id')->constrained()->cascadeOnDelete();
            $table->string('creditor')->nullable();
            $table->string('purpose')->nullable();
            $table->date('due_date')->nullable();
            $table->decimal('outstanding_balance', 15, 2)->nullable();
            $table->timestamps();
        });
        Schema::create('financing_scenarios', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('proposal_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('credit_line_id')->nullable()->constrained()->restrictOnDelete();
            $table->decimal('proposal_value', 15, 2)->nullable();
            $table->decimal('financeable_percentage', 7, 4)->nullable();
            $table->decimal('ater_percentage', 7, 4)->nullable();
            $table->decimal('annual_interest_rate', 7, 4)->nullable();
            $table->unsignedSmallInteger('term_years')->nullable();
            $table->unsignedSmallInteger('grace_years')->nullable();
            $table->string('grace_interest')->default('PAY');
            $table->string('periodicity')->default('ANNUAL');
            $table->timestamps();
        });
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
        Schema::create('proposal_identifications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('proposal_id')->unique()->constrained()->cascadeOnDelete();
            $table->text('market')->nullable();
            $table->decimal('last_year_revenue', 15, 2)->nullable();
            $table->text('location_analysis')->nullable();
            $table->text('considerations')->nullable();
            $table->timestamps();
        });
        Schema::create('proposal_jobs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('proposal_id')->constrained()->cascadeOnDelete();
            $table->string('category');
            $table->unsignedSmallInteger('current')->nullable();
            $table->unsignedSmallInteger('expansion')->nullable();
            $table->unique(['proposal_id', 'category']);
            $table->timestamps();
        });
        Schema::create('proposal_use_sources', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('proposal_id')->constrained()->cascadeOnDelete();
            $table->string('category');
            $table->decimal('planned', 15, 2)->nullable();
            $table->decimal('realized', 15, 2)->nullable();
            $table->unique(['proposal_id', 'category']);
            $table->timestamps();
        });
        Schema::create('cash_flow_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('proposal_id')->constrained()->cascadeOnDelete();
            $table->string('type');
            $table->string('description')->nullable();
            $table->string('unit', 30)->nullable();
            $table->decimal('quantity', 14, 4)->nullable();
            $table->decimal('unit_value', 15, 2)->nullable();
            for ($year = 2; $year <= 7; $year++) {
                $table->decimal('year_'.$year, 15, 2)->nullable();
            }
            $table->timestamps();
        });
        Schema::create('proposal_status_histories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('proposal_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->text('reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['proposal_status_histories', 'cash_flow_items', 'proposal_use_sources', 'proposal_jobs', 'proposal_identifications', 'guarantees', 'financing_scenarios', 'patrimony_debts', 'patrimony_items', 'proposals', 'credit_lines'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
