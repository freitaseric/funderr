<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('credit_lines', function (Blueprint $table): void {
            if (Schema::hasColumn('credit_lines', 'code')) {
                $table->dropUnique(['code']);
                $table->dropColumn('code');
            }
            if (Schema::hasColumn('credit_lines', 'eligible_beneficiaries')) {
                $table->dropColumn('eligible_beneficiaries');
            }
        });
    }

    public function down(): void
    {
        Schema::table('credit_lines', function (Blueprint $table): void {
            if (! Schema::hasColumn('credit_lines', 'code')) {
                $table->string('code')->nullable()->unique();
            }
            if (! Schema::hasColumn('credit_lines', 'eligible_beneficiaries')) {
                $table->text('eligible_beneficiaries')->nullable();
            }
        });
    }
};
