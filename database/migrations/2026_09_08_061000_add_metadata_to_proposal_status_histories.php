<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proposal_status_histories', function (Blueprint $table): void {
            $table->json('metadata')->nullable()->after('reason');
        });
    }

    public function down(): void
    {
        Schema::table('proposal_status_histories', function (Blueprint $table): void {
            $table->dropColumn('metadata');
        });
    }
};
