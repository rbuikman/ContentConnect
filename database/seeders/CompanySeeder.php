<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Company;

class CompanySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default company if it doesn't exist
        Company::firstOrCreate(
            ['name' => 'Valke.net'],
            [
                'name' => 'Valke.net',
                'numberoflicences' => 100
            ]
        );
    }
}
