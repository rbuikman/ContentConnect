<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Company;

class UpdateRolesWithCompanySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first company to assign roles to
        $firstCompany = Company::first();
        
        if (!$firstCompany) {
            $this->command->error('No companies found. Please run CompanySeeder first.');
            return;
        }

        // Update existing roles to be assigned to the first company
        // SuperAdmin role should remain global (company_id = null) for system-wide access
        $roles = Role::whereNull('company_id')->get();
        
        foreach ($roles as $role) {
            if ($role->name === 'SuperAdmin') {
                // Keep SuperAdmin as global role
                $this->command->info('Keeping SuperAdmin role as global (no company assignment)');
                continue;
            }
            
            // Assign other roles to the first company
            $role->company_id = $firstCompany->id;
            $role->save();
            
            $this->command->info("Assigned role '{$role->name}' to company '{$firstCompany->name}'");
        }

        $this->command->info('Role-company assignment completed.');
    }
}
