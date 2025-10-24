<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('statuses', function (Blueprint $table) {
            // Drop the existing unique constraint on name if it exists
           // $table->dropUnique(['name']);
            // Add compound unique constraint scoped by company
            $table->unique(['name', 'company_id'], 'statuses_name_company_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('statuses', function (Blueprint $table) {
           // $table->dropUnique('statuses_name_company_unique');
            $table->unique(['name']);
        });
    }
};
