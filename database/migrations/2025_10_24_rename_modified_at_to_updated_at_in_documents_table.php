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
        if (Schema::hasColumn('documents', 'modified_at')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->renameColumn('modified_at', 'updated_at');
            });
        }
        if (Schema::hasColumn('documents', 'updated_by')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->renameColumn('updated_by', 'updated_by');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('documents', 'updated_at')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->renameColumn('updated_at', 'modified_at');
            });
        }
        if (Schema::hasColumn('documents', 'updated_by')) {
            Schema::table('documents', function (Blueprint $table) {
                $table->renameColumn('updated_by', 'updated_by');
            });
        }
    }
};
