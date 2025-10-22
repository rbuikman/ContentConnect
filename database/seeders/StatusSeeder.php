<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Status;
use App\Models\Company;

class StatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Get the first company to assign statuses to
        $firstCompany = Company::first();
        
        if (!$firstCompany) {
            $this->command->error('No companies found. Please run CompanySeeder first.');
            return;
        }

        $statuses = [
            ['name' => 'Design', 'active' => true, 'company_id' => $firstCompany->id],
            ['name' => 'Review', 'active' => true, 'company_id' => $firstCompany->id],
            ['name' => 'Ready for Production', 'active' => true, 'company_id' => $firstCompany->id],
        ];

        foreach ($statuses as $statusData) {
            Status::firstOrCreate(
                ['name' => $statusData['name'], 'company_id' => $statusData['company_id']], 
                $statusData
            );
        }

        $this->command->info('Status seeder completed. Created ' . count($statuses) . ' statuses for company: ' . $firstCompany->name);
    }
}
