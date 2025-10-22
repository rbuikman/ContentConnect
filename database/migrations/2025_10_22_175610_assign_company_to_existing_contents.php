<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Content;
use App\Models\Company;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Only proceed if there are existing contents that need company assignment
        $existingContents = Content::whereNull('company_id')->count();
        
        if ($existingContents == 0) {
            // No existing contents to migrate - likely a fresh installation
            return;
        }

        // Get the first company (or create one if none exists)
        $company = Company::first();
        
        if (!$company) {
            $company = Company::create([
                'name' => 'Default Company',
                'numberoflicences' => 1, // Provide a default value for the required field
                'active' => true,
            ]);
        }

        // Update all existing content records to belong to this company
        Content::whereNull('company_id')->update([
            'company_id' => $company->id
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Set company_id back to null for content records
        Content::whereNotNull('company_id')->update([
            'company_id' => null
        ]);
    }
};
