<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Category;
use App\Models\Company;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Only proceed if there are existing categories that need company assignment
        $existingCategories = Category::whereNull('company_id')->count();
        
        if ($existingCategories == 0) {
            // No existing categories to migrate - likely a fresh installation
            return;
        }

        // Get the first company (or create one if none exists)
        $company = Company::first();
        
        if (!$company) {
            $company = Company::create([
                'name' => 'Default Company',
                'active' => true,
            ]);
        }

        // Update all existing category records to belong to this company
        Category::whereNull('company_id')->update([
            'company_id' => $company->id
        ]);

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Set company_id back to null for category records
        Category::whereNotNull('company_id')->update([
            'company_id' => null
        ]);
        
    }
};
