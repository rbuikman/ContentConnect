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
            'document-index',
            'document-create',
            'document-edit',
            'document-delete',
            'templates-index',
            'templates-create',
            'templates-edit',
            'templates-delete',
            'content-index',
            'content-create',
            'content-edit',
            'content-delete',
            'status-index',
            'status-create',
            'status-edit',
            'status-delete',
            'language-index',
            'language-create',
            'language-edit',
            'language-delete',
            'company-index',
            'company-create',
            'company-edit',
            'company-delete',
            'superadmin',
            'category-index',
            'category-create',
            'category-edit',
            'category-delete',
            'subcategory-index',
            'subcategory-create',
            'subcategory-edit',
            'subcategory-delete',
         ];
    
         foreach ($permissions as $permission) {
              Permission::firstOrCreate(['name' => $permission]);
         }
    }
}
