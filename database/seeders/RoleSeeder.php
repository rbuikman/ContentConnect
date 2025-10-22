<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Define the roles we want to create
        $expectedRoles = ['SuperAdmin', 'Admin', 'Designer', 'Producer'];
        
        // Clean up any old/unexpected roles that don't match our expected list
        $existingRoles = Role::whereNotIn('name', $expectedRoles)->get();
        if ($existingRoles->count() > 0) {
            $this->command->info('Cleaning up old roles: ' . $existingRoles->pluck('name')->implode(', '));
            foreach ($existingRoles as $oldRole) {
                // Remove role from all users before deleting
                $oldRole->users()->detach();
                $oldRole->delete();
            }
        }

        // Create all roles
        $superAdminRole = Role::firstOrCreate(['name' => 'SuperAdmin']);
        $adminRole = Role::firstOrCreate(['name' => 'Admin']);
        $designerRole = Role::firstOrCreate(['name' => 'Designer']);
        $producerRole = Role::firstOrCreate(['name' => 'Producer']);

        // Get all permissions
        $allPermissions = Permission::pluck('name')->toArray();
        
        if (empty($allPermissions)) {
            $this->command->error('No permissions found. Please run PermissionSeeder first.');
            return;
        }
        
        // SuperAdmin gets ALL permissions
        $superAdminRole->syncPermissions($allPermissions);
        
        // Admin role - all permissions except company permissions and superadmin
        $adminPermissions = array_filter($allPermissions, function ($permission) {
            return !str_starts_with($permission, 'company-') && $permission !== 'superadmin';
        });
        
        $adminRole->syncPermissions($adminPermissions);
        
        // Designer and Producer roles start with no permissions (can be assigned later)
        $designerRole->syncPermissions([]);
        $producerRole->syncPermissions([]);

        $this->command->info('Role seeder completed:');
        $this->command->info('- SuperAdmin: ' . count($allPermissions) . ' permissions');
        $this->command->info('- Admin: ' . count($adminPermissions) . ' permissions (excludes company permissions and superadmin)');
        $this->command->info('- Designer: 0 permissions (assign manually as needed)');
        $this->command->info('- Producer: 0 permissions (assign manually as needed)');
    }
}
