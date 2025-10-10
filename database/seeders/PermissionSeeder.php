<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $permissions = [
            'role-index',
            'role-create',
            'role-edit',
            'role-delete',
            'user-index',
            'user-create',
            'user-edit',
            'user-delete',
            'documents-index',
            'documents-create',
            'documents-edit',
            'documents-delete',
         ];
    
         foreach ($permissions as $permission) {
              Permission::create(['name' => $permission]);
         }
    }
}
