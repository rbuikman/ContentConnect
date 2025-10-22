<?php

namespace Database\Seeders;

use App\Models\Language;
use App\Models\Company;
use Illuminate\Database\Seeder;

class LanguageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first company to assign languages to
        $firstCompany = Company::first();
        
        if (!$firstCompany) {
            $this->command->error('No companies found. Please run CompanySeeder first.');
            return;
        }

        $languages = [
            ['name' => 'English', 'code' => 'EN', 'active' => true, 'company_id' => $firstCompany->id],
            ['name' => 'Dutch', 'code' => 'NL', 'active' => true, 'company_id' => $firstCompany->id],
            ['name' => 'French', 'code' => 'FR', 'active' => true, 'company_id' => $firstCompany->id],
            ['name' => 'German', 'code' => 'DE', 'active' => true, 'company_id' => $firstCompany->id],
            ['name' => 'Spanish', 'code' => 'ES', 'active' => true, 'company_id' => $firstCompany->id],
            ['name' => 'Italian', 'code' => 'IT', 'active' => true, 'company_id' => $firstCompany->id],
            ['name' => 'Portuguese', 'code' => 'PT', 'active' => true, 'company_id' => $firstCompany->id],
            ['name' => 'Turkish', 'code' => 'TR', 'active' => true, 'company_id' => $firstCompany->id],
            ['name' => 'Polish', 'code' => 'PL', 'active' => true, 'company_id' => $firstCompany->id],
            ['name' => 'Swedish', 'code' => 'SV', 'active' => true, 'company_id' => $firstCompany->id],
            ['name' => 'Norwegian', 'code' => 'NO', 'active' => true, 'company_id' => $firstCompany->id],
            ['name' => 'Danish', 'code' => 'DA', 'active' => true, 'company_id' => $firstCompany->id],
            ['name' => 'Finnish', 'code' => 'FI', 'active' => true, 'company_id' => $firstCompany->id],
            ['name' => 'Czech', 'code' => 'CS', 'active' => true, 'company_id' => $firstCompany->id],
        ];

        foreach ($languages as $languageData) {
            Language::firstOrCreate(
                ['code' => $languageData['code'], 'company_id' => $languageData['company_id']], 
                $languageData
            );
        }

        $this->command->info('Language seeder completed. Created ' . count($languages) . ' languages for company: ' . $firstCompany->name);
    }
}