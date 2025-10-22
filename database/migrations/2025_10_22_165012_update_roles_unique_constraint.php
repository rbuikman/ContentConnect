<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            // Drop the existing unique constraint on name and guard_name
            $table->dropUnique(['name', 'guard_name']);
        });
        
        // Manually create the index with length limits to avoid MySQL 1000 byte limit
        // Limit name and guard_name to 100 characters each in the index
        DB::statement('ALTER TABLE roles ADD UNIQUE KEY roles_name_guard_company_unique (name(100), guard_name(100), company_id)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            // Drop the compound unique constraint
            $table->dropUnique('roles_name_guard_company_unique');
            
            // Re-add the original unique constraint on name and guard_name
            $table->unique(['name', 'guard_name']);
        });
    }
};
