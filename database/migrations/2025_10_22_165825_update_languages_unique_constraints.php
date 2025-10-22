<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('languages', function (Blueprint $table) {
            // Drop the existing unique constraint on code
            $table->dropUnique(['code']);
            
            // Add compound unique constraints scoped by company
            // This allows same language names and codes across different companies
            $table->unique(['name', 'company_id'], 'languages_name_company_unique');
            $table->unique(['code', 'company_id'], 'languages_code_company_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('languages', function (Blueprint $table) {
            // Drop the compound unique constraints
            $table->dropUnique('languages_name_company_unique');
            $table->dropUnique('languages_code_company_unique');
            
            // Re-add the simple unique constraint on code
            $table->unique('code');
        });
    }
};
