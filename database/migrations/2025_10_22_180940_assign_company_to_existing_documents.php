<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Document;
use App\Models\Company;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Get the first company (or create one if none exists)
        $company = Company::first();
        
        if (!$company) {
            $company = Company::create([
                'name' => 'Default Company',
                'active' => true,
            ]);
        }

        // Update all existing document records to belong to this company
        Document::whereNull('company_id')->update([
            'company_id' => $company->id
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Set company_id back to null for document records
        Document::whereNotNull('company_id')->update([
            'company_id' => null
        ]);
    }
};
