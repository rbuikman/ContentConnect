<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Company;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Get the default company (Valke.net)
        $company = Company::where('name', 'Valke.net')->first();
        
        // If no company exists, create it
        if (!$company) {
            $company = Company::create([
                'name' => 'Valke.net',
                'numberoflicences' => 100
            ]);
        }

        $user = User::firstOrCreate(
            ['email' => 'rene@valke.net'],
            [
                'name' => 'Rene Buikman', 
                'password' => bcrypt('abcdefgh'),
                'company_id' => $company->id,
            ]
        );
        
        // Assign SuperAdmin role to the main user
        $superAdminRole = Role::firstOrCreate(['name' => 'SuperAdmin']);
        $user->assignRole($superAdminRole);
    }
}
