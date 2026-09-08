<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('beneficiaries', function (Blueprint $table): void {
            $table->foreignId('created_by')->nullable()->after('id')->constrained('users')->nullOnDelete();
            $table->index('created_by');
        });

        Schema::table('properties', function (Blueprint $table): void {
            $table->foreignId('created_by')->nullable()->after('id')->constrained('users')->nullOnDelete();
            $table->index('created_by');
        });
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table): void {
            $table->dropForeign(['created_by']);
            $table->dropIndex(['created_by']);
            $table->dropColumn('created_by');
        });

        Schema::table('beneficiaries', function (Blueprint $table): void {
            $table->dropForeign(['created_by']);
            $table->dropIndex(['created_by']);
            $table->dropColumn('created_by');
        });
    }
};
