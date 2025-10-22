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
            $table->foreignId('company_id')->nullable()->constrained()->onDelete('cascade');
        });

        // Update existing languages to use the first available company
        $firstCompany = \App\Models\Company::first();
        if ($firstCompany) {
            \App\Models\Language::whereNull('company_id')->update(['company_id' => $firstCompany->id]);
        }

        // Now make the column non-nullable
        Schema::table('languages', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('languages', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropColumn('company_id');
        });
    }
};
